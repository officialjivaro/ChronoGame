-- ChronoGame frontend cutover hardening
-- This exact migration is already applied to the Jivaro Games production project.
begin;

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

create index if not exists quanta_transactions_user_reward_source_idx
  on public.quanta_transactions (
    user_id,
    reward_date,
    is_daily_reward,
    source_game_key,
    source_mode
  )
  where transaction_type = 'run_reward';

alter function public.chronogame_submit_score_run(
  uuid, text, integer, integer, integer, numeric, integer, integer, date, jsonb, text
) security definer;

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

comment on function public.chronogame_submit_score_run_v2 is
  'Canonical ChronoGame RPC that atomically saves a run and awards shared Quanta.';

notify pgrst, 'reload schema';
commit;
