# usr/bin/env bash
set -eo pipefail

# Check for required CLI tools
for tool in vercel openssl gh; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "Error: $tool is required but not installed. Please install it and rerun." >&2
        exit 1
    fi
done

# Source the util functions from their own file
source "$(dirname "$0")/utils.sh"

CUSTOMER_VARS_B64="$1"
CUSTOMER_VARS_JSON=$(echo "$CUSTOMER_VARS_B64" | base64 -d)

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" '.VERCEL_ACCESS_TOKEN')

ORG_NAME=$(extract_json_value "$CUSTOMER_VARS_JSON" '.NEXT_PUBLIC_ORG_NAME')
PROJECT_NAME="$(get_project_name "$ORG_NAME")"

# Create a new project for the customer on the format "<org name>-taskmaster"
# if it does not already exist
vercel projects add "$PROJECT_NAME" --token $VERCEL_ACCESS_TOKEN
echo "Project created successfully."

# Link the project and git repo
vercel link --yes --project $PROJECT_NAME --token $VERCEL_ACCESS_TOKEN
echo "Project linked to GitHub repository successfully."

# Connect the project to the TaskMaster GitHub repository
git_connect_output=""
if ! git_connect_output=$(vercel git connect --yes --token "$VERCEL_ACCESS_TOKEN" 2>&1); then
    if printf '%s' "$git_connect_output" | grep -qi "already connected"; then
        echo "GitHub repository is already connected. Continuing setup."
    else
        printf '%s\n' "$git_connect_output" >&2
        echo "Error: failed to connect GitHub repository." >&2
        exit 1
    fi
else
    printf '%s\n' "$git_connect_output"
    echo "GitHub repository connected successfully."
fi
