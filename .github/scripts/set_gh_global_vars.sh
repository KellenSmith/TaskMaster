# Update the scripts/secrets/production-vars.json and scripts/secrets/preview-vars.json
# before running this script
set -euo pipefail

# Check if gh CLI is installed
if ! command -v gh >/dev/null 2>&1; then
    echo "Error: GitHub CLI (gh) is required. Install it and rerun." >&2
    exit 1
fi

PRODUCTION_VARS_FILE=".github/secrets/production_vars.json"
PREVIEW_VARS_FILE=".github/secrets/preview_vars.json"
REPO="$(git config --get remote.origin.url | sed -E 's#.*github.com[:/](.+)\.git#\1#')"

echo "Uploading secret PRODUCTION_VARS"
PRODUCTION_VARS_VALUE=$(cat "$PRODUCTION_VARS_FILE")
# Convert to base64, remove all newlines, and trim whitespace to ensure a single-line string
PRODUCTION_VARS_VALUE_B64=$(printf '%s' "$PRODUCTION_VARS_VALUE" | base64 -w 0 | tr -d '\n' | xargs)
printf '%s' "$PRODUCTION_VARS_VALUE_B64" | gh secret set PRODUCTION_VARS_B64 --repo "$REPO"

echo "Uploading secret PREVIEW_VARS"
PREVIEW_VARS_VALUE=$(cat "$PREVIEW_VARS_FILE")
printf '%s' "$PREVIEW_VARS_VALUE" | gh secret set PREVIEW_VARS --repo "$REPO"

echo "Done."
