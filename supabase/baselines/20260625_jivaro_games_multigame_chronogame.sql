-- Jivaro Games schema baseline | ChronoGame canonical schema and compatibility API
-- Fresh/local environments only: apply after the two original ChronoGame migrations.
-- Do not run this baseline against the existing Jivaro Games production project; its
-- component migrations are already recorded there. Use the timestamped cutover migration.
begin;

-- Shared game registry -------------------------------------------------------
create table if not exists public.games_catalog (
  game_key text primary key,
  display_name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.games_catalog'::regclass
      and conname = 'games_catalog_key_format'
  ) then
    alter table public.games_catalog
      add constraint games_catalog_key_format
      check (game_key ~ '^[a-z][a-z0-9_]*$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.games_catalog'::regclass
      and conname = 'games_catalog_display_name_length'
  ) then
    alter table public.games_catalog
      add constraint games_catalog_display_name_length
      check (char_length(trim(display_name)) between 2 and 80);
  end if;
end;
$$;

insert into public.games_catalog (game_key, display_name, description, active)
values ('chronogame', 'ChronoGame', 'Guess the release year.', true)
on conflict (game_key) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  active = excluded.active,
  updated_at = now();

drop trigger if exists games_catalog_set_updated_at on public.games_catalog;
create trigger games_catalog_set_updated_at
before update on public.games_catalog
for each row
execute function public.set_updated_at();

alter table public.games_catalog enable row level security;
drop policy if exists games_catalog_read_active on public.games_catalog;
create policy games_catalog_read_active
on public.games_catalog
for select
to anon, authenticated
using (active = true);

revoke all on public.games_catalog from anon, authenticated;
grant select on public.games_catalog to anon, authenticated;

-- ChronoGame-specific score storage ----------------------------------------
do $$
declare
  score_runs_kind "char";
begin
  if to_regclass('public.chronogame_score_runs') is null then
    select relkind
    into score_runs_kind
    from pg_class
    where oid = to_regclass('public.score_runs');

    if score_runs_kind = 'r' then
      alter table public.score_runs rename to chronogame_score_runs;
    else
      raise exception 'Expected public.score_runs to be a base table before the ChronoGame migration.';
    end if;
  end if;
end;
$$;

do $$
declare
  v_old_name text;
  v_new_name text;
begin
  for v_old_name, v_new_name in
    select * from (values
      ('score_runs_pkey', 'chronogame_score_runs_pkey'),
      ('score_runs_client_run_unique', 'chronogame_score_runs_client_run_unique'),
      ('score_runs_user_id_fkey', 'chronogame_score_runs_user_id_fkey'),
      ('score_runs_mode_valid', 'chronogame_score_runs_mode_valid'),
      ('score_runs_score_valid', 'chronogame_score_runs_score_valid'),
      ('score_runs_max_score_valid', 'chronogame_score_runs_max_score_valid'),
      ('score_runs_rounds_valid', 'chronogame_score_runs_rounds_valid'),
      ('score_runs_average_error_valid', 'chronogame_score_runs_average_error_valid'),
      ('score_runs_streak_valid', 'chronogame_score_runs_streak_valid'),
      ('score_runs_decade_valid', 'chronogame_score_runs_decade_valid'),
      ('score_runs_decade_required', 'chronogame_score_runs_decade_required'),
      ('score_runs_daily_date_valid', 'chronogame_score_runs_daily_date_valid'),
      ('score_runs_round_data_array', 'chronogame_score_runs_round_data_array'),
      ('score_runs_round_data_length', 'chronogame_score_runs_round_data_length'),
      ('score_runs_verification_level_valid', 'chronogame_score_runs_verification_level_valid'),
      ('score_runs_quanta_awarded_valid', 'chronogame_score_runs_quanta_awarded_valid'),
      ('score_runs_quanta_status_valid', 'chronogame_score_runs_quanta_status_valid')
    ) as names(old_name, new_name)
  loop
    if exists (
      select 1 from pg_constraint
      where conrelid = 'public.chronogame_score_runs'::regclass
        and conname = v_old_name
    ) and not exists (
      select 1 from pg_constraint
      where conrelid = 'public.chronogame_score_runs'::regclass
        and conname = v_new_name
    ) then
      execute format(
        'alter table public.chronogame_score_runs rename constraint %I to %I',
        v_old_name,
        v_new_name
      );
    end if;
  end loop;
