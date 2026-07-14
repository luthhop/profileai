-- Migration: Subscriptions (Stripe)
-- Sprint 15

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plano text not null default 'free' check (plano in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);

-- Usage counters for free plan limits
create table if not exists usage_counters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  feature text not null,
  count integer not null default 0,
  reset_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now(),
  unique(user_id, feature)
);

alter table usage_counters enable row level security;

create policy "Users can read own usage"
  on usage_counters for select
  using (auth.uid() = user_id);

create policy "Service can manage usage"
  on usage_counters for all
  using (true);

create index idx_usage_user_feature on usage_counters(user_id, feature);
