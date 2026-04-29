// On every push to main, rebase every open `agent-pr` PR onto the new base
// using GitHub's `update-branch` API (which performs a merge-from-base, not a
// true rebase, but achieves the same goal: re-runs CI against fresh main and
// surfaces conflicts immediately).
//
// On 422 (conflict) responses, label `needs-rebase` and post a comment so the
// auto-merge sweep stops considering the PR until a human or the agent
// resolves it.
//
// Required env: GH_TOKEN, GITHUB_REPOSITORY.

import { execSync } from 'node:child_process';

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) throw new Error('GITHUB_REPOSITORY not set');

function gh(args) {
  return execSync(`gh ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], env: process.env });
}

const prs = JSON.parse(
  gh(`pr list --repo ${repo} --state open --label agent-pr --limit 100 --json number,title,headRefName,labels`),
);

console.log(`Rebasing ${prs.length} open agent-pr PR(s)`);

for (const pr of prs) {
  const labelNames = new Set(pr.labels.map((l) => l.name));
  if (labelNames.has('do-not-merge') || labelNames.has('needs-human')) {
    console.log(`SKIP #${pr.number}: blocked label`);
    continue;
  }
  console.log(`→ update-branch on #${pr.number} (${pr.headRefName})`);
  try {
    execSync(
      `gh api -X PUT repos/${repo}/pulls/${pr.number}/update-branch -H "Accept: application/vnd.github+json"`,
      { stdio: 'inherit', env: process.env },
    );
  } catch (e) {
    const msg = (e.stderr && e.stderr.toString()) || e.message || '';
    if (msg.includes('422') || /merge conflict/i.test(msg)) {
      console.log(`  conflict on #${pr.number}; labelling needs-rebase`);
      try {
        execSync(`gh pr edit ${pr.number} --repo ${repo} --add-label "needs-rebase"`, { stdio: 'ignore', env: process.env });
        execSync(
          `gh pr comment ${pr.number} --repo ${repo} --body ${JSON.stringify(
            '⚠️ Auto-rebase failed against new `main`. Branch has merge conflicts. ' +
              'Re-dispatch the agent or resolve manually, then remove the `needs-rebase` label.',
          )}`,
          { stdio: 'ignore', env: process.env },
        );
      } catch {
        /* ignore */
      }
    } else {
      console.log(`  unknown error on #${pr.number}: ${msg.split('\n')[0]}`);
    }
  }
}

console.log('Rebase sweep done.');