end;
$$;

do $$
declare
  v_old_name text;
  v_new_name text;
begin
  for v_old_name, v_new_name in
    select * from (values
      ('score_runs_mode_score_idx', 'chronogame_score_runs_mode_score_idx'),
      ('score_runs_user_created_idx', 'chronogame_score_runs_user_created_idx'),
      ('score_runs_daily_idx', 'chronogame_score_runs_daily_idx'),
      ('score_runs_one_daily_official_per_user_idx', 'chronogame_score_runs_one_daily_official_per_user_idx')
    ) as names(old_name, new_name)
  loop
    if to_regclass('public.' || v_old_name) is not null
       and to_regclass('public.' || v_new_name) is null then
      execute format('alter index public.%I rename to %I', v_old_name, v_new_name);
    end if;
  end loop;
end;
$$;

alter table public.chronogame_score_runs enable row level security;
drop policy if exists score_runs_select_own on public.chronogame_score_runs;
drop policy if exists chronogame_score_runs_select_own on public.chronogame_score_runs;
create policy chronogame_score_runs_select_own
on public.chronogame_score_runs
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.chronogame_score_runs from anon, authenticated;
grant select on public.chronogame_score_runs to authenticated;

-- The old table name remains temporarily as an RLS-respecting compatibility view.
create or replace view public.score_runs
with (security_invoker = true)
as
select
  id,
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
  verification_level,
  created_at,
  quanta_awarded,
  quanta_reward_status
from public.chronogame_score_runs;

revoke all on public.score_runs from anon, authenticated;
grant select on public.score_runs to authenticated;

-- Shared Quanta transaction sources ----------------------------------------
alter table public.quanta_transactions
  add column if not exists source_game_key text;

alter table public.quanta_transactions
  add column if not exists source_event_id uuid;

alter table public.quanta_transactions
  add column if not exists source_mode text;

alter table public.quanta_transactions
  add column if not exists is_daily_reward boolean not null default false;

update public.quanta_transactions
set
  source_game_key = coalesce(nullif(trim(source_game_key), ''), 'chronogame'),
  source_event_id = coalesce(source_event_id, score_run_id),
  source_mode = coalesce(nullif(trim(source_mode), ''), mode),
  is_daily_reward = case
    when coalesce(nullif(trim(source_mode), ''), mode) = 'daily' then true
    else is_daily_reward
  end
where
  source_game_key is null
  or trim(source_game_key) = ''
  or (source_event_id is null and score_run_id is not null)
  or ((source_mode is null or trim(source_mode) = '') and mode is not null)
  or (coalesce(nullif(trim(source_mode), ''), mode) = 'daily' and is_daily_reward = false);

alter table public.quanta_transactions
  alter column source_game_key set default 'chronogame';

alter table public.quanta_transactions
  alter column source_game_key set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quanta_transactions'::regclass
      and conname = 'quanta_transactions_source_game_fkey'
  ) then
    alter table public.quanta_transactions
      add constraint quanta_transactions_source_game_fkey
      foreign key (source_game_key)
      references public.games_catalog(game_key);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quanta_transactions'::regclass
      and conname = 'quanta_transactions_reward_source_required'
  ) then
    alter table public.quanta_transactions
      add constraint quanta_transactions_reward_source_required
      check (transaction_type <> 'run_reward' or source_event_id is not null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quanta_transactions'::regclass
      and conname = 'quanta_transactions_reward_mode_required'
  ) then
    alter table public.quanta_transactions
      add constraint quanta_transactions_reward_mode_required
      check (transaction_type <> 'run_reward' or source_mode is not null);
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.quanta_transactions'::regclass
      and conname = 'quanta_transactions_score_run_id_fkey'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quanta_transactions'::regclass
      and conname = 'quanta_transactions_chronogame_score_run_id_fkey'
  ) then
    alter table public.quanta_transactions
      rename constraint quanta_transactions_score_run_id_fkey
      to quanta_transactions_chronogame_score_run_id_fkey;
  end if;
