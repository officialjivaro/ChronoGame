-- ChronoGame Cosmetics Store | Adds a secure game-specific catalog, inventory, equipment, and Quanta purchase flow
begin;

create table if not exists public.chronogame_shop_items (
  item_key text primary key,
  category text not null,
  equipment_slot text not null,
  display_name text not null,
  description text not null,
  price integer not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chronogame_shop_items_key_format
    check (item_key ~ '^[a-z][a-z0-9_]*$'),
  constraint chronogame_shop_items_category_valid
    check (category in ('background', 'ui_skin', 'pet')),
  constraint chronogame_shop_items_slot_valid
    check (equipment_slot in ('background', 'ui_skin', 'pet')),
  constraint chronogame_shop_items_category_slot_match
    check (category = equipment_slot),
  constraint chronogame_shop_items_name_length
    check (char_length(trim(display_name)) between 2 and 80),
  constraint chronogame_shop_items_description_length
    check (char_length(trim(description)) between 8 and 240),
  constraint chronogame_shop_items_price_valid
    check (price between 1 and 100000),
  constraint chronogame_shop_items_sort_order_valid
    check (sort_order between 0 and 100000)
);

create table if not exists public.chronogame_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_purchase_id uuid not null,
  item_key text not null references public.chronogame_shop_items(item_key) on delete restrict,
  price_paid integer not null,
  balance_before integer not null,
  balance_after integer not null,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  constraint chronogame_purchase_orders_client_unique
    unique (user_id, client_purchase_id),
  constraint chronogame_purchase_orders_price_valid
    check (price_paid > 0),
  constraint chronogame_purchase_orders_balance_before_valid
    check (balance_before >= 0),
  constraint chronogame_purchase_orders_balance_after_valid
    check (balance_after >= 0 and balance_after = balance_before - price_paid),
  constraint chronogame_purchase_orders_status_valid
    check (status = 'completed')
);

create table if not exists public.chronogame_user_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null references public.chronogame_shop_items(item_key) on delete restrict,
  purchase_order_id uuid references public.chronogame_purchase_orders(id) on delete set null,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create table if not exists public.chronogame_equipped_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  item_key text not null references public.chronogame_shop_items(item_key) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot),
  constraint chronogame_equipped_items_slot_valid
    check (slot in ('background', 'ui_skin', 'pet'))
);

create index if not exists chronogame_shop_items_active_sort_idx
  on public.chronogame_shop_items (category, sort_order, item_key)
  where active = true;

create index if not exists chronogame_purchase_orders_user_created_idx
  on public.chronogame_purchase_orders (user_id, created_at desc);

create index if not exists chronogame_purchase_orders_item_idx
  on public.chronogame_purchase_orders (item_key);

create index if not exists chronogame_user_inventory_user_acquired_idx
  on public.chronogame_user_inventory (user_id, acquired_at desc);

create index if not exists chronogame_user_inventory_item_idx
  on public.chronogame_user_inventory (item_key);

create index if not exists chronogame_user_inventory_purchase_order_idx
  on public.chronogame_user_inventory (purchase_order_id)
  where purchase_order_id is not null;

create index if not exists chronogame_equipped_items_item_idx
  on public.chronogame_equipped_items (item_key);

create or replace function public.chronogame_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.chronogame_touch_updated_at() from public, anon, authenticated;
grant execute on function public.chronogame_touch_updated_at() to service_role;

drop trigger if exists chronogame_shop_items_set_updated_at on public.chronogame_shop_items;
create trigger chronogame_shop_items_set_updated_at
before update on public.chronogame_shop_items
for each row execute function public.chronogame_touch_updated_at();

drop trigger if exists chronogame_equipped_items_set_updated_at on public.chronogame_equipped_items;
create trigger chronogame_equipped_items_set_updated_at
before update on public.chronogame_equipped_items
for each row execute function public.chronogame_touch_updated_at();

insert into public.chronogame_shop_items (
  item_key,
  category,
  equipment_slot,
  display_name,
  description,
  price,
  active,
  sort_order
)
values
  ('amber_terminal', 'background', 'background', 'Amber Terminal', 'A sunset terminal city framed by an amber vector grid.', 20, true, 10),
  ('midnight_vector', 'background', 'background', 'Midnight Vector', 'Cold cyan geometry across a silent midnight horizon.', 28, true, 20),
  ('violet_timegrid', 'background', 'background', 'Violet Timegrid', 'A luminous temporal gate suspended above a violet grid.', 34, true, 30),
  ('neon_archive', 'background', 'background', 'Neon Archive', 'A multicolor data vault recovered from a forgotten arcade.', 40, true, 40),
  ('amber_reactor', 'ui_skin', 'ui_skin', 'Amber Reactor', 'Deep bronze panels with bright reactor-orange controls.', 30, true, 50),
  ('phosphor_grid', 'ui_skin', 'ui_skin', 'Phosphor Grid', 'Green terminal phosphor with crisp archival grid lines.', 40, true, 60),
  ('violet_vector', 'ui_skin', 'ui_skin', 'Violet Vector', 'Violet glass, cyan highlights, and sharp vector framing.', 50, true, 70),
  ('byte_cat', 'pet', 'pet', 'Byte Cat', 'A curious cyber-cat with bright scanner eyes.', 50, true, 80),
  ('pixel_pup', 'pet', 'pet', 'Pixel Pup', 'An eager arcade pup with a permanently optimistic tail.', 60, true, 90),
  ('clockwork_owl', 'pet', 'pet', 'Clockwork Owl', 'A watchful brass-clock owl calibrated to UTC.', 70, true, 100)
