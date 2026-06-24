-- ChronoGame Online Scores | Supabase Auth, profiles, verified ownership, and public leaderboards
begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 3 and 24),
  constraint profiles_display_name_characters check (trim(display_name) ~ '^[[:alnum:] _.-]+$')
);

create table if not exists public.score_runs (
  id uuid primary key default gen_random_uuid(),
  client_run_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  score integer not null,
  max_score integer not null,
  rounds_completed integer not null,
  average_year_error numeric(7, 2) not null default 0,
  best_streak integer not null default 0,
  selected_decade integer,
  daily_date date,
  is_daily_official boolean not null default false,
  round_data jsonb not null default '[]'::jsonb,
  client_version text not null default '1.0.0',
  verification_level text not null default 'client',
  created_at timestamptz not null default now(),
  constraint score_runs_client_run_unique unique (user_id, client_run_id),
  constraint score_runs_mode_valid check (mode in ('classic', 'timeAttack', 'survival', 'decade', 'daily')),
  constraint score_runs_score_valid check (score between 0 and 250000),
  constraint score_runs_max_score_valid check (max_score between 1 and 250000 and score <= max_score),
  constraint score_runs_rounds_valid check (rounds_completed between 1 and 250),
  constraint score_runs_average_error_valid check (average_year_error between 0 and 70),
  constraint score_runs_streak_valid check (best_streak between 0 and rounds_completed),
  constraint score_runs_decade_valid check (selected_decade is null or selected_decade between 1960 and 2020),
  constraint score_runs_decade_required check (mode <> 'decade' or selected_decade is not null),
  constraint score_runs_daily_date_valid check (
    (mode = 'daily' and daily_date is not null)
    or
    (mode <> 'daily' and daily_date is null)
  ),
  constraint score_runs_round_data_array check (jsonb_typeof(round_data) = 'array'),
  constraint score_runs_round_data_length check (jsonb_array_length(round_data) <= 250),
  constraint score_runs_verification_level_valid check (verification_level in ('client', 'server'))
);

create table if not exists public.external_account_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  external_account_id text not null,
  verified_email text,
  verified_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, provider),
  constraint external_account_links_provider_valid check (provider in ('squarespace')),
  constraint external_account_links_provider_id_unique unique (provider, external_account_id)
);

create index if not exists score_runs_mode_score_idx
  on public.score_runs (mode, score desc, average_year_error asc, created_at asc);

create index if not exists score_runs_user_created_idx
  on public.score_runs (user_id, created_at desc);

create index if not exists score_runs_daily_idx
  on public.score_runs (daily_date, score desc, average_year_error asc)
  where mode = 'daily' and is_daily_official = true;

create unique index if not exists score_runs_one_daily_official_per_user_idx
  on public.score_runs (user_id, daily_date)
  where mode = 'daily' and is_daily_official = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists create_profile_after_auth_user on auth.users;
create trigger create_profile_after_auth_user
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

insert into public.profiles (user_id, display_name)
select
  users.id,
  left(
    coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
      'Player-' || upper(substr(replace(users.id::text, '-', ''), 1, 6))
    ),
    24
  )
from auth.users as users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.score_runs enable row level security;
alter table public.external_account_links enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists score_runs_select_own on public.score_runs;
create policy score_runs_select_own
on public.score_runs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists external_links_select_own on public.external_account_links;
create policy external_links_select_own
on public.external_account_links
for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.score_runs from anon, authenticated;
revoke all on public.external_account_links from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.score_runs to authenticated;
grant select on public.external_account_links to authenticated;

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
  existing_run public.score_runs%rowtype;
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

  if p_mode = 'decade' and (p_selected_decade is null or p_selected_decade < 1960 or p_selected_decade > 2020) then
    raise exception 'A valid decade is required.' using errcode = '22023';
  end if;

  if p_mode = 'daily' and p_daily_date is null then
    raise exception 'A Daily Challenge date is required.' using errcode = '22023';
  end if;

  if p_mode <> 'daily' then
    p_daily_date := null;
  end if;

  if p_round_data is null or jsonb_typeof(p_round_data) <> 'array' or jsonb_array_length(p_round_data) > 250 then
    raise exception 'Round data must be a valid array.' using errcode = '22023';
  end if;

  select *
  into existing_run
  from public.score_runs
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
      from public.score_runs
      where user_id = current_user_id
        and mode = 'daily'
        and daily_date = p_daily_date
        and is_daily_official = true
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
      from public.score_runs
      where user_id = current_user_id
        and client_run_id = p_client_run_id;

      if found then
        return query
        select existing_run.id, existing_run.is_daily_official, false;
        return;
      end if;

      if p_mode = 'daily' and daily_is_official then
        daily_is_official := false;

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

revoke all on function public.submit_score_run(
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
) from public;

grant execute on function public.submit_score_run(
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

create or replace function public.get_leaderboard(
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
    from public.score_runs as runs
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
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

revoke all on function public.get_leaderboard(text, date, integer) from public;
grant execute on function public.get_leaderboard(text, date, integer) to anon, authenticated;

comment on table public.profiles is 'Public-facing ChronoGame profile data. Emails remain in Supabase Auth and are never exposed here.';
comment on table public.score_runs is 'Authenticated ChronoGame score submissions. Direct inserts are disabled; use submit_score_run.';
comment on table public.external_account_links is 'Reserved for future verified integrations such as Squarespace account linking.';
comment on function public.submit_score_run is 'Creates an idempotent score run owned by the authenticated Supabase user.';
comment on function public.get_leaderboard is 'Returns one best leaderboard entry per player without exposing user IDs or emails.';

commit;