end;
$$;

drop index if exists public.quanta_transactions_one_run_reward_idx;
drop index if exists public.quanta_transactions_one_daily_reward_idx;

create unique index if not exists quanta_transactions_source_event_unique_idx
  on public.quanta_transactions (source_game_key, source_event_id, transaction_type)
  where source_event_id is not null;

create unique index if not exists quanta_transactions_daily_per_game_idx
  on public.quanta_transactions (user_id, source_game_key, reward_date)
  where transaction_type = 'run_reward' and is_daily_reward = true;

create index if not exists quanta_transactions_chronogame_score_run_idx
  on public.quanta_transactions (score_run_id)
  where score_run_id is not null;

create index if not exists quanta_transactions_user_reward_source_idx
  on public.quanta_transactions (
    user_id,
    reward_date,
    is_daily_reward,
    source_game_key,
    source_mode
  )
  where transaction_type = 'run_reward';

create or replace function public.set_quanta_transaction_source_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.source_game_key is null or trim(new.source_game_key) = '' then
    new.source_game_key := 'chronogame';
  end if;

  if new.source_mode is null or trim(new.source_mode) = '' then
    new.source_mode := new.mode;
  end if;

  if new.source_game_key = 'chronogame'
     and new.mode is null
     and new.source_mode in ('classic', 'timeAttack', 'survival', 'decade', 'daily') then
    new.mode := new.source_mode;
  end if;

  if new.source_game_key = 'chronogame'
     and new.source_event_id is null
     and new.score_run_id is not null then
    new.source_event_id := new.score_run_id;
  end if;

  if new.source_mode = 'daily' then
    new.is_daily_reward := true;
  end if;

  return new;
end;
$$;

drop trigger if exists quanta_transactions_source_defaults on public.quanta_transactions;
create trigger quanta_transactions_source_defaults
before insert or update on public.quanta_transactions
for each row
execute function public.set_quanta_transaction_source_defaults();

