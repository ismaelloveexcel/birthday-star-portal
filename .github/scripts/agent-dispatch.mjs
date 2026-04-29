// Dispatcher: read .github/agent-backlog.yml, find items whose dependencies
// are all merged and that have no open issue/PR yet, and open one issue per
// ready item assigned to @copilot.
//
// Required env: GH_TOKEN, GITHUB_REPOSITORY (owner/repo).
// Optional env: DRY_RUN ("true" to log only), MAX_OPEN (default 5).

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) throw new Error('GITHUB_REPOSITORY not set');
const dryRun = (process.env.DRY_RUN || 'false') === 'true';

// Fail-closed parsing: a misconfigured MAX_OPEN must NEVER silently disable the
// back-pressure cap (NaN comparisons would break the budget check).
function parsePositiveInt(raw, fallback, name) {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.warn(`WARN: invalid ${name}=${JSON.stringify(raw)}; falling back to ${fallback}`);
    return fallback;
  }
  return n;
}
const maxOpen = parsePositiveInt(process.env.MAX_OPEN, 5, 'MAX_OPEN');

function gh(args, input) {
  return execSync(`gh ${args}`, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env,
  });
}

function ghJson(args, input) {
  return JSON.parse(gh(args, input));
}

const backlog = yaml.load(readFileSync('.github/agent-backlog.yml', 'utf8'));
const items = backlog.items || [];
const defaults = backlog.defaults || {};

// --- cycle / unknown-dep detection ---
const ids = new Set(items.map((i) => i.id));
for (const it of items) {
  for (const dep of it.depends_on || []) {
    if (!ids.has(dep)) throw new Error(`Item ${it.id} depends on unknown ${dep}`);
  }
}
{
  const indeg = new Map(items.map((i) => [i.id, (i.depends_on || []).length]));
  const queue = items.filter((i) => indeg.get(i.id) === 0).map((i) => i.id);
  let visited = 0;
  while (queue.length) {
    const id = queue.shift();
    visited++;
    for (const it of items) {
      if ((it.depends_on || []).includes(id)) {
        indeg.set(it.id, indeg.get(it.id) - 1);
        if (indeg.get(it.id) === 0) queue.push(it.id);
      }
    }
  }
  if (visited !== items.length) throw new Error('Dependency cycle in agent-backlog.yml');
}

// --- gather state ---
// NOTE: do NOT add `pullRequest` to the --json field list here. `gh issue list`
// rejects it ("Unknown JSON field") and the whole dispatcher exits non-zero,
// silently halting all autonomous work. We only need labels/state/number.
const allIssues = ghJson(
  `issue list --repo ${repo} --state all --limit 500 --label agent-pr --json number,state,labels,title`,
);
const allPRs = ghJson(
  `pr list --repo ${repo} --state all --limit 500 --label agent-pr --json number,state,mergedAt,labels,title,headRefName`,
);

const openAgentPRs = allPRs.filter((p) => p.state === 'OPEN');
const mergedIdsByLabel = new Set(
  allPRs
    .filter((p) => p.state === 'MERGED')
    .flatMap((p) => p.labels.map((l) => l.name))
    .filter((n) => n.startsWith('agent-id:'))
    .map((n) => n.slice('agent-id:'.length)),
);

// Anything we've ever opened for an id (open issue, open PR, merged PR, or
// closed-without-merge — closed-without-merge means human killed it; do NOT
// re-dispatch automatically).
const touchedIds = new Set();
for (const i of allIssues) {
  for (const l of i.labels) if (l.name.startsWith('agent-id:')) touchedIds.add(l.name.slice(9));
}
for (const p of allPRs) {
  for (const l of p.labels) if (l.name.startsWith('agent-id:')) touchedIds.add(l.name.slice(9));
}

console.log(`State: ${openAgentPRs.length} open agent PRs (cap ${maxOpen}); merged ids: [${[...mergedIdsByLabel].join(', ')}]`);

// --- ensure required labels exist (best-effort) ---
function ensureLabel(name, color, desc) {
  try {
    execSync(`gh label create "${name}" --repo ${repo} --color ${color} --description "${desc}"`, {
      stdio: 'ignore',
      env: process.env,
    });
  } catch {
    /* already exists */
  }
}
ensureLabel('agent-pr', 'ededed', 'Opened by autonomous dispatcher');
ensureLabel('veto', 'b60205', 'Block auto-merge of this PR');
ensureLabel('hold', 'fbca04', 'Hold auto-merge until removed');
ensureLabel('do-not-merge', 'b60205', 'Permanent block on auto-merge');
ensureLabel('merge-anytime', '0e8a16', 'Bypass quiet-hours window');
ensureLabel('needs-human', 'd93f0b', 'Touches CODEOWNERS-protected paths');
ensureLabel('needs-rebase', 'fbca04', 'Auto-rebase failed; manual resolution required');

