-- ChronoGame Quanta | Permanent wallets, transaction ledger, and atomic run rewards
begin;

create table if not exists public.quanta_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  lifetime_earned integer not null default 0,
  lifetime_spent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quanta_wallets_balance_valid check (balance >= 0),
  constraint quanta_wallets_lifetime_earned_valid check (lifetime_earned >= 0),
  constraint quanta_wallets_lifetime_spent_valid check (lifetime_spent >= 0)
);

create table if not exists public.quanta_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  transaction_type text not null,
  mode text,
  score_run_id uuid references public.score_runs(id) on delete restrict,
  description text not null,
  balance_after integer not null,
  reward_date date not null default ((now() at time zone 'utc')::date),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint quanta_transactions_amount_valid check (amount <> 0),
  constraint quanta_transactions_type_valid check (
    transaction_type in ('run_reward', 'purchase', 'refund', 'promotion', 'admin_adjustment')
  ),
  constraint quanta_transactions_mode_valid check (
    mode is null or mode in ('classic', 'timeAttack', 'survival', 'decade', 'daily')
  ),
  constraint quanta_transactions_balance_valid check (balance_after >= 0),
  constraint quanta_transactions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

alter table public.score_runs
  add column if not exists quanta_awarded integer not null default 0;

alter table public.score_runs
  add column if not exists quanta_reward_status text not null default 'legacy_no_reward';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'score_runs_quanta_awarded_valid'
      and conrelid = 'public.score_runs'::regclass
  ) then
    alter table public.score_runs
      add constraint score_runs_quanta_awarded_valid check (quanta_awarded between 0 and 1000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'score_runs_quanta_status_valid'
      and conrelid = 'public.score_runs'::regclass
  ) then
    alter table public.score_runs
      add constraint score_runs_quanta_status_valid check (
        quanta_reward_status in (
          'legacy_no_reward',
          'pending',
          'rewarded',
          'not_cleared',
          'daily_already_paid',
          'daily_cap_reached'
        )
      );
  end if;
end;
$$;

create unique index if not exists quanta_transactions_one_run_reward_idx
  on public.quanta_transactions (score_run_id)
  where transaction_type = 'run_reward' and score_run_id is not null;

create unique index if not exists quanta_transactions_one_daily_reward_idx
  on public.quanta_transactions (user_id, reward_date)
  where transaction_type = 'run_reward' and mode = 'daily';

create index if not exists quanta_transactions_user_created_idx
  on public.quanta_transactions (user_id, created_at desc);

create index if not exists quanta_transactions_user_reward_date_idx
  on public.quanta_transactions (user_id, reward_date, mode)
  where transaction_type = 'run_reward';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_name text;
begin
  generated_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    'Player-' || upper(substr(replace(new.id::text, '-', ''), 1, 6))
  );

  insert into public.profiles (user_id, display_name)
  values (new.id, left(generated_name, 24))
  on conflict (user_id) do nothing;

  insert into public.quanta_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into public.quanta_wallets (user_id)
select users.id
from auth.users as users
on conflict (user_id) do nothing;

drop trigger if exists quanta_wallets_set_updated_at on public.quanta_wallets;
create trigger quanta_wallets_set_updated_at
before update on public.quanta_wallets
for each row
execute function public.set_updated_at();

alter table public.quanta_wallets enable row level security;
alter table public.quanta_transactions enable row level security;

drop policy if exists quanta_wallets_select_own on public.quanta_wallets;
create policy quanta_wallets_select_own
on public.quanta_wallets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists quanta_transactions_select_own on public.quanta_transactions;
create policy quanta_transactions_select_own
on public.quanta_transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Refresh existing policies with one-time auth lookups for better query plans.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists score_runs_select_own on public.score_runs;
create policy score_runs_select_own
on public.score_runs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists external_links_select_own on public.external_account_links;
create policy external_links_select_own
on public.external_account_links
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.quanta_wallets from anon, authenticated;
revoke all on public.quanta_transactions from anon, authenticated;
grant select on public.quanta_wallets to authenticated;
grant select on public.quanta_transactions to authenticated;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

