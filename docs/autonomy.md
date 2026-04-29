# Autonomy runbook

The repo runs an autonomous PR loop:

```
agent-backlog.yml ──► agent-dispatch (cron 30m) ──► issue assigned to @copilot
                                                           │
                                                           ▼
                                                   Copilot opens PR
                                                  (label: agent-pr)
                                                           │
                  ┌────────────────────────────────────────┤
                  │                                        │
       agent-rebase (on push to main)        agent-automerge (cron 15m)
       keeps siblings up-to-date             merges when ALL gates green
```

## The loop in one paragraph

The dispatcher reads `.github/agent-backlog.yml`, finds every item whose
`depends_on` items are **merged**, and opens one issue per ready item assigned
to `@copilot`. Copilot opens a PR with the `agent-pr` label and an
`agent-id:<id>` label. The auto-merge sweep checks that PR every 15 min and
enables auto-merge only when all guardrails clear (see below). When `main`
moves, the rebase workflow updates every open agent PR's branch so siblings
re-test against the new base.

## The 2-hour veto window

Every agent PR sits for at least `AGENT_VETO_HOURS` (default **2 h**) after
opening before the auto-merge sweep will touch it. To veto during that window
(or at any later time), add one of:

| Label           | Effect                                               |
| --------------- | ---------------------------------------------------- |
| `veto`          | Block auto-merge of this PR (lift by removing label) |
| `hold`          | Temporary pause                                      |
| `do-not-merge`  | Permanent block                                      |
| `needs-human`   | Auto-applied when scope or CODEOWNERS guardrail trips |
| `needs-rebase`  | Auto-applied on rebase conflict                      |

To bypass quiet hours (default 22:00–07:00 Asia/Dubai) on a single PR, add
`merge-anytime`.

## Global kill switch

Set repo variable **`AUTONOMY_PAUSED=true`** (Settings → Secrets and variables
→ Actions → Variables). All three workflows skip while it is `true`. No code
change required to disable.

## Tunables (repo variables)

| Variable             | Default        | Meaning                                     |
| -------------------- | -------------- | ------------------------------------------- |
| `AUTONOMY_PAUSED`    | _(unset)_      | `true` to pause dispatcher / merger / rebaser |
| `AGENT_MAX_OPEN`     | `5`            | Max simultaneously open `agent-pr` PRs      |
| `AGENT_VETO_HOURS`   | `2`            | Min PR age before auto-merge considers it   |
| `AGENT_QUIET_HOURS`  | `22-7`         | Local-hour range when auto-merge sleeps     |
| `AGENT_QUIET_TZ`     | `Asia/Dubai`   | IANA timezone for quiet hours               |

## Adding a backlog item

Append to `items:` in `.github/agent-backlog.yml`:

```yaml
- id: pr-9-thing                        # MUST be unique forever
  title: "PR 9 — short description"
  branch: agent/pr-9-thing
  depends_on: [pr-1-dx-unblock]         # merged-PR labels needed first
  scope:                                # allow-list of globs
    - "app/foo/**"
    - "tests/**"
  prompt: |
    What you want the agent to do, in plain English.
```

The dispatcher will pick it up on its next cron tick (≤ 30 min) — or run
**Actions → Agent Dispatch → Run workflow** for an immediate dry-run.

## Vetoing or stopping a runaway

1. **One PR is wrong:** add `veto`. The sweep will skip it forever.
2. **The whole queue is wrong:** set `AUTONOMY_PAUSED=true`. All three
   workflows will no-op on their next tick.
3. **Already merged something bad:** revert via the GitHub UI ("Revert" on the
   merged PR). The revert PR is a normal PR; CI will run; you merge it like
   any human PR. The dispatcher will not re-dispatch the same id (closed
   issues / merged PRs both count as "touched").

## Guardrails (what auto-merge will NOT do)

- Merge a PR younger than `AGENT_VETO_HOURS`.
- Merge a PR with `veto`, `hold`, `do-not-merge`, `needs-human`, or
  `needs-rebase`.
- Merge during quiet hours unless `merge-anytime` is set.
- Merge with any failing or pending check.
- Merge a PR whose changed files fall outside its declared scope (auto-labels
  `needs-human`, posts a comment listing offenders).
- Merge a PR touching a CODEOWNERS-protected path (workflows, deps, configs,
  spec docs — see `.github/CODEOWNERS`). Auto-labels `needs-human`.

## Recommended branch protection (manual, one-time)

Settings → Branches → `main`:

- Require a pull request before merging
- Require status checks to pass: `build` (from `.github/workflows/ci.yml`)
- Require branches to be up to date before merging
- Require review from Code Owners
- Allow auto-merge

With "Require review from Code Owners" enabled, even a buggy auto-merger
cannot merge a CODEOWNERS-protected change without a human approval.

## Required permissions

The default `GITHUB_TOKEN` is sufficient for issues, PR labels, comments, and
`update-branch`. To assign issues to **Copilot** (which actually triggers the
Copilot coding agent), the repo must have Copilot coding agent enabled in
**Settings → Code & automation → Copilot**. If Copilot assignment fails the
dispatcher logs and continues; the issue is still created for a human to pick
up.