// --- pick ready items ---
let budget = Math.max(0, maxOpen - openAgentPRs.length);
const ready = [];
for (const it of items) {
  if (touchedIds.has(it.id)) continue;
  const depsMet = (it.depends_on || []).every((d) => mergedIdsByLabel.has(d));
  if (!depsMet) continue;
  ready.push(it);
}

console.log(`Ready to dispatch (${ready.length}): ${ready.map((r) => r.id).join(', ') || '(none)'}`);
if (budget === 0 && ready.length > 0) {
  console.log(`At max-open cap (${maxOpen}); deferring.`);
}

for (const it of ready) {
  if (budget <= 0) break;
  const labels = [...new Set([...(defaults.labels || []), ...(it.labels || []), `agent-id:${it.id}`])];
  ensureLabel(`agent-id:${it.id}`, 'c5def5', `Dispatcher idempotency key for ${it.id}`);

  const body = [
    `> Dispatched by \`.github/workflows/agent-dispatch.yml\` from backlog id \`${it.id}\`.`,
    '',
    `**Branch:** \`${it.branch}\`  `,
    `**Base:** \`${defaults.base || 'main'}\`  `,
    `**Scope (allow-list):**`,
    ...it.scope.map((s) => `- \`${s}\``),
    '',
    '**Hard rules:**',
    '- Open the PR against `' + (defaults.base || 'main') + '` from branch `' + it.branch + '`.',
    '- Apply labels: ' + labels.map((l) => `\`${l}\``).join(', ') + '.',
    '- Do not touch any path outside the scope allow-list above. The auto-merge',
    '  workflow will refuse to merge a PR with out-of-scope changes.',
    '- Do not edit `.github/workflows/**`, `CODEOWNERS`, or this backlog file.',
    '- Run `npm run lint && npm test && npm run build` before opening the PR.',
    '',
    '---',
    '',
    it.prompt.trim(),
  ].join('\n');

  console.log(`→ Dispatch ${it.id} (budget left: ${budget})`);
  if (dryRun) {
    console.log(`  [dry-run] would create issue "${it.title}" with labels [${labels.join(', ')}]`);
    continue;
  }

  const labelArgs = labels.map((l) => `--label ${JSON.stringify(l)}`).join(' ');
  const issueUrl = gh(
    `issue create --repo ${repo} --title ${JSON.stringify(it.title)} --body-file - ${labelArgs}`,
    body,
  ).trim();
  console.log(`  created ${issueUrl}`);

  // Best-effort: assign to Copilot. This requires a PAT with `Issues: write`
  // permission — the default GITHUB_TOKEN cannot perform the GraphQL
  // `replaceActorsForAssignable` mutation against the Copilot bot and will
  // fail with "Bot does not have access to the repository". Set the repo
  // secret COPILOT_ASSIGN_TOKEN to a fine-grained PAT scoped to this repo
  // with Issues + Pull requests write access. Without it, the issue is
  // created but the Copilot SWE agent never picks it up — the loop stalls
  // until a human clicks "Assign to Agent" on the issue.
  const issueNum = issueUrl.split('/').pop();
  const assignToken = process.env.COPILOT_ASSIGN_TOKEN;
  if (!assignToken) {
    console.log(
      `  WARN: COPILOT_ASSIGN_TOKEN secret is not set; issue #${issueNum} ` +
        'left unassigned. The Copilot SWE agent will NOT pick this up ' +
        'automatically. See docs/autonomy.md "Required permissions".',
    );
  } else {
    try {
      execSync(
        `gh issue edit ${issueNum} --repo ${repo} --add-assignee Copilot`,
        {
          stdio: 'inherit',
          env: { ...process.env, GH_TOKEN: assignToken, GITHUB_TOKEN: assignToken },
        },
      );
      console.log(`  assigned Copilot to #${issueNum}`);
    } catch {
      console.log(
        `  WARN: COPILOT_ASSIGN_TOKEN is set but assigning Copilot to ` +
          `#${issueNum} failed. Verify the PAT has Issues:write on this ` +
          'repo and that Copilot coding agent is enabled in Settings → ' +
          'Code & automation → Copilot.',
      );
    }
  }

  budget--;
}

console.log('Dispatcher done.');
