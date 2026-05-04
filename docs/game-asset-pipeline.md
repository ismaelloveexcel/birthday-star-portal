# Game asset pipeline

Games remain placeholders until RSSE staging passes. This pipeline is for the next phase, when premium experiences need stronger visuals.

## Tool roles

| Tool | Use |
| --- | --- |
| Ludo.ai MCP | Game-specific generation: sprites, icons, UI assets, textures, 3D concepts, audio, videos, and playable prototypes. |
| Replicate MCP | Model search, image generation, upscaling, cleanup, style variations, and specialist visual models. |
| Figma MCP | Pull design context from approved Figma frames into code with accurate layout, color, spacing, and typography. |
| Playwright MCP | Verify final screens and interactions with screenshots and browser checks. |

## Workflow

1. Define the experience mood, audience, and asset list in Notion.
2. Use Ludo.ai for game-native concept art, sprite directions, UI pieces, and prototype references.
3. Use Replicate for alternate model passes, higher-resolution output, upscaling, and cleanup.
4. Move selected visual directions into Figma for layout and art direction.
5. Use Figma MCP to implement the approved design accurately.
6. Use Playwright to verify the result across desktop and mobile.
7. Keep only final selected assets in the repo. Store rejected generations outside the repo.

## Quality bar

- Visuals should support the premium birthday/social experience, not generic arcade filler.
- Assets need consistent style, scale, lighting, and color language.
- Screens must work on mobile first and remain readable on desktop.
- Generated assets must have usage rights that allow commercial deployment.
- Keep prompts and model/source metadata for any shipped generated asset.

## Current boundary

Do not start this pipeline until staging RSSE passes health and smoke checks against Postgres.