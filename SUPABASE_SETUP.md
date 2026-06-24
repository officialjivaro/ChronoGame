# ChronoGame Supabase Setup

This package adds email-code accounts, display names, online score saving, and public mode leaderboards. Guests can still play, but guest runs are not saved online.

## 1. Apply the project files

Extract the changed-files ZIP into the ChronoGame root folder and allow existing files to be overwritten.

Run:

```powershell
npm.cmd install
```

## 2. Create the Supabase database objects

Open the ChronoGame project:

```text
https://supabase.com/dashboard/project/dsjntffwqludoxrcykoi
```

Then open:

```text
SQL Editor → New query
```

Open this local project file:

```text
supabase/migrations/202606200001_online_scores.sql
```

Copy the entire file into the SQL Editor and press **Run** once.

After it succeeds, Table Editor should show:

```text
profiles
score_runs
external_account_links
```

The third table is intentionally unused for now. It reserves a safe place for a future verified Squarespace link.

## 3. Configure email one-time codes

Open:

```text
Authentication → Email Templates → Magic Link
```

Set the subject to:

```text
Your ChronoGame sign-in code
```

Replace the email body with:

```html
<h2>Your ChronoGame sign-in code</h2>
<p>Enter this sign-in code in ChronoGame:</p>
<p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">{{ .Token }}</p>
<p>This code expires shortly and can only be used once.</p>
<p>If you did not request this code, you can ignore this email.</p>
```

The `{{ .Token }}` field is required. Without it, Supabase sends a clickable magic link instead of the code expected by the app.

## 4. Confirm email authentication settings

Open:

```text
Authentication → Providers → Email
```

Confirm that:

```text
Enable Email provider: On
Allow new users to sign up: On
```

## 5. Configure allowed URLs

Open:

```text
Authentication → URL Configuration
```

Use this Site URL:

```text
https://officialjivaro.github.io/ChronoGame/
```

Add these Redirect URLs:

```text
http://localhost:5173/**
https://officialjivaro.github.io/ChronoGame/**
https://jivaro.net/**
```

The current OTP flow does not leave the app, but these values keep later magic-link or Squarespace work compatible.

## 6. Create the local Vite environment file

Open:

```text
Project Settings → API Keys
```

Copy the **Publishable key** named `default`. Do not copy a secret key or service-role key.

At the ChronoGame root, copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and replace the key placeholder:

```text
VITE_SUPABASE_URL=https://dsjntffwqludoxrcykoi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_real_publishable_key
```

`.env.local` is ignored by Git. Vite will expose the publishable key in the browser by design. Database security comes from the supplied Row Level Security policies. Never put a secret key or service-role key in a `VITE_` variable.

Restart Vite whenever `.env.local` changes:

```powershell
npm.cmd run dev
```

## 7. Test account creation

1. Open ChronoGame locally.
2. Press **Sign In** in the header.
3. Enter an email address.
4. Enter the sign-in code from the email.
5. Set a leaderboard display name.
6. Complete a game run.
7. Confirm the results screen says the score was saved online.
8. Press **Ranks** in the header and confirm the score appears.

In Supabase, verify:

```text
Authentication → Users
Table Editor → profiles
Table Editor → score_runs
```

## 8. Configure production email delivery

Supabase's built-in mail service is intended only for limited testing. Before inviting real users, configure a custom SMTP provider:

```text
Project Settings → Authentication → SMTP Settings
```

Use a transactional email provider such as Resend, Postmark, Amazon SES, Brevo, or SendGrid. Create the provider account, verify your sending domain, then enter its SMTP host, port, username, password, sender email, and sender name in Supabase.

Do not place SMTP credentials in Vue files or `.env.local`.

## 9. Build and deploy

After local testing:

```powershell
npm.cmd run build
```

Confirm the generated `docs` folder still contains:

```text
docs/index.html
docs/.nojekyll
docs/data/games/
docs/ChronoGame/assets/
```

Commit the editable source plus regenerated `docs`, then publish through the existing GitHub Pages setup.

## 10. What the security currently guarantees

The supplied setup guarantees that:

- Guests cannot save scores.
- A user can save only under their own Supabase account.
- Users can read only their own raw score rows.
- Leaderboards expose display names and score summaries, not emails or user IDs.
- Repeated submissions of the same client run do not create duplicates.
- Only one official Daily Challenge score is accepted per user per UTC date.

