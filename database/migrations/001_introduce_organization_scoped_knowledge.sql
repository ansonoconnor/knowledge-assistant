/******************************************************************************
 * Migration:
 * Introduce organization-scoped Knowledge Assistant storage
 *
 * Required property:
 * Every knowledge chunk belongs to an explicit organization, and authenticated
 * access is limited to organizations in which the user has membership.
 *
 * Deployment note:
 * Do not apply this migration until the companion application change supplies
 * organization_id during ingestion and uses user-scoped database authority.
 ******************************************************************************/

begin;

/******************************************************************************
 * Preconditions
 ******************************************************************************/

do $$
begin
  if not exists (
    select 1
    from public.organizations
    where id = 'org-momentum-co'
  ) then
    raise exception
      'Required organization org-momentum-co does not exist';
  end if;
end
$$;

/******************************************************************************
 * Organization scope
 ******************************************************************************/

alter table public.knowledge_chunks
  add column if not exists organization_id text;

update public.knowledge_chunks
set organization_id = 'org-momentum-co'
where organization_id is null;

alter table public.knowledge_chunks
  alter column organization_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_chunks_organization_id_fkey'
      and conrelid = 'public.knowledge_chunks'::regclass
  ) then
    alter table public.knowledge_chunks
      add constraint knowledge_chunks_organization_id_fkey
      foreign key (organization_id)
      references public.organizations(id)
      on delete cascade;
  end if;
end
$$;

create index if not exists
  knowledge_chunks_organization_id_idx
on public.knowledge_chunks (organization_id);

/******************************************************************************
 * Row-level authorization
 ******************************************************************************/

alter table public.knowledge_chunks
  enable row level security;

drop policy if exists
  "Organization members can view knowledge chunks"
on public.knowledge_chunks;

create policy
  "Organization members can view knowledge chunks"
on public.knowledge_chunks
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id =
      knowledge_chunks.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists
  "Organization members can create knowledge chunks"
on public.knowledge_chunks;

create policy
  "Organization members can create knowledge chunks"
on public.knowledge_chunks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id =
      knowledge_chunks.organization_id
      and membership.user_id = auth.uid()
  )
);

commit;

/******************************************************************************
 * Post-deployment verification
 *
 * Run separately after this migration is eventually applied:
 *
 * select
 *   count(*) as total_chunks,
 *   count(*) filter (
 *     where organization_id is null
 *   ) as unscoped_chunks,
 *   count(*) filter (
 *     where organization_id = 'org-momentum-co'
 *   ) as momentum_chunks
 * from public.knowledge_chunks;
 *
 * Expected current result:
 * total_chunks = 39
 * unscoped_chunks = 0
 * momentum_chunks = 39
 ******************************************************************************/
