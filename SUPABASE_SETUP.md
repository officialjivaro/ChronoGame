# ChronoGame on Jivaro Games — Supabase Setup

ChronoGame now uses the shared **Jivaro Games** account and Quanta platform while keeping ChronoGame score data, game rules, and leaderboard RPCs game-specific.

## Production status

The shared-account restructuring and canonical ChronoGame score cutover are already applied to production:

```text
Production project: Jivaro Games
Production ref:     dsjntffwqludoxrcykoi
```

The cosmetic-store migration was applied and rollback-tested on **Jivaro Games Staging** on **June 25, 2026**:

```text
Staging project: Jivaro Games Staging
Staging ref:     mblzagvadwoadrsembps
Migration:       chronogame_cosmetics_store
```

The cosmetic migration is **not applied to production yet**. Apply the included additive migration to production only after the updated frontend has passed local and staging testing.

Remaining production actions:

```text
1. Test the updated frontend against Jivaro Games Staging.
2. Apply 20260625020000_chronogame_cosmetics_store.sql to Jivaro Games production.
3. Change the Supabase Auth email template to Jivaro Games branding if still required.
4. Build and deploy ChronoGame.
5. Leave score compatibility objects active until the new build has been stable for several days.
```

## Canonical backend objects

Shared Jivaro Games objects:

```text
profiles
external_account_links
games_catalog
quanta_wallets
quanta_transactions
```

ChronoGame-specific objects:

```text
chronogame_score_runs
chronogame_submit_score_run
chronogame_submit_score_run_v2
chronogame_get_leaderboard
chronogame_quanta_mode_reward
chronogame_quanta_reward_text
chronogame_quanta_status_for_run
chronogame_shop_items
chronogame_purchase_orders
chronogame_user_inventory
chronogame_equipped_items
chronogame_purchase_item
chronogame_set_equipped_item
```

Temporary compatibility objects retained during rollout:

```text
score_runs                     compatibility view
submit_score_run               compatibility RPC
submit_score_run_v2            compatibility RPC
get_leaderboard                compatibility RPC
quanta_mode_reward             private compatibility helper
quanta_reward_text             private compatibility helper
quanta_status_for_run          private compatibility helper
```

The updated frontend calls these canonical ChronoGame RPCs:

```text
chronogame_submit_score_run_v2
chronogame_get_leaderboard
chronogame_purchase_item
chronogame_set_equipped_item
```

## Included SQL files

### Exact production cutover migration

```text
supabase/migrations/20260625012256_chronogame_frontend_cutover_hardening.sql
```

This is the exact migration already recorded in production as:

```text
20260625012256 | chronogame_frontend_cutover_hardening
```

It hardens the compatibility view, indexes generalized reward lookups, and makes the canonical score-and-Quanta submission function write explicit multi-game source fields.


### Cosmetic store migration

```text
supabase/migrations/20260625020000_chronogame_cosmetics_store.sql
```

This additive migration is already present on **Jivaro Games Staging** and must be applied once to production before deploying the live store. It adds:

```text
chronogame_shop_items
chronogame_purchase_orders
chronogame_user_inventory
chronogame_equipped_items
chronogame_purchase_item
chronogame_set_equipped_item
```

The purchase RPC accepts only an item key and client purchase UUID. The database reads the authoritative price, locks the shared wallet, debits Quanta, writes the shared ledger transaction, and grants inventory ownership atomically.

### Fresh-environment baseline

```text
supabase/baselines/20260625_jivaro_games_multigame_chronogame.sql
```

This consolidated baseline is for a **new or disposable environment only**. It catches a fresh database up from the two original ChronoGame migrations to the current multi-game structure.

Do not run this baseline on the existing production project. Production already contains the same work as granular, recorded migrations.

For a fresh environment, use this order:

```text
supabase/migrations/202606200001_online_scores.sql
supabase/migrations/202606230001_quanta_currency.sql
supabase/baselines/20260625_jivaro_games_multigame_chronogame.sql
supabase/migrations/20260625012256_chronogame_frontend_cutover_hardening.sql
supabase/migrations/20260625020000_chronogame_cosmetics_store.sql
```

