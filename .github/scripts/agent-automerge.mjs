// Auto-merge: every 15 min, walk open `agent-pr` PRs and enable auto-merge
// for any that pass ALL guardrails:
//
//   1. Opened ≥ MIN_AGE_HOURS ago (default 2)             — veto window
//   2. No `veto` / `hold` / `do-not-merge` label          — explicit human stop
//   3. No `needs-human` / `needs-rebase` label            — auto-applied stops
//   4. All required CI checks green (mergeable + clean)   — quality gate
//   5. Outside QUIET_HOURS unless `merge-anytime` label   — operator-asleep gate
//   6. No changed file outside the item's declared scope  — blast-radius gate
//   7. No changed file matches a CODEOWNERS-protected path — sensitive-path gate
//
// Required env: GH_TOKEN, GITHUB_REPOSITORY.
// Optional env: MIN_AGE_HOURS (default 2), QUIET_HOURS (default "22-7"),
//   QUIET_TZ (default "Asia/Dubai"), DRY_RUN ("true").

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';
import { minimatch } from 'minimatch';

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) throw new Error('GITHUB_REPOSITORY not set');

// Fail-closed parsing for guardrail tunables: a misconfigured value must NEVER
// silently disable a guardrail. Invalid input → fall back to safe default and warn.
function parsePositiveNumber(raw, fallback, name) {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    console.warn(`WARN: invalid ${name}=${JSON.stringify(raw)}; falling back to ${fallback}`);
    return fallback;
  }
  return n;
}
function parseQuietRange(raw, fallback) {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(raw || '');
  if (!m) {
    console.warn(`WARN: invalid QUIET_HOURS=${JSON.stringify(raw)}; falling back to ${fallback}`);
    return fallback;
  }
  const start = Number(m[1]);
  const end = Number(m[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > 23 || end < 0 || end > 23) {
    console.warn(`WARN: QUIET_HOURS hours out of 0–23 range (${raw}); falling back to ${fallback}`);
    return fallback;
  }
  return { start, end };
}

const minAge = parsePositiveNumber(process.env.MIN_AGE_HOURS, 2, 'MIN_AGE_HOURS');
const dryRun = (process.env.DRY_RUN || 'false') === 'true';
const quietHours = parseQuietRange(process.env.QUIET_HOURS, { start: 22, end: 7 }); // end-exclusive
const quietTz = process.env.QUIET_TZ || 'Asia/Dubai';

function gh(args) {
  return execSync(`gh ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], env: process.env });
}
function ghJson(args) {
  return JSON.parse(gh(args));
}

// --- helpers ---
function inQuietHours() {
  const { start, end } = quietHours;
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: quietTz }).format(new Date()),
  );
  // wraps midnight if start > end
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

function comment(num, msg) {
  if (dryRun) {
    console.log(`  [dry-run] would comment on #${num}: ${msg}`);
    return;
  }
  try {
    execSync(`gh pr comment ${num} --repo ${repo} --body ${JSON.stringify(msg)}`, {
      stdio: 'ignore',
      env: process.env,
    });
  } catch {
    /* ignore */
  }
}

function addLabel(num, label) {
  if (dryRun) {
    console.log(`  [dry-run] would add label ${label} to #${num}`);
    return;
  }
  try {
    execSync(`gh pr edit ${num} --repo ${repo} --add-label "${label}"`, { stdio: 'ignore', env: process.env });
  } catch {
    /* ignore */
  }
}

// --- load backlog scope map ---
const backlogPath = '.github/agent-backlog.yml';
const backlog = existsSync(backlogPath) ? yaml.load(readFileSync(backlogPath, 'utf8')) : { items: [] };
const scopeById = new Map((backlog.items || []).map((i) => [i.id, i.scope || []]));

// --- load CODEOWNERS protected paths ---
function loadCodeowners() {
  const candidates = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];
  for (const p of candidates) {
    if (existsSync(p)) {
      return readFileSync(p, 'utf8')
        .split('\n')
        .map((l) => l.replace(/#.*$/, '').trim())
        .filter(Boolean)
        .map((l) => l.split(/\s+/)[0])
        .filter(Boolean);
    }
  }
  return [];
}
const protectedPatterns = loadCodeowners();

// CODEOWNERS uses gitignore-ish syntax. Convert each pattern to a minimatch
// glob and test changed files. Leading `/` means repo-rooted; trailing `/`
// means a directory (any descendant).
function matchesCodeowners(file) {
  for (const raw of protectedPatterns) {
    if (raw === '*') continue; // a catch-all CODEOWNERS line is not a "sensitive" signal
    let p = raw;
    const rooted = p.startsWith('/');
    if (rooted) p = p.slice(1);
    if (p.endsWith('/')) p += '**';
    const candidates = rooted ? [p] : [p, `**/${p}`];
    if (candidates.some((c) => minimatch(file, c, { dot: true }))) return true;
  }
  return false;
}

function getAgentId(labels) {
  const l = labels.find((x) => x.name.startsWith('agent-id:'));
  return l ? l.name.slice('agent-id:'.length) : null;
}

// --- main ---
const prs = ghJson(
  `pr list --repo ${repo} --state open --label agent-pr --limit 100 ` +
    `--json number,title,headRefName,createdAt,labels,mergeable,isDraft,reviewDecision,statusCheckRollup,files`,
);

console.log(`Found ${prs.length} open agent-pr PR(s)`);
const quiet = inQuietHours();
if (quiet) console.log(`Quiet hours active (${quietHours.start}-${quietHours.end} ${quietTz}); only merge-anytime PRs eligible.`);

for (const pr of prs) {
  const labels = pr.labels.map((l) => ({ name: l.name }));
  const labelNames = new Set(labels.map((l) => l.name));
  const tag = `#${pr.number} (${pr.title})`;

  if (pr.isDraft) {
    console.log(`SKIP ${tag}: draft`);
    continue;
  }
  const blocker = ['veto', 'hold', 'do-not-merge', 'needs-human', 'needs-rebase'].find((b) => labelNames.has(b));
  if (blocker) {
    console.log(`SKIP ${tag}: blocked by label "${blocker}"`);
    continue;
  }

  const ageHours = (Date.now() - new Date(pr.createdAt).getTime()) / 3_600_000;
  if (ageHours < minAge) {
    console.log(`SKIP ${tag}: too young (${ageHours.toFixed(2)}h < ${minAge}h veto window)`);
    continue;
  }

  if (quiet && !labelNames.has('merge-anytime')) {
    console.log(`SKIP ${tag}: quiet hours and no merge-anytime label`);
    continue;
  }

  // CI status — require all checks completed and successful.
  const checks = pr.statusCheckRollup || [];
  const failing = checks.filter((c) => ['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED'].includes((c.conclusion || c.status || '').toUpperCase()));
  const pending = checks.filter((c) => ['QUEUED', 'IN_PROGRESS', 'PENDING', 'WAITING'].includes((c.status || '').toUpperCase()) && !c.conclusion);
  if (failing.length) {
    console.log(`SKIP ${tag}: ${failing.length} failing check(s)`);
    continue;
  }
  if (pending.length) {
    console.log(`SKIP ${tag}: ${pending.length} pending check(s)`);
    continue;
  }
  // Mergeable gate: fail-closed. Only proceed when GitHub has computed the
  // merge status AND it's MERGEABLE. Treat null/UNKNOWN/CONFLICTING/etc. as
  // not-mergeable so a freshly opened PR (status still computing) can't slip
  // through if the veto window is ever shortened.
  if (pr.mergeable !== 'MERGEABLE') {
    console.log(`SKIP ${tag}: mergeable=${pr.mergeable ?? 'null'}`);
    continue;
  }

  // Scope allow-list check.
  const id = getAgentId(labels);
  const scope = id ? scopeById.get(id) : null;
  const changedFiles = (pr.files || []).map((f) => f.path);
  if (scope && scope.length) {
    const offenders = changedFiles.filter((f) => !scope.some((g) => minimatch(f, g, { dot: true })));
    if (offenders.length) {
      console.log(`SKIP ${tag}: ${offenders.length} out-of-scope file(s); applying needs-human`);
      addLabel(pr.number, 'needs-human');
      comment(
        pr.number,
        `🛑 Auto-merge declined — files outside declared scope for \`${id}\`:\n\n` +
          offenders.slice(0, 20).map((f) => `- \`${f}\``).join('\n') +
          (offenders.length > 20 ? `\n…and ${offenders.length - 20} more` : '') +
          `\n\nDeclared scope: ${scope.map((g) => `\`${g}\``).join(', ')}`,
      );
      continue;
    }
  }

  // CODEOWNERS-protected paths.
  const sensitive = changedFiles.filter(matchesCodeowners);
  if (sensitive.length) {
    console.log(`SKIP ${tag}: ${sensitive.length} CODEOWNERS-protected file(s); applying needs-human`);
    addLabel(pr.number, 'needs-human');
    comment(
      pr.number,
      `🛑 Auto-merge declined — touches CODEOWNERS-protected paths:\n\n` +
        sensitive.slice(0, 20).map((f) => `- \`${f}\``).join('\n') +
        `\n\nA human reviewer must approve before merge.`,
    );
    continue;
  }

  // All gates passed → enable auto-merge (squash).
  console.log(`MERGE ${tag}: all gates green, enabling auto-merge (squash)`);
  if (dryRun) continue;
  try {
    execSync(`gh pr merge ${pr.number} --repo ${repo} --auto --squash --delete-branch`, {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (e) {
    console.log(`  failed to enable auto-merge on #${pr.number}: ${e.message}`);
  }
}

console.log('Auto-merge sweep done.');