create or replace function public.submit_score_run_v2(
  p_client_run_id uuid,
  p_mode text,
  p_score integer,
  p_max_score integer,
  p_rounds_completed integer,
  p_average_year_error numeric,
  p_best_streak integer,
  p_selected_decade integer default null,
  p_daily_date date default null,
  p_round_data jsonb default '[]'::jsonb,
  p_client_version text default '1.0.0'
)
returns table (
  run_id uuid,
  daily_official boolean,
  inserted boolean,
  quanta_awarded integer,
  previous_balance integer,
  new_balance integer,
  reward_status text,
  rewarded_runs_today integer,
  daily_reward_claimed boolean,
  reward_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run_id uuid;
  v_daily_official boolean := false;
  v_inserted boolean := true;
  v_existing_run public.score_runs%rowtype;
  v_wallet_balance integer := 0;
  v_previous_balance integer := 0;
  v_new_balance integer := 0;
  v_quanta_awarded integer := 0;
  v_reward_status text := 'not_cleared';
  v_reward_message text := 'Run incomplete. ChronoBot refuses to pay unfinished timelines.';
  v_reward_date date := (now() at time zone 'utc')::date;
  v_rewarded_runs_today integer := 0;
  v_daily_reward_claimed boolean := false;
  v_cleared boolean := false;
  v_life_losses integer := 0;
  v_existing_amount integer := 0;
  v_existing_balance_after integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_client_run_id is null then
    raise exception 'A client run ID is required.' using errcode = '22023';
  end if;

  if p_mode not in ('classic', 'timeAttack', 'survival', 'decade', 'daily') then
    raise exception 'Unsupported game mode.' using errcode = '22023';
  end if;

  if p_score < 0 or p_score > 250000 then
    raise exception 'Score is outside the accepted range.' using errcode = '22023';
  end if;

  if p_max_score < 1 or p_max_score > 250000 or p_score > p_max_score then
    raise exception 'Maximum score is invalid.' using errcode = '22023';
  end if;

  if p_rounds_completed < 1 or p_rounds_completed > 250 then
    raise exception 'Rounds completed is outside the accepted range.' using errcode = '22023';
  end if;

  if p_average_year_error < 0 or p_average_year_error > 70 then
    raise exception 'Average year error is outside the accepted range.' using errcode = '22023';
  end if;

  if p_best_streak < 0 or p_best_streak > p_rounds_completed then
    raise exception 'Best streak is outside the accepted range.' using errcode = '22023';
  end if;

  if p_mode = 'decade' and (p_selected_decade is null or p_selected_decade < 1960 or p_selected_decade > 2020) then
    raise exception 'A valid decade is required.' using errcode = '22023';
  end if;

  if p_mode = 'daily' and p_daily_date is null then
    raise exception 'A Daily Challenge date is required.' using errcode = '22023';
  end if;

  if p_mode = 'daily' and p_daily_date <> (now() at time zone 'utc')::date then
    raise exception 'The Daily Challenge date must match the current UTC date.' using errcode = '22023';
  end if;

  if p_mode <> 'daily' then
    p_daily_date := null;
  end if;

  if p_round_data is null
    or jsonb_typeof(p_round_data) <> 'array'
    or jsonb_array_length(p_round_data) <> p_rounds_completed
    or jsonb_array_length(p_round_data) > 250 then
    raise exception 'Round data must match the completed round count.' using errcode = '22023';
  end if;

  insert into public.quanta_wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select wallet.balance
  into v_wallet_balance
  from public.quanta_wallets as wallet
  where wallet.user_id = v_user_id
  for update;

  v_previous_balance := coalesce(v_wallet_balance, 0);
  v_new_balance := v_previous_balance;

  select *
  into v_existing_run
  from public.score_runs as runs
  where runs.user_id = v_user_id
    and runs.client_run_id = p_client_run_id;

  if found then
    select transactions.amount, transactions.balance_after
    into v_existing_amount, v_existing_balance_after
    from public.quanta_transactions as transactions
    where transactions.score_run_id = v_existing_run.id
      and transactions.transaction_type = 'run_reward'
    limit 1;

    select count(*)::integer
    into v_rewarded_runs_today
    from public.quanta_transactions as transactions
    where transactions.user_id = v_user_id
      and transactions.transaction_type = 'run_reward'
      and transactions.mode <> 'daily'
      and transactions.reward_date = (now() at time zone 'utc')::date;

    select exists (
      select 1
      from public.quanta_transactions as transactions
      where transactions.user_id = v_user_id
        and transactions.transaction_type = 'run_reward'
        and transactions.mode = 'daily'
        and transactions.reward_date = coalesce(v_existing_run.daily_date, (now() at time zone 'utc')::date)
    ) into v_daily_reward_claimed;

    return query
    select
      v_existing_run.id,
      v_existing_run.is_daily_official,
      false,
      v_existing_run.quanta_awarded,
      case
        when coalesce(v_existing_amount, 0) > 0 then greatest(0, coalesce(v_existing_balance_after, v_previous_balance) - v_existing_amount)
        else v_previous_balance
      end,
      case
        when coalesce(v_existing_amount, 0) > 0 then coalesce(v_existing_balance_after, v_new_balance)
        else v_new_balance
      end,
      case
        when v_existing_run.quanta_reward_status = 'rewarded' then 'already_rewarded'
        when v_existing_run.quanta_reward_status = 'legacy_no_reward' then 'duplicate'
        else v_existing_run.quanta_reward_status
      end,
      v_rewarded_runs_today,
      v_daily_reward_claimed,
      case v_existing_run.quanta_reward_status
        when 'rewarded' then 'This timeline was already rewarded.'
        when 'daily_already_paid' then 'Practice run complete. The timeline already paid today.'
        when 'daily_cap_reached' then 'Reward limit reached. Ten rewarded runs completed today.'
        when 'not_cleared' then 'Run incomplete. ChronoBot refuses to pay unfinished timelines.'
        else 'This timeline was already processed.'
      end;
    return;
  end if;

  if p_mode = 'daily' then
    v_daily_official := not exists (
      select 1
      from public.score_runs as runs
      where runs.user_id = v_user_id
        and runs.mode = 'daily'
        and runs.daily_date = p_daily_date
        and runs.is_daily_official = true
    );
  end if;

  begin
    insert into public.score_runs (
      client_run_id,
      user_id,
      mode,
      score,
      max_score,
      rounds_completed,
      average_year_error,
      best_streak,
      selected_decade,
      daily_date,
      is_daily_official,
      round_data,
      client_version,
      quanta_awarded,
      quanta_reward_status
    )
    values (
      p_client_run_id,
      v_user_id,
      p_mode,
      p_score,
      p_max_score,
      p_rounds_completed,
      round(p_average_year_error::numeric, 2),
      p_best_streak,
      case when p_mode = 'decade' then p_selected_decade else null end,
      p_daily_date,
      v_daily_official,
      p_round_data,
      left(coalesce(nullif(trim(p_client_version), ''), 'unknown'), 40),
      0,
      'pending'
    )
    returning id into v_run_id;
  exception
    when unique_violation then
      select *
      into v_existing_run
      from public.score_runs as runs
      where runs.user_id = v_user_id
        and runs.client_run_id = p_client_run_id;

      if found then
        return query
        select
          v_existing_run.id,
          v_existing_run.is_daily_official,
          false,
          v_existing_run.quanta_awarded,
          v_previous_balance,
          v_new_balance,
          case when v_existing_run.quanta_reward_status = 'rewarded' then 'already_rewarded' else v_existing_run.quanta_reward_status end,
          0,
          false,
          'This timeline was already processed.';
        return;
      end if;

      if p_mode = 'daily' and v_daily_official then
        v_daily_official := false;

        insert into public.score_runs (
          client_run_id,
          user_id,
          mode,
          score,
          max_score,
          rounds_completed,
          average_year_error,
          best_streak,
          selected_decade,
          daily_date,
          is_daily_official,
          round_data,
          client_version,
          quanta_awarded,
          quanta_reward_status
        )
        values (
          p_client_run_id,
          v_user_id,
          p_mode,
          p_score,
          p_max_score,
          p_rounds_completed,
          round(p_average_year_error::numeric, 2),
          p_best_streak,
          null,
          p_daily_date,
          false,
          p_round_data,
          left(coalesce(nullif(trim(p_client_version), ''), 'unknown'), 40),
          0,
          'pending'
        )
        returning id into v_run_id;
      else
        raise;
      end if;
  end;

  select count(*)::integer
  into v_life_losses
  from jsonb_array_elements(p_round_data) as round_item
  where lower(coalesce(round_item ->> 'life_lost', 'false')) = 'true';

  v_cleared := case
    when p_mode in ('classic', 'decade', 'daily') then p_rounds_completed = 10
    when p_mode = 'timeAttack' then p_rounds_completed >= 5
    when p_mode = 'survival' then p_rounds_completed = 10 and v_life_losses < 3
    else false
  end;

  if not v_cleared then
    v_reward_status := 'not_cleared';
    v_reward_message := 'Run incomplete. ChronoBot refuses to pay unfinished timelines.';
  elsif p_mode = 'daily' and not v_daily_official then
    v_reward_status := 'daily_already_paid';
    v_reward_message := 'Practice run complete. The timeline already paid today.';
  else
    if p_mode = 'daily' then
      v_reward_date := p_daily_date;
    else
      v_reward_date := (now() at time zone 'utc')::date;

      select count(*)::integer
      into v_rewarded_runs_today
      from public.quanta_transactions as transactions
      where transactions.user_id = v_user_id
        and transactions.transaction_type = 'run_reward'
        and transactions.mode <> 'daily'
        and transactions.reward_date = v_reward_date;
    end if;

    if p_mode <> 'daily' and v_rewarded_runs_today >= 10 then
      v_reward_status := 'daily_cap_reached';
      v_reward_message := 'Reward limit reached. Ten rewarded runs completed today.';
    else
      v_quanta_awarded := case p_mode
        when 'classic' then 1
        when 'timeAttack' then 2
        when 'survival' then 3
        when 'decade' then 2
        when 'daily' then 4
        else 0
      end;
      v_reward_status := 'rewarded';
      v_reward_message := case p_mode
        when 'classic' then 'Timeline stabilized. One Quanta recovered.'
        when 'timeAttack' then 'Clock survived. Two Quanta escaped the countdown.'
        when 'survival' then 'All ten rounds survived. Three Quanta escaped the void.'
        when 'decade' then 'Decade archived. Two Quanta catalogued.'
        when 'daily' then 'Today''s anomaly contained. Four Quanta secured.'
        else 'Quanta recovered.'
      end;

      update public.quanta_wallets
      set
        balance = balance + v_quanta_awarded,
        lifetime_earned = lifetime_earned + v_quanta_awarded
      where user_id = v_user_id
      returning balance into v_new_balance;

      insert into public.quanta_transactions (
        user_id,
        amount,
        transaction_type,
        mode,
        score_run_id,
        description,
        balance_after,
        reward_date,
        metadata
      )
      values (
        v_user_id,
        v_quanta_awarded,
        'run_reward',
        p_mode,
        v_run_id,
        v_reward_message,
        v_new_balance,
        v_reward_date,
        jsonb_build_object(
          'client_run_id', p_client_run_id,
          'score', p_score,
          'rounds_completed', p_rounds_completed
        )
      );
    end if;
  end if;

  update public.score_runs
  set
    quanta_awarded = v_quanta_awarded,
    quanta_reward_status = v_reward_status
  where id = v_run_id;

  select count(*)::integer
  into v_rewarded_runs_today
  from public.quanta_transactions as transactions
  where transactions.user_id = v_user_id
    and transactions.transaction_type = 'run_reward'
    and transactions.mode <> 'daily'
    and transactions.reward_date = (now() at time zone 'utc')::date;

  select exists (
    select 1
    from public.quanta_transactions as transactions
    where transactions.user_id = v_user_id
      and transactions.transaction_type = 'run_reward'
      and transactions.mode = 'daily'
      and transactions.reward_date = coalesce(p_daily_date, (now() at time zone 'utc')::date)
  ) into v_daily_reward_claimed;

  return query
  select
    v_run_id,
    v_daily_official,
    v_inserted,
    v_quanta_awarded,
    v_previous_balance,
    v_new_balance,
    v_reward_status,
    v_rewarded_runs_today,
    v_daily_reward_claimed,
    v_reward_message;
end;
$$;

revoke all on function public.submit_score_run_v2(
  uuid,
  text,
  integer,
  integer,
  integer,
  numeric,
  integer,
  integer,
  date,
  jsonb,
  text
) from public, anon;

grant execute on function public.submit_score_run_v2(
  uuid,
  text,
  integer,
  integer,
  integer,
  numeric,
  integer,
  integer,
  date,
  jsonb,
  text
) to authenticated;

comment on table public.quanta_wallets is 'Permanent authenticated ChronoGame Quanta balances. Clients have read-only access to their own wallet.';
comment on table public.quanta_transactions is 'Immutable Quanta transaction ledger for run rewards and future store activity.';
comment on function public.submit_score_run_v2 is 'Atomically saves one authenticated score run and awards eligible Quanta exactly once.';

commit;