The baseline, cutover, and cosmetic migration are additive together. The final timestamped migration is repeated so a fresh environment ends on the same cutover definition as production.

> This local folder does not contain every granular migration that was applied remotely during the restructuring. Do not use migration-history repair, database reset, or an unreviewed `supabase db push` against production from this folder.

## Install the frontend update

Extract the update ZIP into the ChronoGame project root and overwrite matching files. Before extraction, remove the existing generated `docs/` directory so obsolete hashed JavaScript and CSS files are not left behind:

```powershell
if (Test-Path .\docs) { Remove-Item .\docs -Recurse -Force }
```

The changed-files package intentionally excludes local secrets and dependency caches. It includes the complete regenerated `docs/` deployment directory. Do not add:

```text
.env.local
node_modules/
dist/
```

Install the locked dependencies:

```powershell
npm.cmd ci
```

Your existing `.env.local` remains valid because the Supabase project URL and publishable key did not change.

## Shared Jivaro Games login storage

The browser session key is now platform-wide:

```text
jivaro-games-supabase-auth
```

On the first load of the updated ChronoGame build, the client automatically copies an existing session from the former key:

```text
chronogame-supabase-auth
```

It then removes the stale game-specific copy. This preserves the current ChronoGame login while allowing future Jivaro games on the **same browser origin** to reuse the same session when they adopt the same platform key.

Browser storage is origin-scoped. Apps on different domains or subdomains will still need a central sign-in flow or separate authentication unless the hosting architecture is changed.

## Configure Jivaro Games email codes

This dashboard setting cannot be changed by the SQL migration.

Open:

```text
Supabase Dashboard
→ Jivaro Games
→ Authentication
→ Email Templates
→ Magic Link
```

Set the subject to:

```text
Your Jivaro Games sign-in code
```

Use this body:

```html
<h2>Your Jivaro Games sign-in code</h2>
<p>Enter this sign-in code in Jivaro Games:</p>
<p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">{{ .Token }}</p>
<p>This code expires shortly and can only be used once.</p>
<p>If you did not request this code, you can ignore this email.</p>
```

Keep `{{ .Token }}` exactly as shown. A suitable sender is:

```text
Jivaro Games <noreply@jivaro.net>
```

Confirm under **Authentication → Providers → Email**:

```text
Enable Email provider: On
Allow new users to sign up: On
```

Confirm under **Authentication → URL Configuration** that the current production URL and required redirects remain allowed, including local development and the deployed ChronoGame path.

## Browser-safe environment

Copy `.env.example` to `.env.local` only when the local file does not already exist:

```powershell
Copy-Item .env.example .env.local
```

Use the Jivaro Games URL and an enabled publishable key:

```text
VITE_SUPABASE_URL=https://dsjntffwqludoxrcykoi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_real_publishable_key
```

Never put a secret key or service-role key in a `VITE_` variable. Keep `.env.local` uncommitted.

## Run locally

```powershell
npm.cmd run dev
```

Restart Vite after changing environment variables.

## Database verification

Run these read-only checks in the production SQL Editor.

### Canonical tables and compatibility view

```sql
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'games_catalog',
    'profiles',
    'chronogame_score_runs',
    'score_runs',
    'quanta_wallets',
    'quanta_transactions'
  )
order by table_name;
```

Expected object types:

```text
chronogame_score_runs  BASE TABLE
games_catalog          BASE TABLE
profiles               BASE TABLE
quanta_transactions    BASE TABLE
quanta_wallets         BASE TABLE
score_runs             VIEW
```

### Game registry

```sql
select game_key, display_name, active
from public.games_catalog
order by game_key;
```

ChronoGame should appear as:

```text
chronogame | ChronoGame | true
```

### Canonical RPC signatures

```sql
select
  p.oid::regprocedure::text as signature,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'chronogame_submit_score_run_v2',
    'chronogame_get_leaderboard'
  )
order by p.proname;
```

