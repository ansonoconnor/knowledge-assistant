/******************************************************************************
 * Migration:
 * Make PDF ingestion recoverable and idempotent
 *
 * Required property:
 * Persisted chunks do not become available for browsing or retrieval until
 * their durable document record reaches a database-verified complete state.
 ******************************************************************************/

begin;

/******************************************************************************
 * Durable document identity and lifecycle
 ******************************************************************************/

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null
    references public.organizations(id)
    on delete cascade,
  source_name text not null,
  source_hash text not null,
  status text not null default 'processing'
    check (
      status = any (
        array[
          'processing'::text,
          'failed'::text,
          'complete'::text
        ]
      )
    ),
  expected_chunk_count integer not null
    check (expected_chunk_count > 0),
  persisted_chunk_count integer not null default 0
    check (persisted_chunk_count >= 0),
  error_code text,
  created_by uuid
    references auth.users(id)
    on delete set null
    default auth.uid(),
  processing_user_id uuid
    references auth.users(id)
    on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id, source_hash)
);

create index
  knowledge_documents_organization_status_idx
on public.knowledge_documents (
  organization_id,
  status
);

alter table public.knowledge_documents
  enable row level security;

revoke all
on public.knowledge_documents
from anon, authenticated;

grant select
on public.knowledge_documents
to authenticated;

grant select, insert, update, delete
on public.knowledge_documents
to service_role;

create policy
  "Organization members can view knowledge documents"
on public.knowledge_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id =
      knowledge_documents.organization_id
      and membership.user_id = (select auth.uid())
  )
);

/******************************************************************************
 * Backfill existing knowledge as complete durable documents
 ******************************************************************************/

insert into public.knowledge_documents (
  organization_id,
  source_name,
  source_hash,
  status,
  expected_chunk_count,
  persisted_chunk_count,
  completed_at
)
select
  grouped.organization_id,
  grouped.source_name,
  'legacy:' || md5(
    grouped.organization_id || ':' || grouped.source_name
  ),
  'complete',
  grouped.chunk_count,
  grouped.chunk_count,
  now()
from (
  select
    organization_id,
    regexp_replace(
      coalesce(title, 'Untitled Document'),
      '\s+-\s+Part\s+\d+$',
      '',
      'i'
    ) as source_name,
    count(*)::integer as chunk_count
  from public.knowledge_chunks
  group by
    organization_id,
    regexp_replace(
      coalesce(title, 'Untitled Document'),
      '\s+-\s+Part\s+\d+$',
      '',
      'i'
    )
) grouped;

alter table public.knowledge_chunks
  add column document_id uuid,
  add column chunk_index integer;

update public.knowledge_chunks chunk
set document_id = document.id
from public.knowledge_documents document
where document.organization_id = chunk.organization_id
  and document.source_name = regexp_replace(
    coalesce(chunk.title, 'Untitled Document'),
    '\s+-\s+Part\s+\d+$',
    '',
    'i'
  );

with ordered_chunks as (
  select
    id,
    row_number() over (
      partition by document_id
      order by id
    ) - 1 as zero_based_index
  from public.knowledge_chunks
)
update public.knowledge_chunks chunk
set chunk_index =
  ordered_chunks.zero_based_index
from ordered_chunks
where ordered_chunks.id = chunk.id;

alter table public.knowledge_chunks
  alter column document_id set not null,
  alter column chunk_index set not null,
  add constraint
    knowledge_chunks_document_id_fkey
    foreign key (document_id)
    references public.knowledge_documents(id)
    on delete cascade,
  add constraint
    knowledge_chunks_document_position_key
    unique (document_id, chunk_index),
  add constraint
    knowledge_chunks_chunk_index_check
    check (chunk_index >= 0);

create index
  knowledge_chunks_document_id_idx
