# VS Code MCP cowork setup

This workspace includes `.vscode/mcp.json` for the agent cowork workflow.

## Included servers

| Server | Purpose |
| --- | --- |
| `notion` | Read saved deployment/API notes from Notion. |
| `github` | Work with GitHub repositories, issues, and pull requests. |
| `vercel` | Access Vercel deployment and environment tooling. |
| `supabase-readonly` | Supabase project docs, schema inspection, logs, advisors, and read-only DB queries. |
| `postgres-staging` | Read/verify the staging Supabase/Postgres database. |
| `ludo-ai` | Game-specific asset generation: sprites, icons, UI assets, textures, 3D, audio, videos, and playables. |
| `replicate` | Broader AI model access for image generation, upscaling, style exploration, and asset cleanup. |
| `figma-context` | Pull CSS-aligned Figma design context into the agent for higher-fidelity UI/game screens. |
| `playwright` | Browser checks and deployed app verification. |

## First run

1. Open this workspace in VS Code Insiders.
2. Open the MCP/agent tools panel and start the configured MCP servers.
3. When VS Code prompts for inputs, paste the relevant tokens or URLs from your password manager/Notion.
4. Keep secrets out of repo files. The config uses password prompts so tokens are not committed.

## Credential checklist

- Notion integration secret with access to the pages that store deployment/API notes.
- GitHub token with access to `ismaelloveexcel/birthday-star-portal`.
- Vercel token with access to the staging project.
- Supabase staging project ref, from Project Settings > General > Project ID.
- Staging `DATABASE_URL` for Supabase/Postgres, preferably a pooled URL with `sslmode=require` when required by the provider.
- Ludo.ai API key on a plan with API/MCP access.
- Replicate API token.
- Figma personal access token for design files.

## Supabase setup

Use both Supabase entries, because they cover different jobs:

- `supabase-readonly` is the safer default for project inspection, docs, logs, advisors, schema discovery, and read-only SQL. It is project-scoped and read-only.
- `postgres-staging` connects directly to the staging database URL and is useful for the repo's `verify:db` flow and SQL-level checks.

Keep Supabase MCP scoped to the staging project. Do not point it at production while building or testing RSSE.

## Lemon Squeezy setup

There is not a mature official Lemon Squeezy MCP server in the same sense as Supabase or GitHub. For payment work, use this workflow instead:

1. Store Lemon Squeezy setup notes in Notion, including store ID, product/variant IDs, buy URL, webhook URL, and whether the key is test or live.
2. Keep actual API keys and webhook secrets in the password manager/Vercel env, not committed files.
3. Use the repo's existing signed webhook path for fulfillment: `/api/webhooks/lemon-squeezy`.
4. Use `SMOKE_USE_LEMON_WEBHOOK=1` with `LEMON_SQUEEZY_WEBHOOK_SECRET` to prove signed webhook fulfillment and retry against staging.
5. For a payment setup doctor, use `npx fresh-squeezy doctor --store-ids <store-id> --product-id <product-id> --webhook-url https://<staging-url>/api/webhooks/lemon-squeezy` with `LEMON_SQUEEZY_API_KEY` set in the shell.

The agent can read Lemon Squeezy setup notes through Notion and can set the server-side webhook secret in Vercel through the Vercel MCP. If a Lemon Squeezy API key is missing, the agent should ask only for that key or access.

## Visual and game asset setup

These tools are configured for the later game/premium experience phase. They should not be used to build games before RSSE staging passes.

- `ludo-ai` is the game-specialized tool. Use it for sprites, icons, UI assets, textures, 3D asset concepts, audio, short videos, and playable prototypes.
- `replicate` is the model marketplace/toolbox. Use it to compare image models, generate style directions, upscale images, clean rough assets, and test specialist models.
- `figma-context` is for design fidelity. Use it when there is a Figma frame or design file that needs to become a polished UI/game screen.
- `playwright` remains the verification layer: screenshots, layout checks, canvas checks, and visual regression sanity checks.

For Ludo.ai, the MCP endpoint is `https://mcp.ludo.ai/mcp` and the required header is `Authentication: ApiKey <key>`. API/MCP access requires a Ludo.ai plan that includes those features.

For generated assets, keep prompts, source model, license/usage notes, and final selected files documented before shipping. Do not commit throwaway generations.

## Agent operating rule

For staging work, the agent should use these MCPs to execute the work directly. It should ask for help only when a required token, API access, or external account permission is genuinely missing.

Games remain placeholders until RSSE staging passes.