The leaderboard result must begin with:

```text
TABLE(rank bigint, ...)
```

### Generalized Quanta source fields

```sql
select
  source_game_key,
  source_mode,
  is_daily_reward,
  transaction_type,
  reward_date,
  count(*)
from public.quanta_transactions
group by 1, 2, 3, 4, 5
order by reward_date desc, source_game_key, source_mode;
```

ChronoGame rewards should use:

```text
source_game_key = chronogame
source_event_id = ChronoGame run UUID
source_mode = ChronoGame mode
is_daily_reward = true only for Daily rewards
```

## Cosmetic database verification

Run these checks in **Jivaro Games Staging** after applying the migration, then repeat them in production after the production rollout.

```sql
select item_key, category, equipment_slot, display_name, price, active, sort_order
from public.chronogame_shop_items
order by sort_order;
```

Expected: ten active items covering four backgrounds, three UI skins, and three pets.

```sql
select
  p.oid::regprocedure::text as signature,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'chronogame_purchase_item',
    'chronogame_set_equipped_item'
  )
order by signature;
```

A successful cosmetic purchase creates exactly one row in each of:

```text
chronogame_purchase_orders
chronogame_user_inventory
quanta_transactions
```

The shared ledger row must use:

```text
transaction_type = purchase
amount = negative server price
source_game_key = chronogame
source_mode = cosmetic_purchase
source_event_id = purchase order UUID
mode = null
score_run_id = null
is_daily_reward = false
```

## Functional test checklist

### Account branding and session migration

1. Open the existing deployed game while signed in before replacing the build.
2. Run the updated build on the same origin or deploy it.
3. Confirm the session remains signed in after the one-time storage-key migration.
4. Open the account modal and confirm it says **Jivaro Games Account**.
5. Request a code and confirm the UI says **Jivaro Games sign-in code**.
6. Confirm the email subject and body use Jivaro Games.
7. Confirm the permanent balance is labeled **Shared Quanta Wallet**.

### Score saving and idempotency

1. Sign in.
2. Complete Classic mode.
3. Confirm the result says the ChronoGame score was saved to the Jivaro Games account.
4. Confirm `chronogame_score_runs` received one row.
5. Confirm `quanta_transactions` received one `run_reward` row with:

```text
source_game_key = chronogame
source_event_id = the ChronoGame run UUID
source_mode = classic
is_daily_reward = false
```

6. Retry the same save and confirm no duplicate run, wallet credit, or transaction is created.

### Quanta rewards

Verify the existing ChronoGame rules remain unchanged:

```text
Classic      1 Quanta after 10 completed rounds
Time Attack  2 Quanta after at least 5 completed rounds
Survival     3 Quanta after 10 rounds with fewer than 3 life losses
Decade       2 Quanta after 10 completed rounds
Daily        4 Quanta for the official run
```

The non-Daily cap remains ten rewarded runs per user per UTC date across all Jivaro games.

### Daily reward isolation

1. Complete the official ChronoGame Daily Challenge.
2. Confirm one Daily transaction exists with:

```text
source_game_key = chronogame
is_daily_reward = true
```

3. Complete another Daily run on the same UTC date.
4. Confirm it is stored as practice and receives no second ChronoGame Daily reward.

Daily uniqueness is per user, per game, per UTC date. A future Daily reward from another Jivaro game is not blocked by ChronoGame.

### Leaderboards

1. Open **Ranks**.
2. Test Classic, Time Attack, Survival, Decade, and Daily tabs.
3. Confirm each row displays `rank`, player name, score, rounds, and average miss.
4. Confirm only the best saved score per player appears for each mode.
5. Confirm Daily shows only official results for the selected UTC date.

### Cosmetic store and inventory

