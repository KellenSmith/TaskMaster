#!/usr/bin/env bash

# Fail fast on errors, unset vars, and pipeline failures.
set -euo pipefail

# Resolve repository root so the script works from any current directory.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

# Load local environment variables (including POSTGRES_URL) when available.
if [[ -f "${repo_root}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${repo_root}/.env"
  set +a
fi

: "${POSTGRES_URL:?POSTGRES_URL is not set}"

# Prefer newer client binaries to handle newer dump archive formats.
pg_bin_dir="${PG_BIN_DIR:-}"
if [[ -z "${pg_bin_dir}" && -d "/usr/lib/postgresql/18/bin" ]]; then
  pg_bin_dir="/usr/lib/postgresql/18/bin"
fi
if [[ -z "${pg_bin_dir}" && -d "/usr/lib/postgresql/17/bin" ]]; then
  pg_bin_dir="/usr/lib/postgresql/17/bin"
fi

# Default to PATH-resolved tools, but pin to a specific PostgreSQL bin dir when provided.
pg_dump_cmd="pg_dump"
pg_restore_cmd="pg_restore"
if [[ -n "${pg_bin_dir}" ]]; then
  pg_dump_cmd="${pg_bin_dir}/pg_dump"
  pg_restore_cmd="${pg_bin_dir}/pg_restore"
fi

# Validate required PostgreSQL tools before doing anything destructive.
if ! command -v "${pg_dump_cmd}" >/dev/null 2>&1; then
  echo "Required command not found: ${pg_dump_cmd}" >&2
  exit 1
fi

if ! command -v "${pg_restore_cmd}" >/dev/null 2>&1; then
  echo "Required command not found: ${pg_restore_cmd}" >&2
  exit 1
fi

dump_file="${1:-}"
if [[ -z "${dump_file}" ]]; then
  echo "Usage: bash scripts/restore.db.sh /absolute/or/relative/path/to/backup.dump" >&2
  exit 1
fi

if [[ ! -f "${dump_file}" ]]; then
  echo "Dump file not found: ${dump_file}" >&2
  exit 1
fi

# Create a rollback snapshot of the current DB before restoring.
pre_restore_backup="${repo_root}/pre-restore-$(date -u +%Y%m%dT%H%M%SZ).dump"

echo "==> Creating safety backup before restore: ${pre_restore_backup}"
"${pg_dump_cmd}" "${POSTGRES_URL}" --format=custom --file="${pre_restore_backup}" --no-owner --no-privileges

# Restore with clean/if-exists so objects are replaced in place.
echo "==> Restoring from ${dump_file} into POSTGRES_URL target"
"${pg_restore_cmd}" \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="${POSTGRES_URL}" \
  "${dump_file}"

echo "==> Restore completed successfully"
