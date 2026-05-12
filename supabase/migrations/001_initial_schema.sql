-- Side Quests Phase 3 schema
-- Run this in Supabase SQL editor or via the Supabase CLI.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('tasker', 'worker', 'vendor', 'mediator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quest_type as enum ('online', 'physical', 'vendor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quest_category as enum ('design', 'development', 'writing', 'delivery', 'shopping', 'printing', 'medicine', 'transport', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quest_status as enum ('open', 'accepted', 'in-progress', 'awaiting-confirmation', 'completed', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.urgency_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tracking_status as enum ('inactive', 'active', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dispute_status as enum ('pending', 'recommended', 'finalized');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_type as enum ('escrow_lock', 'vendor_payment', 'worker_reward', 'mediator_reward', 'refund');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'succeeded', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role public.user_role not null default 'tasker',
  campus text,
  verification_status public.verification_status not null default 'pending',
  wallet_placeholder text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Nigeria',
  city text,
  boundary_geojson jsonb,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references public.campuses(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  name text not null unique,
  category text,
  wallet_placeholder text,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid references public.profiles(id) on delete set null,
  worker_id uuid references public.profiles(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  title text not null,
  description text,
  category public.quest_category not null default 'other',
  type public.quest_type not null,
  reward_amount numeric(12,2) not null default 0,
  item_funds_amount numeric(12,2) not null default 0,
  campus_text text,
  location_text text,
  safe_handoff_point text,
  deadline date,
  status public.quest_status not null default 'open',
  urgency public.urgency_level not null default 'medium',
  verified_required boolean not null default false,
  proof_text text,
  delivery_proof_url text,
  online_submission_url text,
  live_tracking_status public.tracking_status not null default 'inactive',
  items_picked boolean not null default false,
  vendor_confirmed boolean not null default false,
  escrow_locked boolean not null default true,
  vendor_paid_amount numeric(12,2) not null default 0,
  worker_reward_released boolean not null default false,
  reimbursement_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_items (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  estimated_price numeric(12,2),
  substitution_notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quest_events (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  vendor_name text not null,
  vendor_wallet text,
  total_amount numeric(12,2) not null default 0,
  receipt_url text,
  issued_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  tasker_id uuid references public.profiles(id) on delete set null,
  worker_id uuid references public.profiles(id) on delete set null,
  mediator_id uuid references public.profiles(id) on delete set null,
  admin_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status public.dispute_status not null default 'pending',
  recommendation text,
  final_verdict text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete set null,
  file_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references public.quests(id) on delete set null,
  payer_profile_id uuid references public.profiles(id) on delete set null,
  payee_profile_id uuid references public.profiles(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  payment_type public.payment_type not null,
  status public.payment_status not null default 'pending',
  source_wallet text,
  destination_wallet text,
  tx_signature text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.campuses enable row level security;
alter table public.vendors enable row level security;
alter table public.quests enable row level security;
alter table public.quest_items enable row level security;
alter table public.quest_events enable row level security;
alter table public.receipts enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.payments enable row level security;

create policy "profiles are readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "users can upsert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "campuses readable" on public.campuses for select to authenticated using (true);
create policy "vendors readable" on public.vendors for select to authenticated using (true);
create policy "vendors insertable" on public.vendors for insert to authenticated with check (true);
create policy "vendors updatable by owner" on public.vendors for update to authenticated using (owner_profile_id = auth.uid());

create policy "quests readable" on public.quests for select to authenticated using (true);
create policy "quests insertable" on public.quests for insert to authenticated with check (tasker_id = auth.uid());
create policy "quest participants can update" on public.quests for update to authenticated using (
  tasker_id = auth.uid() or worker_id = auth.uid() or exists (
    select 1 from public.vendors v where v.id = vendor_id and v.owner_profile_id = auth.uid()
  )
);

create policy "quest items readable" on public.quest_items for select to authenticated using (true);
create policy "quest items insertable" on public.quest_items for insert to authenticated with check (true);

create policy "quest events readable" on public.quest_events for select to authenticated using (true);
create policy "quest events insertable" on public.quest_events for insert to authenticated with check (true);

create policy "receipts readable" on public.receipts for select to authenticated using (true);
create policy "receipts insertable" on public.receipts for insert to authenticated with check (true);

create policy "disputes readable" on public.disputes for select to authenticated using (true);
create policy "disputes insertable" on public.disputes for insert to authenticated with check (true);
create policy "disputes updatable" on public.disputes for update to authenticated using (true);

create policy "dispute evidence readable" on public.dispute_evidence for select to authenticated using (true);
create policy "dispute evidence insertable" on public.dispute_evidence for insert to authenticated with check (true);

create policy "payments readable" on public.payments for select to authenticated using (true);
create policy "payments insertable" on public.payments for insert to authenticated with check (true);

insert into storage.buckets (id, name, public)
values
  ('quest-proofs', 'quest-proofs', true),
  ('quest-receipts', 'quest-receipts', true),
  ('quest-submissions', 'quest-submissions', true)
on conflict (id) do nothing;

create policy "authenticated users can upload quest files"
on storage.objects for insert to authenticated
with check (bucket_id in ('quest-proofs', 'quest-receipts', 'quest-submissions'));

create policy "quest files are publicly readable"
on storage.objects for select to anon, authenticated
using (bucket_id in ('quest-proofs', 'quest-receipts', 'quest-submissions'));

