#!/usr/bin/env bash

# Exit on first error (-e), undefined vars (-u), and failed piped commands (pipefail).
set -euo pipefail

# Refresh package metadata so dnf has an up-to-date view of available packages.
echo "==> Refreshing dnf metadata"
dnf -y makecache --refresh

# Log current Amazon Linux release so build output shows the starting point.
echo "==> Current Amazon Linux release"
rpm -q amazon-linux-release || true

# PostgreSQL 17 is supported on newer Amazon Linux 2023 releases.
# Upgrade to the latest available AL2023 release stream before package install.
echo "==> Upgrading Amazon Linux 2023 release stream"
if ! dnf -y upgrade --releasever=latest; then
	echo "Release-stream upgrade with --releasever=latest failed; falling back to normal upgrade."
	dnf -y upgrade
fi

# Show final release after upgrade for troubleshooting and auditability.
echo "==> Amazon Linux release after upgrade"
rpm -q amazon-linux-release || true

# Bring base packages up to date before installing new tools.
echo "==> Updating installed packages"
dnf -y update

# Install PostgreSQL 17 client tools (includes pg_dump / pg_restore).
echo "==> Installing PostgreSQL 17 client tools"
dnf -y install postgresql17

# Confirm pg_dump is on PATH before continuing.
echo "==> Verifying pg_dump availability"
if ! command -v pg_dump >/dev/null 2>&1; then
	echo "pg_dump is not available after installation."
	exit 1
fi

# Print detected pg_dump version for build logs.
pg_dump_version="$(pg_dump --version)"
echo "pg_dump available: ${pg_dump_version}"

# Parse major version and enforce PostgreSQL 17+ client requirement.
pg_dump_major="$(echo "${pg_dump_version}" | grep -Eo '[0-9]+' | head -n 1)"
if [[ -z "${pg_dump_major}" || "${pg_dump_major}" -lt 17 ]]; then
	echo "pg_dump major version must be >= 17, found: ${pg_dump_major:-unknown}"
	exit 1
fi
