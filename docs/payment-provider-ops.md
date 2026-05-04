# Payment provider ops

RSSE payment fulfillment currently uses Lemon Squeezy webhooks.

## Source of truth

Keep these values in Notion or the password manager, not in repo files:

- Lemon Squeezy store ID.
- Product and variant IDs.
- Staging buy URL used for `NEXT_PUBLIC_CHECKOUT_URL`.
- Webhook URL: `https://<staging-host>/api/webhooks/lemon-squeezy`.
- Whether the API key is test or live.
- Webhook secret for `LEMON_SQUEEZY_WEBHOOK_SECRET`.

## Verification flow

1. Set Vercel staging env vars:
   - `NEXT_PUBLIC_CHECKOUT_URL` to the real Lemon Squeezy buy URL, never `#`.
   - `LEMON_SQUEEZY_WEBHOOK_SECRET` to the staging webhook signing secret.
2. Confirm `/api/rsse/health` reports `checkoutConfigured: true`.
3. Run standard RSSE smoke against staging.
4. Run webhook smoke with:

   ```powershell
   $env:SMOKE_BASE_URL='https://<staging-host>'
   $env:SMOKE_USE_LEMON_WEBHOOK='1'
   $env:LEMON_SQUEEZY_WEBHOOK_SECRET='<staging-webhook-secret>'
   npm run smoke:rsse
   ```

5. Optionally validate Lemon Squeezy dashboard setup with:

   ```powershell
   $env:LEMON_SQUEEZY_API_KEY='<test-api-key>'
   npx fresh-squeezy doctor --store-ids <store-id> --product-id <product-id> --webhook-url https://<staging-host>/api/webhooks/lemon-squeezy
   ```

## Agent rule

The agent should use Notion for setup details and Vercel for env management. It should only ask for a missing Lemon Squeezy API key, webhook secret, or dashboard permission if those are not available through the configured tools.

Games remain placeholders until RSSE staging passes.