This is a casual leaderboard. A player with technical knowledge can still modify the frontend before submission. A later server-verified phase should move score calculation into a Supabase Edge Function and eventually keep correct years out of public JSON.

## 11. Future Squarespace linking

Do not replace Supabase Auth later. Keep the Supabase user UUID as the permanent player identity.

A future Edge Function can:

1. Verify the signed-in Supabase user.
2. Read the user's verified Supabase email.
3. Query the Squarespace Contacts API with a server-side Squarespace key.
4. Save the verified Squarespace contact ID in `external_account_links`.
5. Mark the Supabase account as linked.

The Squarespace API key must be stored as an Edge Function secret and must never be included in the Vue application.


## 12. Add the Quanta currency system

Apply the Quanta migration only after the original online-score migration has succeeded.

Open:

```text
SQL Editor → New query
```

Open this local project file:

```text
supabase/migrations/202606230001_quanta_currency.sql
```

Copy the entire file into the SQL Editor and press **Run** once.

A successful schema migration normally reports:

```text
Success. No rows returned
```

After it succeeds, Table Editor should also show:

```text
quanta_wallets
quanta_transactions
```

The migration also creates:

```text
submit_score_run_v2
```

Do not delete the original `submit_score_run` function yet. Keeping both versions allows the currently published build to keep saving scores while the new frontend is being tested.

## 13. Confirm existing users received wallets

Run this query in the SQL Editor:

```sql
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.quanta_wallets) as wallets;
```

The two counts should match. Existing score rows intentionally receive no Quanta.

You can inspect wallets with:

```sql
select user_id, balance, lifetime_earned, lifetime_spent, created_at
from public.quanta_wallets
order by created_at desc;
```

## 14. Test one permanent Quanta reward

1. Restart ChronoGame locally.
2. Sign in.
3. Complete all ten rounds of Classic mode.
4. Confirm the Results screen shows `+1 Quanta`.
5. Open the header wallet and confirm the balance increased.
6. In Supabase, open `quanta_wallets` and confirm the balance is `1`.
7. Open `quanta_transactions` and confirm one `run_reward` row references the completed score run.
8. Press **Retry Save** or refresh the Results screen if possible and confirm no second reward appears.

The expected reward table is:

```text
Classic: 1 Quanta
Time Attack with at least 5 guesses: 2 Quanta
Successful Survival: 3 Quanta
Decade Challenge: 2 Quanta
Official Daily Challenge: 4 Quanta
```

Daily Challenge pays once per UTC date. Classic, Time Attack, Survival, and Decade Challenge share a cap of ten rewarded clears per UTC date.

## 15. Test guest Quanta

1. Sign out.
2. Complete Classic mode.
3. Confirm the header shows `Guest Q 1`.
4. Refresh the same tab and confirm the balance remains.
5. Close the browser session and open a new one.
6. Confirm the guest balance resets.
7. Sign in and confirm the permanent wallet replaces the guest wallet without merging balances.

Guest Quanta is stored only in `sessionStorage` and is never written to Supabase.

## 16. Test the Quantum Bazaar preview

Open the store from:

```text
Header wallet
Home screen Quantum Bazaar card
Results reward card
```

Confirm that:

- All six categories appear.
- Preview prices appear in Quanta.
- Every purchase button says `Coming Soon` and is disabled.
- Opening the store never changes the wallet balance.
- The modal closes with Escape and by clicking outside it.

## 17. Review Supabase security after the migration

Open:

```text
Advisor Center → Security
```

The Quanta tables should have Row Level Security enabled. Browser users should have read-only access to their own wallet and transaction rows. The frontend must never receive a Supabase secret or service-role key.

For an additional SQL check, run:

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('quanta_wallets', 'quanta_transactions')
order by tablename, policyname;
```

## 18. Quanta rollout order

Use this deployment order:

1. Apply `202606230001_quanta_currency.sql` in Supabase.
2. Confirm `submit_score_run_v2` exists.
3. Test locally while signed in and signed out.
4. Run `npm.cmd run build`.
5. Deploy the regenerated `docs` folder.

Do not deploy the new frontend before the v2 score function exists, or signed-in score saving will fail.
