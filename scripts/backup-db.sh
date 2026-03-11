#!/usr/bin/env bash

set -euo pipefail

required_env_vars=(
	"POSTGRES_URL"
	"BLOB_BACKUP_READ_WRITE_TOKEN"
)

for var_name in "${required_env_vars[@]}"; do
	if [[ -z "${!var_name:-}" ]]; then
		echo "Missing required environment variable: ${var_name}"
		exit 1
	fi
done

required_commands=(
	"pg_dump"
	"pg_restore"
	"sha256sum"
	"node"
)

for cmd in "${required_commands[@]}"; do
	if ! command -v "${cmd}" >/dev/null 2>&1; then
		echo "Required command not found: ${cmd}"
		exit 1
	fi
done

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
backup_prefix="${BACKUP_PREFIX:-db-backups}"
backup_name="postgres-${timestamp}.dump"
checksum_name="${backup_name}.sha256"

workdir="$(mktemp -d)"
dump_path="${workdir}/${backup_name}"
checksum_path="${workdir}/${checksum_name}"

cleanup() {
	rm -rf "${workdir}"
}
trap cleanup EXIT

echo "==> Creating PostgreSQL backup"
pg_dump \
	"${POSTGRES_URL}" \
	--format=custom \
	--file="${dump_path}" \
	--no-owner \
	--no-privileges

echo "==> Validating backup readability"
pg_restore --list "${dump_path}" >/dev/null

echo "==> Writing checksum"
sha256sum "${dump_path}" > "${checksum_path}"

echo "==> Uploading backup artifacts to private Blob storage"
dump_blob_path="${backup_prefix}/${backup_name}"
checksum_blob_path="${backup_prefix}/${checksum_name}"

upload_output="$(
	BLOB_BACKUP_READ_WRITE_TOKEN="${BLOB_BACKUP_READ_WRITE_TOKEN}" \
	DUMP_FILE_PATH="${dump_path}" \
	CHECKSUM_FILE_PATH="${checksum_path}" \
	DUMP_BLOB_PATH="${dump_blob_path}" \
	CHECKSUM_BLOB_PATH="${checksum_blob_path}" \
	node scripts/upload-backup-to-blob.mjs
)"

echo "${upload_output}"

echo "==> Backup completed successfully"
echo "Backup object: ${dump_blob_path}"
echo "Checksum object: ${checksum_blob_path}"
