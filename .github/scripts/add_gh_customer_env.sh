#!/usr/bin/env bash
# Script: add-gh-customer-env.sh
# Prerequisites:
# - GitHub CLI (gh)
# - jq
# - GitHub repository with appropriate permissions
# - Authenticated to gh CLI through "gh auth login" or env var token configured
# Usage: bash scripts/add-gh-customer-env.sh [environment_name] [vars_file]
# Creates a GitHub environment and uploads a secret, then triggers a pipeline on dev branch.

set -euo pipefail

ENV_NAME="${1:-demo}"
VARS_FILE="${2:-scripts/secrets/customer-vars.json}"
REPO="$(git config --get remote.origin.url | sed -E 's#.*github.com[:/](.+)\.git#\1#')"

if [ ! -f "$VARS_FILE" ]; then
    echo "Error: $VARS_FILE not found!" >&2
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh >/dev/null 2>&1; then
    echo "Error: GitHub CLI (gh) is required. Install it and rerun." >&2
    exit 1
fi

# Create environment if it doesn't exist
env_exists=$(gh api repos/$REPO/environments | jq -e --arg name "$ENV_NAME" '.environments[] | select(.name == $name)') || env_exists=""
if [ -z "$env_exists" ]; then
    echo "Creating environment: $ENV_NAME"
    gh api -X PUT "repos/$REPO/environments/$ENV_NAME"
else
    echo "Environment $ENV_NAME already exists."
fi

# Upload secret to environment
echo "Uploading secret CUSTOMER_VARS to environment $ENV_NAME"
SECRET_VALUE=$(cat "$VARS_FILE")
# Convert to base64 to ensure it can be safely transmitted as a string, then decode in GitHub Actions workflow
SECRET_VALUE_B64=$(printf '%s' "$SECRET_VALUE" | base64 -w 0)
# Use gh CLI to set secret (requires GitHub CLI v2.0+)
# Note: gh secret set supports --env for environments
printf '%s' "$SECRET_VALUE_B64" | gh secret set CUSTOMER_VARS_B64 --env "$ENV_NAME" --repo "$REPO"

echo "Triggering pipeline on dev branch"
gh workflow run --repo "$REPO" --ref dev

echo "Triggering pipeline on master branch"
gh workflow run --repo "$REPO" --ref master


echo "Done."