on conflict (item_key) do update
set
  category = excluded.category,
  equipment_slot = excluded.equipment_slot,
  display_name = excluded.display_name,
  description = excluded.description,
  price = excluded.price,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.chronogame_shop_items enable row level security;
alter table public.chronogame_purchase_orders enable row level security;
alter table public.chronogame_user_inventory enable row level security;
alter table public.chronogame_equipped_items enable row level security;

drop policy if exists chronogame_shop_items_read_active on public.chronogame_shop_items;
create policy chronogame_shop_items_read_active
on public.chronogame_shop_items
for select
to anon, authenticated
using (active = true);

drop policy if exists chronogame_purchase_orders_select_own on public.chronogame_purchase_orders;
create policy chronogame_purchase_orders_select_own
on public.chronogame_purchase_orders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists chronogame_user_inventory_select_own on public.chronogame_user_inventory;
create policy chronogame_user_inventory_select_own
on public.chronogame_user_inventory
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists chronogame_equipped_items_select_own on public.chronogame_equipped_items;
create policy chronogame_equipped_items_select_own
on public.chronogame_equipped_items
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.chronogame_shop_items from public, anon, authenticated;
revoke all on table public.chronogame_purchase_orders from public, anon, authenticated;
revoke all on table public.chronogame_user_inventory from public, anon, authenticated;
revoke all on table public.chronogame_equipped_items from public, anon, authenticated;

grant select on table public.chronogame_shop_items to anon, authenticated;
grant select on table public.chronogame_purchase_orders to authenticated;
grant select on table public.chronogame_user_inventory to authenticated;
grant select on table public.chronogame_equipped_items to authenticated;
grant all on table public.chronogame_shop_items to service_role;
grant all on table public.chronogame_purchase_orders to service_role;
grant all on table public.chronogame_user_inventory to service_role;
grant all on table public.chronogame_equipped_items to service_role;

create or replace function public.chronogame_purchase_item(
  p_item_key text,
  p_client_purchase_id uuid
)
returns table (
  purchase_order_id uuid,
  item_key text,
  price_paid integer,
  previous_balance integer,
  new_balance integer,
  inserted boolean,
  owned boolean,
  message text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_item_key text := lower(trim(coalesce(p_item_key, '')));
  v_item public.chronogame_shop_items%rowtype;
  v_existing_order public.chronogame_purchase_orders%rowtype;
  v_existing_inventory public.chronogame_user_inventory%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_previous_balance integer;
  v_new_balance integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_client_purchase_id is null then
    raise exception 'A client purchase ID is required.' using errcode = '22023';
  end if;

  if v_item_key = '' then
    raise exception 'A cosmetic item key is required.' using errcode = '22023';
  end if;

  select *
  into v_item
  from public.chronogame_shop_items as shop_item
  where shop_item.item_key = v_item_key
    and shop_item.active = true;

  if not found then
    raise exception 'This cosmetic is not available.' using errcode = '22023';
  end if;

  insert into public.quanta_wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select wallet.balance
  into v_previous_balance
  from public.quanta_wallets as wallet
  where wallet.user_id = v_user_id
  for update;

  select *
  into v_existing_order
  from public.chronogame_purchase_orders as purchase_order
  where purchase_order.user_id = v_user_id
    and purchase_order.client_purchase_id = p_client_purchase_id;

  if found then
    if v_existing_order.item_key <> v_item_key then
      raise exception 'This purchase ID was already used for another item.' using errcode = '22023';
    end if;

    return query
    select
      v_existing_order.id,
      v_existing_order.item_key,
      v_existing_order.price_paid,
      v_existing_order.balance_before,
      v_existing_order.balance_after,
      false,
      true,
      'Purchase already completed.'::text;
    return;
  end if;

  select *
  into v_existing_inventory
  from public.chronogame_user_inventory as inventory_item
  where inventory_item.user_id = v_user_id
    and inventory_item.item_key = v_item_key;

  if found then
    return query
    select
      v_existing_inventory.purchase_order_id,
      v_existing_inventory.item_key,
      0,
      v_previous_balance,
      v_previous_balance,
      false,
      true,
      'This item is already in your inventory.'::text;
    return;
  end if;

  if v_previous_balance < v_item.price then
    raise exception 'Not enough Quanta. This item costs % Q and your balance is % Q.', v_item.price, v_previous_balance
      using errcode = '22023';
  end if;

  update public.quanta_wallets
  set
    balance = balance - v_item.price,
    lifetime_spent = lifetime_spent + v_item.price
  where user_id = v_user_id
  returning balance into v_new_balance;

  insert into public.chronogame_purchase_orders (
    id,
    user_id,
    client_purchase_id,
    item_key,
    price_paid,
    balance_before,
    balance_after,
    status
  )
  values (
    v_order_id,
    v_user_id,
    p_client_purchase_id,
    v_item.item_key,
    v_item.price,
    v_previous_balance,
    v_new_balance,
    'completed'
  );

  insert into public.chronogame_user_inventory (
    user_id,
    item_key,
    purchase_order_id
  )
  values (
    v_user_id,
    v_item.item_key,
    v_order_id
  );

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
    is_daily_reward,
    source_mode
  )
  values (
    v_user_id,
    -v_item.price,
    'purchase',
    null,
    null,
    'Purchased ' || v_item.display_name || ' in ChronoGame.',
    v_new_balance,
    (now() at time zone 'utc')::date,
    jsonb_build_object(
      'item_key', v_item.item_key,
      'category', v_item.category,
      'equipment_slot', v_item.equipment_slot,
      'client_purchase_id', p_client_purchase_id,
      'purchase_order_id', v_order_id
    ),
    'chronogame',
    v_order_id,
    false,
    'cosmetic_purchase'
  );

  return query
  select
    v_order_id,
    v_item.item_key,
    v_item.price,
    v_previous_balance,
    v_new_balance,
    true,
    true,
    (v_item.display_name || ' added to your inventory.')::text;
