-- Debt book, part 2: debts belong to a real customer (name/address/phone
-- come from the customer record, so they stay current) and are paid off in
-- any number of payments instead of one "paid" switch.
--
--   open balance = debts.amount - sum(debt_payments.amount)
--
-- A debt already marked as paid (paid_at, from part 1) becomes one payment
-- of its full amount, then paid_at goes away.

alter table public.debts
  add column customer_id text references public.customers (id) on delete set null;

create index debts_owner_customer_idx on public.debts (owner_id, customer_id);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  paid_on date not null default current_date,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint debt_payments_amount_range check (amount > 0 and amount < 10000000)
);

create index debt_payments_debt_idx on public.debt_payments (debt_id);
create index debt_payments_owner_idx on public.debt_payments (owner_id);

insert into public.debt_payments (debt_id, owner_id, amount, paid_on, created_by, created_at)
select id, owner_id, amount, (paid_at at time zone 'Europe/Berlin')::date, created_by, paid_at
from public.debts
where paid_at is not null;

alter table public.debts drop column paid_at;

drop index if exists public.debts_owner_open_idx;
create index debts_owner_since_idx on public.debts (owner_id, since);

-- A debt may only point at a customer of the same account.
create function public.fn_debt_customer_ok(p_owner_id uuid, p_customer_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_customer_id is null
    or exists (select 1 from public.customers c where c.id = p_customer_id and c.owner_id = p_owner_id);
$$;

drop policy debts_insert on public.debts;
drop policy debts_update on public.debts;

create policy debts_insert on public.debts
  for insert with check (
    (select public.fn_can_use_debts(owner_id))
    and created_by = (select auth.uid())
    and public.fn_debt_customer_ok(owner_id, customer_id)
  );

create policy debts_update on public.debts
  for update using ((select public.fn_can_use_debts(owner_id)))
  with check ((select public.fn_can_use_debts(owner_id)) and public.fn_debt_customer_ok(owner_id, customer_id));

-- Payments: same account rule, and only onto a debt of that account.
create function public.fn_debt_belongs_to(p_debt_id uuid, p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.debts d where d.id = p_debt_id and d.owner_id = p_owner_id);
$$;

alter table public.debt_payments enable row level security;

create policy debt_payments_select on public.debt_payments
  for select using ((select public.fn_can_use_debts(owner_id)));

create policy debt_payments_insert on public.debt_payments
  for insert with check (
    (select public.fn_can_use_debts(owner_id))
    and created_by = (select auth.uid())
    and public.fn_debt_belongs_to(debt_id, owner_id)
  );

create policy debt_payments_update on public.debt_payments
  for update using ((select public.fn_can_use_debts(owner_id)))
  with check ((select public.fn_can_use_debts(owner_id)) and public.fn_debt_belongs_to(debt_id, owner_id));

create policy debt_payments_delete on public.debt_payments
  for delete using ((select public.fn_can_use_debts(owner_id)));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.debt_payments;
  end if;
end $$;