on public.knowledge_chunks (document_id);

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
    from public.knowledge_documents document
    join public.organization_memberships membership
      on membership.organization_id =
        document.organization_id
    where document.id =
        knowledge_chunks.document_id
      and document.organization_id =
        knowledge_chunks.organization_id
      and membership.user_id = (select auth.uid())
      and (
        document.status = 'complete'
        or document.processing_user_id = (select auth.uid())
      )
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
    from public.knowledge_documents document
    join public.organization_memberships membership
      on membership.organization_id =
        document.organization_id
    where document.id =
        knowledge_chunks.document_id
      and document.organization_id =
        knowledge_chunks.organization_id
      and document.status = 'processing'
      and document.processing_user_id = (select auth.uid())
      and membership.user_id = (select auth.uid())
  )
);

/******************************************************************************
 * Transactional ingestion lifecycle functions
 ******************************************************************************/

create function public.begin_knowledge_ingestion(
  target_organization_id text,
  target_source_name text,
  target_source_hash text,
  target_expected_chunk_count integer
)
returns table (
  document_id uuid,
  status text,
  expected_chunk_count integer,
  persisted_chunk_count integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  document public.knowledge_documents;
begin
  if target_expected_chunk_count <= 0 then
    raise exception
      'Expected chunk count must be greater than zero';
  end if;

  if nullif(btrim(target_source_name), '') is null
    or nullif(btrim(target_source_hash), '') is null
  then
    raise exception
      'Source name and identity are required';
  end if;

  if (select auth.uid()) is null
    or not exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id =
          target_organization_id
        and membership.user_id = (select auth.uid())
    )
  then
    raise exception
      'Knowledge organization is unavailable';
  end if;

  select *
  into document
  from public.knowledge_documents stored_document
  where stored_document.organization_id =
      target_organization_id
    and stored_document.source_hash =
      target_source_hash;

  if document.id is not null
    and document.status = 'complete'
  then
    return query
    select
      document.id,
      document.status,
      document.expected_chunk_count,
      document.persisted_chunk_count;

    return;
  end if;

  insert into public.knowledge_documents (
    organization_id,
    source_name,
    source_hash,
    status,
    expected_chunk_count,
    persisted_chunk_count,
    error_code,
    completed_at
  )
  values (
    target_organization_id,
    target_source_name,
    target_source_hash,
    'processing',
    target_expected_chunk_count,
    0,
    null,
    null
  )
  on conflict (organization_id, source_hash)
  do update
  set
    source_name = case
      when knowledge_documents.status = 'complete'
        then knowledge_documents.source_name
      else excluded.source_name
    end,
    status = case
      when knowledge_documents.status = 'complete'
        then 'complete'
      else 'processing'
    end,
    expected_chunk_count = case
      when knowledge_documents.status = 'complete'
        then knowledge_documents.expected_chunk_count
      else excluded.expected_chunk_count
    end,
    error_code = case
      when knowledge_documents.status = 'complete'
        then knowledge_documents.error_code
      else null
    end,
    processing_user_id = case
      when knowledge_documents.status = 'complete'
        then knowledge_documents.processing_user_id
      else (select auth.uid())
    end,
    updated_at = case
      when knowledge_documents.status = 'complete'
        then knowledge_documents.updated_at
      else now()
    end
  returning *
  into document;

  return query
  select
    document.id,
    document.status,
    document.expected_chunk_count,
    document.persisted_chunk_count;
end;
$function$;

create function public.fail_knowledge_ingestion(
  target_document_id uuid,
  target_error_code text
)
returns table (
  document_id uuid,
  status text,
  expected_chunk_count integer,
  persisted_chunk_count integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  document public.knowledge_documents;
  actual_chunk_count integer;
begin
  select *
  into document
  from public.knowledge_documents stored_document
  where stored_document.id = target_document_id
    and stored_document.status = 'processing'
    and stored_document.processing_user_id = (select auth.uid())
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id =
          stored_document.organization_id
        and membership.user_id = (select auth.uid())
    )
  for update;

  if document.id is null then
    raise exception
      'Knowledge document is unavailable';
  end if;

  select count(*)::integer
  into actual_chunk_count
  from public.knowledge_chunks chunk
  where chunk.document_id = target_document_id;

  update public.knowledge_documents stored_document
  set
    status = 'failed',
    persisted_chunk_count = actual_chunk_count,
    error_code = coalesce(
      nullif(
        left(target_error_code, 64),
        ''
      ),
      'INGESTION_FAILED'
    ),
    completed_at = null,
    updated_at = now()
  where stored_document.id = target_document_id
    and stored_document.status = 'processing'
    and stored_document.processing_user_id = (select auth.uid())
  returning *
  into document;

  if document.id is null then
    raise exception
      'Knowledge document is unavailable or already complete';
  end if;

  return query
  select
    document.id,
    document.status,
    document.expected_chunk_count,
    document.persisted_chunk_count;