end;
$$;

create or replace function public.chronogame_set_equipped_item(
  p_slot text,
  p_item_key text default null
)
returns table (
  equipped_slot text,
  equipped_item_key text,
  equipped_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_slot text := lower(trim(coalesce(p_slot, '')));
  v_item_key text := nullif(lower(trim(coalesce(p_item_key, ''))), '');
  v_item public.chronogame_shop_items%rowtype;
  v_updated_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if v_slot not in ('background', 'ui_skin', 'pet') then
    raise exception 'Unsupported cosmetic equipment slot.' using errcode = '22023';
  end if;

  if v_item_key is null then
    delete from public.chronogame_equipped_items
    where user_id = v_user_id
      and slot = v_slot;

    return query select v_slot, null::text, v_updated_at;
    return;
  end if;

  select *
  into v_item
  from public.chronogame_shop_items as shop_item
  where shop_item.item_key = v_item_key
    and shop_item.equipment_slot = v_slot;

  if not found then
    raise exception 'That cosmetic does not belong in this equipment slot.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.chronogame_user_inventory as inventory_item
    where inventory_item.user_id = v_user_id
      and inventory_item.item_key = v_item_key
  ) then
    raise exception 'Purchase this cosmetic before equipping it.' using errcode = '42501';
  end if;

  insert into public.chronogame_equipped_items (
    user_id,
    slot,
    item_key,
    updated_at
  )
  values (
    v_user_id,
    v_slot,
    v_item_key,
    v_updated_at
  )
  on conflict (user_id, slot) do update
  set
    item_key = excluded.item_key,
    updated_at = excluded.updated_at
  returning updated_at into v_updated_at;

  return query select v_slot, v_item_key, v_updated_at;
end;
$$;

revoke all on function public.chronogame_purchase_item(text, uuid) from public, anon;
grant execute on function public.chronogame_purchase_item(text, uuid) to authenticated, service_role;

revoke all on function public.chronogame_set_equipped_item(text, text) from public, anon;
grant execute on function public.chronogame_set_equipped_item(text, text) to authenticated, service_role;

comment on table public.chronogame_shop_items is
  'Server-authoritative ChronoGame cosmetic catalog within Jivaro Games.';
comment on table public.chronogame_purchase_orders is
  'Idempotent ChronoGame cosmetic purchases paid from the shared Quanta wallet.';
comment on table public.chronogame_user_inventory is
  'ChronoGame-specific cosmetic ownership for Jivaro Games users.';
comment on table public.chronogame_equipped_items is
  'One equipped ChronoGame cosmetic per background, UI skin, and pet slot.';
comment on function public.chronogame_purchase_item(text, uuid) is
  'Atomically validates price, debits shared Quanta, records the ledger entry, and grants a ChronoGame cosmetic.';
comment on function public.chronogame_set_equipped_item(text, text) is
  'Equips an owned ChronoGame cosmetic or restores the default for a slot.';

notify pgrst, 'reload schema';
commit;