1. Open Quantum Bazaar while signed out and confirm all ten items can be previewed.
2. Confirm a guest purchase action opens the existing Jivaro Games sign-in flow and never spends Guest Quanta.
3. Sign in to a staging account with enough Quanta.
4. Purchase one background and confirm the wallet falls by exactly the server price.
5. Confirm one purchase order, one inventory row, and one negative shared-ledger row were created.
6. Retry the same client purchase UUID and confirm no second charge or row is created.
7. Attempt to buy the same item again with a different client purchase UUID and confirm the balance is unchanged.
8. Equip the background, reload, and confirm it remains equipped.
9. Equip a UI skin and pet, then confirm one item per slot is stored.
10. Restore each default and confirm the corresponding equipment row is removed.
11. Sign out and confirm default visuals return immediately.
12. Confirm pets appear only on Home and Results, remain docked, and never appear during gameplay.

### Signed-out behavior

1. Sign out.
2. Complete a run.
3. Confirm guest Quanta remain session-only.
4. Confirm no authenticated score row or permanent Quanta transaction is created.

## Data-preservation check

Compare these counts before and after frontend deployment:

```sql
select
  (select count(*) from auth.users) as users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.chronogame_score_runs) as chronogame_runs,
  (select count(*) from public.quanta_wallets) as wallets,
  (select count(*) from public.quanta_transactions) as quanta_transactions,
  (select count(*) from public.chronogame_purchase_orders) as cosmetic_orders,
  (select count(*) from public.chronogame_user_inventory) as cosmetic_inventory;
```

Deploying the frontend does not migrate or delete any data.

## Build and deploy

After local testing:

```powershell
npm.cmd run build
```

The current Vite configuration writes the deployable site to `docs/`. Confirm at least:

```text
docs/index.html
docs/.nojekyll
docs/data/games/
docs/ChronoGame/assets/
```

Deploy the regenerated `docs` folder using the existing publishing workflow.

Recommended rollout order:

```text
1. Test the frontend against Jivaro Games Staging while signed in and signed out.
2. Verify purchase idempotency, inventory, equipment, and shared-ledger rows in staging.
3. Apply 20260625020000_chronogame_cosmetics_store.sql to Jivaro Games production.
4. Update the Supabase email template to Jivaro Games if still required.
5. Build with the production `.env.local` and deploy the regenerated `docs/` directory.
6. Verify scores, Quanta rewards, purchases, equipment, Daily logic, and leaderboards in production.
7. Keep compatibility objects for several days.
8. Remove compatibility objects only in a separate, reviewed cleanup migration.
```

## Compatibility cleanup later

Do not remove these during this rollout:

```text
score_runs
submit_score_run
submit_score_run_v2
get_leaderboard
quanta_mode_reward
quanta_reward_text
quanta_status_for_run
```

After the updated production build has operated correctly for several days, remove them in a dedicated migration. Keep the canonical ChronoGame objects.

The legacy Quanta columns can be retired later only after every game uses the generalized fields:

```text
mode
score_run_id
```

## Security notes

The browser receives only the Supabase project URL and publishable key. Row Level Security and server-side functions remain the security boundary:

- Users can read only their own raw ChronoGame runs, wallet, and transaction rows.
- Direct browser inserts into score and Quanta tables remain disabled.
- The compatibility `score_runs` view uses invoker security and respects the underlying row policy.
- `chronogame_submit_score_run_v2` is callable only by authenticated users and atomically saves the run and reward.
- Leaderboard RPCs expose only display names and score summaries, not emails or user UUIDs.
- Reusing a client run ID cannot create a duplicate run or reward.
- Cosmetic prices are authoritative in `chronogame_shop_items`; the browser never submits a trusted price.
- Reusing a client purchase UUID returns the existing order and cannot create a duplicate debit.
- Direct authenticated writes to cosmetic ownership, equipment, and purchase-order tables are disabled.
- Security-definer RPCs use a fixed `search_path`; public execution is intentional only for read-only catalog and leaderboard access, while score submission, purchases, and equipment changes require authentication.

ChronoGame remains a casual client-scored leaderboard. Strong anti-cheat protection would require server-verifiable rounds or server-side score calculation from trusted game data.
