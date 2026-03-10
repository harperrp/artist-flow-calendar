#!/usr/bin/env bash
set -euo pipefail

EXPECTED_PROJECT_REF="uhumbtpkioisepqiqotl"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI não encontrado. Instale em https://supabase.com/docs/guides/cli"
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-$EXPECTED_PROJECT_REF}"

if [ "$PROJECT_REF" != "$EXPECTED_PROJECT_REF" ]; then
  echo "SUPABASE_PROJECT_REF inválido: '$PROJECT_REF'. Use apenas '$EXPECTED_PROJECT_REF'."
  exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "Defina SUPABASE_ACCESS_TOKEN para autenticar no projeto Supabase."
  exit 1
fi

supabase gen types typescript --project-id "$PROJECT_REF" --schema public > src/integrations/supabase/types.ts

echo "Types do Supabase regenerados em src/integrations/supabase/types.ts ($PROJECT_REF)"
