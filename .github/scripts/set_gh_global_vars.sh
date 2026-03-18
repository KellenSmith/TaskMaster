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


echo "Uploading secret PRODUCTION_VARS (compacted JSON)"
PRODUCTION_VARS_VALUE=$(jq -c . "$PRODUCTION_VARS_FILE")
if [ $? -ne 0 ]; then
    echo "Error: Failed to compact JSON in $PRODUCTION_VARS_FILE. Please check the file for syntax errors." >&2
    exit 1
fi
printf '%s' "$PRODUCTION_VARS_VALUE" | gh secret set PRODUCTION_VARS --repo "$REPO"


echo "Uploading secret PREVIEW_VARS (compacted JSON)"
PREVIEW_VARS_VALUE=$(jq -c . "$PREVIEW_VARS_FILE")
if [ $? -ne 0 ]; then
    echo "Error: Failed to compact JSON in $PREVIEW_VARS_FILE. Please check the file for syntax errors." >&2
    exit 1
fi
printf '%s' "$PREVIEW_VARS_VALUE" | gh secret set PREVIEW_VARS --repo "$REPO"

echo "Upload encryption keys for secrets to use in workflows"
ENCRYPTION_KEY=$(cat ".github/secrets/encryption_key.txt")
printf '%s' "$ENCRYPTION_KEY" | gh secret set ENCRYPTION_KEY --repo "$REPO"

echo "Done."
