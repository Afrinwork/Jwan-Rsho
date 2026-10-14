-- Debt book: who still owes how much, since when, plus a note ("pays after
-- the 15th"). Replaces keeping this in the phone's notes app. Belongs to the
-- account that records it (owner_id = auth.uid()) -- the owner and their
-- secretary share one login -- and drivers never see it, even though a
-- driver's own uid could never match an owner's rows anyway.
--
-- Open debt: paid_at is null. "Paid" stamps paid_at (it leaves the total but
-- stays in the history), "unpaid" clears it again, delete removes the row.

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  customer_name text not null,
  amount numeric(12, 2) not null,
  since date not null default current_date,
  note text,
  paid_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_customer_name_length check (char_length(btrim(customer_name)) between 1 and 200),
  constraint debts_amount_range check (amount > 0 and amount < 10000000),
  constraint debts_note_length check (note is null or char_length(note) <= 1000)
);

create index debts_owner_open_idx on public.debts (owner_id, paid_at, since);

create function public.fn_can_use_debts(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_owner_id = auth.uid() and public.fn_caller_role() in ('admin', 'super_admin');
$$;

alter table public.debts enable row level security;

create policy debts_select on public.debts
  for select using ((select public.fn_can_use_debts(owner_id)));

create policy debts_insert on public.debts
  for insert with check ((select public.fn_can_use_debts(owner_id)) and created_by = (select auth.uid()));

create policy debts_update on public.debts
  for update using ((select public.fn_can_use_debts(owner_id)))
  with check ((select public.fn_can_use_debts(owner_id)));

create policy debts_delete on public.debts
  for delete using ((select public.fn_can_use_debts(owner_id)));

create function public.debts_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger debts_touch_updated_at
  before update on public.debts
  for each row execute function public.debts_touch_updated_at();

-- Both phones on the account see changes live. Guarded so the migration
-- still applies where the publication doesn't exist.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.debts;
  end if;
end $$;
