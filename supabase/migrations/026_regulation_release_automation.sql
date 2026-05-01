-- Regulation release automation + versioned compliance tracking

create table if not exists regulation_releases (
  id uuid primary key default uuid_generate_v4(),
  regulation_id uuid not null references regulations(id) on delete cascade,
  release_key text not null,
  title text,
  summary text,
  published_at timestamptz,
  effective_at date,
  source_url text,
  source_hash text,
  status text not null default 'active',
  parsed_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (regulation_id, release_key)
);

create index if not exists idx_regulation_releases_regulation_id
  on regulation_releases(regulation_id);
create index if not exists idx_regulation_releases_published_at_desc
  on regulation_releases(published_at desc);
create index if not exists idx_regulation_releases_release_key
  on regulation_releases(release_key);

create table if not exists release_substance_changes (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid not null references regulation_releases(id) on delete cascade,
  change_type text not null,
  substance_name text,
  cas_number text,
  ec_number text,
  concentration_limit text,
  exemption_code text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_release_substance_changes_release_id
  on release_substance_changes(release_id);

create table if not exists component_regulation_release_status (
  id uuid primary key default uuid_generate_v4(),
  component_id uuid not null references components(id) on delete cascade,
  release_id uuid not null references regulation_releases(id) on delete cascade,
  status text not null default 'needs_review',
  evaluated_at timestamptz,
  evidence_ref text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(component_id, release_id)
);

create index if not exists idx_component_release_status_component_id
  on component_regulation_release_status(component_id);
create index if not exists idx_component_release_status_release_id
  on component_regulation_release_status(release_id);

create table if not exists product_regulation_release_status (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  release_id uuid not null references regulation_releases(id) on delete cascade,
  status text not null default 'needs_review',
  evaluated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, release_id)
);

create index if not exists idx_product_release_status_product_id
  on product_regulation_release_status(product_id);
create index if not exists idx_product_release_status_release_id
  on product_regulation_release_status(release_id);

create table if not exists regulation_update_events (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  release_id uuid not null references regulation_releases(id) on delete cascade,
  event_type text not null,
  impacted_components integer not null default 0,
  impacted_products integer not null default 0,
  message text,
  metadata jsonb,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_regulation_update_events_org_created_at
  on regulation_update_events(organization_id, created_at desc);
create index if not exists idx_regulation_update_events_release_id
  on regulation_update_events(release_id);

alter table regulation_releases enable row level security;
alter table release_substance_changes enable row level security;
alter table component_regulation_release_status enable row level security;
alter table product_regulation_release_status enable row level security;
alter table regulation_update_events enable row level security;

-- All org users can view global release metadata.
drop policy if exists "Authenticated users can view regulation_releases" on regulation_releases;
create policy "Authenticated users can view regulation_releases"
  on regulation_releases for select to authenticated using (true);

-- Only elevated app roles can mutate release metadata.
drop policy if exists "Managers can manage regulation_releases" on regulation_releases;
create policy "Managers can manage regulation_releases"
  on regulation_releases for all
  using (can_manage_sensitive_actions())
  with check (can_manage_sensitive_actions());

drop policy if exists "Authenticated users can view release_substance_changes" on release_substance_changes;
create policy "Authenticated users can view release_substance_changes"
  on release_substance_changes for select to authenticated using (true);

drop policy if exists "Managers can manage release_substance_changes" on release_substance_changes;
create policy "Managers can manage release_substance_changes"
  on release_substance_changes for all
  using (can_manage_sensitive_actions())
  with check (can_manage_sensitive_actions());

drop policy if exists "Users can view component_regulation_release_status in org" on component_regulation_release_status;
create policy "Users can view component_regulation_release_status in org"
  on component_regulation_release_status for select
  using (
    exists (
      select 1 from components c
      where c.id = component_regulation_release_status.component_id
        and c.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Managers can manage component_regulation_release_status in org" on component_regulation_release_status;
create policy "Managers can manage component_regulation_release_status in org"
  on component_regulation_release_status for all
  using (
    can_manage_sensitive_actions()
    and exists (
      select 1 from components c
      where c.id = component_regulation_release_status.component_id
        and c.organization_id = get_user_organization_id()
    )
  )
  with check (
    can_manage_sensitive_actions()
    and exists (
      select 1 from components c
      where c.id = component_regulation_release_status.component_id
        and c.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can view product_regulation_release_status in org" on product_regulation_release_status;
create policy "Users can view product_regulation_release_status in org"
  on product_regulation_release_status for select
  using (
    exists (
      select 1 from products p
      where p.id = product_regulation_release_status.product_id
        and p.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Managers can manage product_regulation_release_status in org" on product_regulation_release_status;
create policy "Managers can manage product_regulation_release_status in org"
  on product_regulation_release_status for all
  using (
    can_manage_sensitive_actions()
    and exists (
      select 1 from products p
      where p.id = product_regulation_release_status.product_id
        and p.organization_id = get_user_organization_id()
    )
  )
  with check (
    can_manage_sensitive_actions()
    and exists (
      select 1 from products p
      where p.id = product_regulation_release_status.product_id
        and p.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can view regulation_update_events in org" on regulation_update_events;
create policy "Users can view regulation_update_events in org"
  on regulation_update_events for select
  using (organization_id = get_user_organization_id());

drop policy if exists "Managers can manage regulation_update_events in org" on regulation_update_events;
create policy "Managers can manage regulation_update_events in org"
  on regulation_update_events for all
  using (
    can_manage_sensitive_actions()
    and organization_id = get_user_organization_id()
  )
  with check (
    can_manage_sensitive_actions()
    and organization_id = get_user_organization_id()
  );