end;
$function$;

create function public.complete_knowledge_ingestion(
  target_document_id uuid
)
returns table (
  document_id uuid,
  status text,
  expected_chunk_count integer,
  persisted_chunk_count integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  document public.knowledge_documents;
  actual_chunk_count integer;
  first_chunk_index integer;
  last_chunk_index integer;
begin
  select *
  into document
  from public.knowledge_documents stored_document
  where stored_document.id = target_document_id
    and stored_document.status = 'processing'
    and stored_document.processing_user_id = (select auth.uid())
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id =
          stored_document.organization_id
        and membership.user_id = (select auth.uid())
    )
  for update;

  if document.id is null then
    raise exception
      'Knowledge document is unavailable';
  end if;

  select
    count(*)::integer,
    min(chunk_index),
    max(chunk_index)
  into
    actual_chunk_count,
    first_chunk_index,
    last_chunk_index
  from public.knowledge_chunks chunk
  where chunk.document_id = target_document_id;

  if actual_chunk_count <> document.expected_chunk_count
    or first_chunk_index <> 0
    or last_chunk_index <> document.expected_chunk_count - 1
  then
    raise exception
      'Knowledge document chunk set is incomplete';
  end if;

  update public.knowledge_documents stored_document
  set
    status = 'complete',
    persisted_chunk_count = actual_chunk_count,
    error_code = null,
    completed_at = coalesce(completed_at, now()),
    processing_user_id = null,
    updated_at = now()
  where stored_document.id = target_document_id
    and stored_document.status = 'processing'
    and stored_document.processing_user_id = (select auth.uid())
  returning *
  into document;

  return query
  select
    document.id,
    document.status,
    document.expected_chunk_count,
    document.persisted_chunk_count;
end;
$function$;

revoke all
on function public.begin_knowledge_ingestion(
  text,
  text,
  text,
  integer
)
from public, anon, service_role;

revoke all
on function public.fail_knowledge_ingestion(
  uuid,
  text
)
from public, anon, service_role;

revoke all
on function public.complete_knowledge_ingestion(uuid)
from public, anon, service_role;

grant execute
on function public.begin_knowledge_ingestion(
  text,
  text,
  text,
  integer
)
to authenticated;

grant execute
on function public.fail_knowledge_ingestion(
  uuid,
  text
)
to authenticated;

grant execute
on function public.complete_knowledge_ingestion(uuid)
to authenticated;

/******************************************************************************
 * Retrieval eligibility
 ******************************************************************************/

create or replace function public.match_chunks(
  query_embedding vector,
  match_threshold double precision,
  match_count integer,
  target_organization_id text
)
returns table (
  id bigint,
  title text,
  chunk_text text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $function$
  select
    chunk.id,
    chunk.title,
    chunk.chunk_text,
    1 - (
      chunk.embedding <=>
      query_embedding
    ) as similarity
  from public.knowledge_chunks chunk
  join public.knowledge_documents document
    on document.id = chunk.document_id
  where chunk.organization_id =
      target_organization_id
    and document.organization_id =
      target_organization_id
    and document.status = 'complete'
    and chunk.embedding is not null
    and 1 - (
      chunk.embedding <=>
      query_embedding
    ) > match_threshold
  order by
    chunk.embedding <=>
    query_embedding
  limit match_count;
$function$;

commit;
