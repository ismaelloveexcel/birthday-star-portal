<!--
Auto-merge eligibility (agent-pr only): all unchecked items below MUST
clear before this PR is auto-merged. Reviewer: skim the "30-second review"
first; if anything looks wrong, add the `veto` label and the workflow will
back off.
-->

## 30-second review

<!-- Agent: fill these three lines so a human can veto in seconds. -->
- **What changed (one line):**
- **Why this is safe (one line):**
- **Preview / smoke evidence (link or paste):**

## Scope

- Backlog id: `agent-id:<id>` (auto-applied)
- Files changed are within the scope allow-list declared in `.github/agent-backlog.yml` for this id.

## Veto controls

| Action                          | How                                            |
| ------------------------------- | ---------------------------------------------- |
| Block auto-merge of THIS PR     | Add label `veto` (permanent) or `hold` (temp)  |
| Permanently block               | Add label `do-not-merge`                       |
| Bypass quiet hours              | Add label `merge-anytime`                      |
| Pause ALL autonomy repo-wide    | Set repo variable `AUTONOMY_PAUSED=true`       |

## Checklist (agent fills in)

- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] No files outside declared scope
- [ ] No new dependencies, OR new deps justified in PR body
- [ ] No edits to `.github/workflows/**`, `CODEOWNERS`, or `agent-backlog.yml`
