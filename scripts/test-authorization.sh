#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

cd "$REPOSITORY_ROOT"

if command -v docker >/dev/null 2>&1; then
  DOCKER_COMMAND="docker"
elif [
  -x "/Applications/Docker.app/Contents/Resources/bin/docker"
]; then
  DOCKER_COMMAND="/Applications/Docker.app/Contents/Resources/bin/docker"
else
  echo "Docker CLI is required"
  exit 1
fi

if ! "$DOCKER_COMMAND" info >/dev/null 2>&1; then
  echo "Docker engine is not running"
  exit 1
fi

echo "Starting local Supabase services"
supabase start >/dev/null

echo "Resetting the disposable local database"
supabase db reset --local

PROJECT_ID="$(
  sed -n \
    's/^project_id = "\(.*\)"/\1/p' \
    supabase/config.toml
)"

if [ -z "$PROJECT_ID" ]; then
  echo "Unable to determine Supabase project ID"
  exit 1
fi

DATABASE_CONTAINER="supabase_db_${PROJECT_ID}"

apply_sql_file() {
  local sql_file="$1"

  "$DOCKER_COMMAND" exec -i \
    "$DATABASE_CONTAINER" \
    psql \
      -q \
      -U postgres \
      -d postgres \
      -v ON_ERROR_STOP=1 \
    < "$sql_file"
}

echo "Applying authorization test baseline"
apply_sql_file \
  tests/integration/fixtures/authorization_baseline.sql

echo "Applying production authorization migrations"
apply_sql_file \
  database/migrations/001_introduce_organization_scoped_knowledge.sql

apply_sql_file \
  database/migrations/002_scope_knowledge_retrieval.sql

set -a
eval "$(supabase status -o env 2>/dev/null)"
set +a

echo "Running authorization integration tests"
node \
  --test \
  --test-concurrency=1 \
  server/tests/integration/*.test.js
