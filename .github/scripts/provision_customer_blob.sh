set -euo pipefail

# Source the util functions from their own file
source "$(dirname "$0")/utils.sh"

CUSTOMER_VARS_JSON=$(cat customer_vars.json)
VERCEL_TARGET="${1}"

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" 'VERCEL_ACCESS_TOKEN')

ORG_NAME=$(extract_json_value "$CUSTOMER_VARS_JSON" 'NEXT_PUBLIC_ORG_NAME')
PROJECT_NAME="$(get_project_name "$ORG_NAME")"
BLOB_REGION=$(extract_json_value "$CUSTOMER_VARS_JSON" 'BLOB_REGION')

# Clean up generated .vercel dir and .env.local file to avoid conflict
if [ -d ".vercel" ]; then
    rm -rf .vercel
    echo "Removed existing .vercel directory."
fi
if [ -f ".env.local" ]; then
    rm -f .env.local
    echo "Removed existing .env.local file."
fi

env_var_exists() {
    local var_name="$1"
    local env_vars_json
    env_vars_json=$(vercel env ls --format=json --non-interactive --token "$VERCEL_ACCESS_TOKEN")
    printf '%s' "$env_vars_json" | jq -e --arg name "$var_name" '(.envs // []) | any(.key == $name)' >/dev/null
}

valid_blob_access_levels="public private"

provision_vercel_blob_store() {
    local blob_store_name="$1"
    local access="$2"
    local token_prefix="${3:-BLOB}"
    local token_name="${token_prefix}_READ_WRITE_TOKEN"

    # Check if the access level is valid
    if ! printf '%s' "$valid_blob_access_levels" | grep -qw "$access"; then
        echo "Error: Invalid blob access level '$access'. Valid options are: $valid_blob_access_levels." >&2
        exit 1
    fi

    if env_var_exists "$token_name" >/dev/null; then
        echo "$token_name environment variable already exists. Skipping blob store provisioning."
        return 0
    fi

    echo "Provisioning Vercel Blob Store ${blob_store_name} with access level ${access} for environment ${VERCEL_TARGET}."

    if [ "$token_prefix" != "BLOB" ]; then
        echo "---"
        echo "Please respond with 'n' when prompted to connect the blob store to the project during provisioning."
        echo "Instead go to the Vercel dashboard, navigate to the project, and connect the blob store to the project manually using the prefix '$token_prefix' \
            for the token name. This is required to ensure the token is created with the correct permissions and added to the correct environment."
    fi

    vercel blob create-store "$blob_store_name" --token "$VERCEL_ACCESS_TOKEN" --region "$BLOB_REGION"  --access "$access" --non-interactive

    echo "The ${access} blob store \"${blob_store_name}\" has been created. \
        Log in to the ${ORG_NAME} Vercel account and link the blob store to the project ${PROJECT_NAME} \
        for the ${VERCEL_TARGET} environment: https://vercel.com/"

    # If a token prefix was given, wait for the user to respond "yes" to the
    # prompt to connect the blob store to the project.
    if [ "$token_prefix" != "BLOB" ]; then
        echo "Use the prefix ${token_prefix} for the blob read write token."
    fi


    exit 1
}

if [ "$VERCEL_TARGET" = "production" ]; then
    provision_vercel_blob_store "${PROJECT_NAME}-blob-backup" "private" "BLOB_BACKUP" &
    pid1=$!
fi
provision_vercel_blob_store "${PROJECT_NAME}-blob-${VERCEL_TARGET}" "public" &
pid2=$!

fail=0
if [ "${pid1:-}" ]; then
    wait $pid1 || fail=1
fi
wait $pid2 || fail=1

if [ "$fail" -ne 0 ]; then
    echo "One or more blob store provisioning steps failed." >&2
    exit 1
fi
