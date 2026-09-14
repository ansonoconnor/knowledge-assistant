/******************************************************************************
 * Migration:
 * Scope Knowledge Assistant vector retrieval by organization
 *
 * Required property:
 * Vector retrieval must select candidates only from the active organization.
 * The function executes with invoker authority so knowledge_chunks RLS remains
 * an independent membership-enforcement boundary.
 *
 * Deployment note:
 * Apply with migration 001 while the application is stopped, then deploy the
 * companion application change before reopening ordinary requests.
 ******************************************************************************/

begin;

/******************************************************************************
 * Remove unrestricted retrieval interfaces
 ******************************************************************************/

drop function if exists
  public.match_chunks(
    vector,
    double precision,
    integer
  );

drop function if exists
  public.match_chunks(
    vector,
    integer
  );

/******************************************************************************
 * Organization-scoped retrieval
 ******************************************************************************/

create function public.match_chunks(
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
  where chunk.organization_id =
      target_organization_id
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

revoke all
on function public.match_chunks(
  vector,
  double precision,
  integer,
  text
)
from
  public,
  anon,
  service_role;

grant execute
on function public.match_chunks(
  vector,
  double precision,
  integer,
  text
)
to authenticated;

commit;