-- ChronoGame Quanta helpers -------------------------------------------------
create or replace function public.chronogame_quanta_mode_reward(p_mode text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_mode
    when 'classic' then 1
    when 'timeAttack' then 2
    when 'survival' then 3
    when 'decade' then 2
    when 'daily' then 4
    else 0
  end
$$;

create or replace function public.chronogame_quanta_reward_text(p_mode text)
returns text
language sql
immutable
set search_path = public
as $$
  select case p_mode
    when 'classic' then 'Timeline stabilized. One Quanta recovered.'
    when 'timeAttack' then 'Clock survived. Two Quanta escaped the countdown.'
    when 'survival' then 'All ten rounds survived. Three Quanta escaped the void.'
    when 'decade' then 'Decade archived. Two Quanta catalogued.'
    when 'daily' then 'Today''s anomaly contained. Four Quanta secured.'
    else 'Quanta recovered.'
  end
$$;

create or replace function public.chronogame_submit_score_run(
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
  inserted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_run_id uuid;
  daily_is_official boolean := false;
  existing_run public.chronogame_score_runs%rowtype;
begin
  if current_user_id is null then
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

  if p_mode = 'decade'
     and (p_selected_decade is null or p_selected_decade < 1960 or p_selected_decade > 2020) then
    raise exception 'A valid decade is required.' using errcode = '22023';
  end if;

  if p_mode = 'daily' and p_daily_date is null then
    raise exception 'A Daily Challenge date is required.' using errcode = '22023';
  end if;

  if p_mode <> 'daily' then
    p_daily_date := null;
  end if;

  if p_round_data is null
     or jsonb_typeof(p_round_data) <> 'array'
     or jsonb_array_length(p_round_data) > 250 then
    raise exception 'Round data must be a valid array.' using errcode = '22023';
  end if;

  select *
  into existing_run
  from public.chronogame_score_runs
  where user_id = current_user_id
    and client_run_id = p_client_run_id;

  if found then
    return query
    select existing_run.id, existing_run.is_daily_official, false;
    return;
  end if;

  if p_mode = 'daily' then
    daily_is_official := not exists (
      select 1
      from public.chronogame_score_runs
      where user_id = current_user_id
        and mode = 'daily'
        and daily_date = p_daily_date
        and is_daily_official = true
    );
  end if;

  begin
    insert into public.chronogame_score_runs (
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
      client_version
    )
    values (
      p_client_run_id,
      current_user_id,
      p_mode,
      p_score,
      p_max_score,
      p_rounds_completed,
      round(p_average_year_error::numeric, 2),
      p_best_streak,
      case when p_mode = 'decade' then p_selected_decade else null end,
      p_daily_date,
      daily_is_official,
      p_round_data,
      left(coalesce(nullif(trim(p_client_version), ''), 'unknown'), 40)
    )
    returning id into new_run_id;
  exception
    when unique_violation then
      select *
      into existing_run
      from public.chronogame_score_runs
      where user_id = current_user_id
        and client_run_id = p_client_run_id;

      if found then
        return query
        select existing_run.id, existing_run.is_daily_official, false;
        return;
      end if;

      if p_mode = 'daily' and daily_is_official then
        daily_is_official := false;

        insert into public.chronogame_score_runs (
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
          client_version
        )
        values (
          p_client_run_id,
          current_user_id,
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
          left(coalesce(nullif(trim(p_client_version), ''), 'unknown'), 40)
        )
        returning id into new_run_id;
      else
        raise;
      end if;
  end;

  return query
  select new_run_id, daily_is_official, true;
end;
$$;

create or replace function public.chronogame_quanta_status_for_run(p_run_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  run_row public.chronogame_score_runs%rowtype;
  cleared boolean;
  rewarded_today integer := 0;
  life_losses integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select * into run_row
  from public.chronogame_score_runs
  where id = p_run_id
    and user_id = current_user_id;

  if not found then
    raise exception 'ChronoGame score run not found.' using errcode = '22023';
  end if;

  if run_row.mode = 'survival' then
    select count(*)::integer into life_losses
    from jsonb_array_elements(run_row.round_data) as item
    where lower(coalesce(item ->> 'life_lost', 'false')) = 'true';
  end if;

  cleared := case
    when run_row.mode in ('classic', 'decade', 'daily') then run_row.rounds_completed = 10
    when run_row.mode = 'timeAttack' then run_row.rounds_completed >= 5
    when run_row.mode = 'survival' then run_row.rounds_completed = 10 and life_losses < 3
    else false
  end;

  if not cleared then
    return 'not_cleared';
  end if;

  if run_row.mode = 'daily' and not run_row.is_daily_official then
    return 'daily_already_paid';
  end if;

  if run_row.mode = 'daily' and exists (
    select 1
    from public.quanta_transactions
    where user_id = current_user_id
      and transaction_type = 'run_reward'
      and source_game_key = 'chronogame'
      and is_daily_reward = true
      and reward_date = run_row.daily_date
  ) then
    return 'daily_already_paid';
  end if;

  if run_row.mode <> 'daily' then
    select count(*)::integer into rewarded_today
    from public.quanta_transactions
    where user_id = current_user_id
      and transaction_type = 'run_reward'
      and is_daily_reward = false
      and reward_date = (now() at time zone 'utc')::date;

    if rewarded_today >= 10 then
      return 'daily_cap_reached';
    end if;
  end if;

  return 'rewarded';
end;
$$;

create or replace function public.chronogame_submit_score_run_v2(
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
  v_daily_official boolean;
  v_inserted boolean;
  v_previous_balance integer := 0;
  v_new_balance integer := 0;
  v_quanta_awarded integer := 0;
  v_reward_status text := 'not_cleared';
  v_rewarded_runs_today integer := 0;
  v_daily_reward_claimed boolean := false;
  v_reward_message text := '';
  v_existing_run public.chronogame_score_runs%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_mode = 'daily'
     and p_daily_date is distinct from (now() at time zone 'utc')::date then
    raise exception 'The Daily Challenge date must match the current UTC date.' using errcode = '22023';
  end if;

  if p_mode <> 'daily' then
    p_daily_date := null;
  end if;

  insert into public.quanta_wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select balance
  into v_previous_balance
  from public.quanta_wallets
  where user_id = v_user_id
  for update;

  v_new_balance := v_previous_balance;

  select result.run_id, result.daily_official, result.inserted
  into v_run_id, v_daily_official, v_inserted
  from public.chronogame_submit_score_run(
    p_client_run_id,
    p_mode,
    p_score,
    p_max_score,
    p_rounds_completed,
    p_average_year_error,
    p_best_streak,
    p_selected_decade,
    p_daily_date,
    p_round_data,
    p_client_version
  ) as result;

  if v_inserted then
    update public.chronogame_score_runs
    set quanta_reward_status = 'pending'
    where id = v_run_id;

    v_reward_status := public.chronogame_quanta_status_for_run(v_run_id);

    if v_reward_status = 'rewarded' then
      v_quanta_awarded := public.chronogame_quanta_mode_reward(p_mode);
      v_reward_message := public.chronogame_quanta_reward_text(p_mode);

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
        metadata,
        source_game_key,
        source_event_id,
        source_mode,
        is_daily_reward
      )
      values (
        v_user_id,
        v_quanta_awarded,
        'run_reward',
        p_mode,
        v_run_id,
        v_reward_message,
        v_new_balance,
        coalesce(p_daily_date, (now() at time zone 'utc')::date),
        jsonb_build_object(
          'client_run_id', p_client_run_id,
          'score', p_score,
          'rounds_completed', p_rounds_completed
        ),
        'chronogame',
        v_run_id,
        p_mode,
        p_mode = 'daily'
      );
    end if;

    update public.chronogame_score_runs
    set
      quanta_awarded = v_quanta_awarded,
      quanta_reward_status = v_reward_status
    where id = v_run_id;
  else
    select *
    into v_existing_run
    from public.chronogame_score_runs
    where id = v_run_id
      and user_id = v_user_id;

    v_quanta_awarded := coalesce(v_existing_run.quanta_awarded, 0);
    v_reward_status := case v_existing_run.quanta_reward_status
      when 'rewarded' then 'already_rewarded'
      when 'legacy_no_reward' then 'duplicate'
      else v_existing_run.quanta_reward_status
    end;
  end if;

  select count(*)::integer
  into v_rewarded_runs_today
  from public.quanta_transactions
  where user_id = v_user_id
    and transaction_type = 'run_reward'
    and is_daily_reward = false
    and reward_date = (now() at time zone 'utc')::date;

  select exists (
    select 1
    from public.quanta_transactions
    where user_id = v_user_id
      and transaction_type = 'run_reward'
      and source_game_key = 'chronogame'
      and is_daily_reward = true
      and reward_date = coalesce(p_daily_date, (now() at time zone 'utc')::date)
  ) into v_daily_reward_claimed;

  if v_reward_message = '' then
    v_reward_message := case v_reward_status
      when 'already_rewarded' then 'This timeline was already rewarded.'
      when 'daily_already_paid' then 'Practice run complete. The timeline already paid today.'
      when 'daily_cap_reached' then 'Reward limit reached. Ten rewarded runs completed today.'
      when 'not_cleared' then 'Run incomplete. ChronoBot refuses to pay unfinished timelines.'
      when 'duplicate' then 'This timeline was already processed. No duplicate Quanta created.'
      else 'No Quanta were awarded for this run.'
    end;
  end if;

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

-- Canonical ChronoGame leaderboard -----------------------------------------
drop function if exists public.get_leaderboard(text, date, integer);
drop function if exists public.chronogame_get_leaderboard(text, date, integer);

create function public.chronogame_get_leaderboard(
  p_mode text default 'classic',
  p_daily_date date default null,
  p_limit integer default 25
)
returns table (
  rank bigint,
  display_name text,
  score integer,
  max_score integer,
  rounds_completed integer,
  average_year_error numeric,
  best_streak integer,
  selected_decade integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select
      runs.user_id,
      profiles.display_name,
      runs.score,
      runs.max_score,
      runs.rounds_completed,
      runs.average_year_error,
      runs.best_streak,
      runs.selected_decade,
      runs.created_at,
      row_number() over (
        partition by runs.user_id
        order by runs.score desc, runs.average_year_error asc, runs.created_at asc
      ) as user_best
    from public.chronogame_score_runs as runs
    join public.profiles as profiles
      on profiles.user_id = runs.user_id
    where runs.mode = p_mode
      and (
        p_mode <> 'daily'
        or (
          runs.daily_date = coalesce(p_daily_date, (now() at time zone 'utc')::date)
          and runs.is_daily_official = true
        )
      )
  ),
  best_scores as (
    select *
    from eligible
    where user_best = 1
  )
  select
    row_number() over (
      order by best_scores.score desc, best_scores.average_year_error asc, best_scores.created_at asc
    ) as rank,
    best_scores.display_name,
    best_scores.score,
    best_scores.max_score,
    best_scores.rounds_completed,
    best_scores.average_year_error,
    best_scores.best_streak,
    best_scores.selected_decade,
    best_scores.created_at
  from best_scores
  order by rank
  limit greatest(1, least(coalesce(p_limit, 25), 100))
$$;

-- Temporary compatibility functions for the currently deployed frontend ----
create or replace function public.submit_score_run(
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
returns table (run_id uuid, daily_official boolean, inserted boolean)
language sql
security definer
set search_path = public
as $$
  select *
  from public.chronogame_submit_score_run(
    p_client_run_id,
    p_mode,
    p_score,
    p_max_score,
    p_rounds_completed,
    p_average_year_error,
    p_best_streak,
    p_selected_decade,
    p_daily_date,
    p_round_data,
    p_client_version
  )
$$;

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
language sql
security definer
set search_path = public
as $$
  select *
  from public.chronogame_submit_score_run_v2(
    p_client_run_id,
    p_mode,
    p_score,
    p_max_score,
    p_rounds_completed,
    p_average_year_error,
    p_best_streak,
    p_selected_decade,
    p_daily_date,
    p_round_data,
    p_client_version
  )
$$;

create function public.get_leaderboard(
  p_mode text default 'classic',
  p_daily_date date default null,
  p_limit integer default 25
)
returns table (
  rank bigint,
  display_name text,
  score integer,
  max_score integer,
  rounds_completed integer,
  average_year_error numeric,
  best_streak integer,
  selected_decade integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.chronogame_get_leaderboard(p_mode, p_daily_date, p_limit)
$$;

-- Private unprefixed helper aliases retained only for rollback compatibility.
create or replace function public.quanta_mode_reward(p_mode text)
returns integer
language sql
immutable
set search_path = public
as $$
  select public.chronogame_quanta_mode_reward(p_mode)
$$;

create or replace function public.quanta_reward_text(p_mode text)
returns text
language sql
immutable
set search_path = public
as $$
  select public.chronogame_quanta_reward_text(p_mode)
$$;

create or replace function public.quanta_status_for_run(p_run_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select public.chronogame_quanta_status_for_run(p_run_id)
$$;

-- Function permissions ------------------------------------------------------
revoke all on function public.chronogame_submit_score_run(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) from public, anon, authenticated;
grant execute on function public.chronogame_submit_score_run(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) to service_role;

revoke all on function public.chronogame_submit_score_run_v2(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) from public, anon;
grant execute on function public.chronogame_submit_score_run_v2(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) to authenticated, service_role;

revoke all on function public.chronogame_get_leaderboard(text, date, integer) from public;
grant execute on function public.chronogame_get_leaderboard(text, date, integer)
  to anon, authenticated, service_role;

revoke all on function public.chronogame_quanta_mode_reward(text) from public, anon, authenticated;
revoke all on function public.chronogame_quanta_reward_text(text) from public, anon, authenticated;
revoke all on function public.chronogame_quanta_status_for_run(uuid) from public, anon, authenticated;
grant execute on function public.chronogame_quanta_mode_reward(text) to service_role;
grant execute on function public.chronogame_quanta_reward_text(text) to service_role;
grant execute on function public.chronogame_quanta_status_for_run(uuid) to service_role;

revoke all on function public.submit_score_run(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) from public, anon;
grant execute on function public.submit_score_run(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) to authenticated, service_role;

revoke all on function public.submit_score_run_v2(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) from public, anon;
grant execute on function public.submit_score_run_v2(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) to authenticated, service_role;

revoke all on function public.get_leaderboard(text, date, integer) from public;
grant execute on function public.get_leaderboard(text, date, integer)
  to anon, authenticated, service_role;

revoke all on function public.quanta_mode_reward(text) from public, anon, authenticated;
revoke all on function public.quanta_reward_text(text) from public, anon, authenticated;
revoke all on function public.quanta_status_for_run(uuid) from public, anon, authenticated;
grant execute on function public.quanta_mode_reward(text) to service_role;
grant execute on function public.quanta_reward_text(text) to service_role;
grant execute on function public.quanta_status_for_run(uuid) to service_role;

-- Shared and game-specific metadata ----------------------------------------
comment on table public.games_catalog is
  'Registry of games that use shared Jivaro Games accounts and Quanta.';
comment on table public.profiles is
  'Shared Jivaro Games public profile data. Emails remain private in Supabase Auth.';
comment on table public.quanta_wallets is
  'One shared permanent Jivaro Games Quanta wallet per authenticated user.';
comment on table public.quanta_transactions is
  'Shared immutable Jivaro Games Quanta ledger with a source game and source event.';
comment on table public.chronogame_score_runs is
  'ChronoGame-specific authenticated score runs within Jivaro Games.';
comment on view public.score_runs is
  'Temporary compatibility view for the former ChronoGame score_runs table name.';
comment on column public.quanta_transactions.mode is
  'Legacy ChronoGame mode field retained temporarily; new games use source_mode.';
comment on column public.quanta_transactions.score_run_id is
  'Legacy ChronoGame run reference retained temporarily; new games use source_event_id.';
comment on column public.quanta_transactions.source_game_key is
  'Game registry key that produced this transaction.';
comment on column public.quanta_transactions.source_event_id is
  'Game-owned UUID for the event that produced this transaction.';
comment on column public.quanta_transactions.source_mode is
  'Game-specific mode identifier without ChronoGame-only constraints.';
comment on column public.quanta_transactions.is_daily_reward is
  'True when this is the source game''s once-per-UTC-date Daily reward.';
comment on function public.chronogame_submit_score_run_v2 is
  'Canonical ChronoGame RPC that atomically saves a run and awards shared Quanta.';
comment on function public.chronogame_get_leaderboard is
  'Canonical ChronoGame leaderboard RPC with a standard rank field.';
comment on function public.submit_score_run_v2 is
  'Temporary compatibility alias for chronogame_submit_score_run_v2.';
comment on function public.get_leaderboard is
  'Temporary compatibility alias for chronogame_get_leaderboard.';

notify pgrst, 'reload schema';
commit;
