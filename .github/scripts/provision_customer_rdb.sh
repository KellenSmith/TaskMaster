set -euo pipefail

# Source the util functions from their own file
source "$(dirname "$0")/utils.sh"

CUSTOMER_VARS_JSON="$1"
VERCEL_TARGET="$2"

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" '.VERCEL_ACCESS_TOKEN')
ORG_NAME=$(extract_json_value "$CUSTOMER_VARS_JSON" '.NEXT_PUBLIC_ORG_NAME')
PROJECT_NAME="$(get_project_name "$ORG_NAME")"
DB_REGION=$(extract_json_value "$CUSTOMER_VARS_JSON" '.DB_REGION')
DB_NAME="${PROJECT_NAME}-db-${VERCEL_TARGET}"

resources_json=$(vercel integration list --format=json --non-interactive --token "$VERCEL_ACCESS_TOKEN")
if printf '%s' "$resources_json" | jq -e --arg name "$DB_NAME" '(.resources // []) | any(.name == $name or .resource.name == $name)' >/dev/null; then
    echo "Prisma Postgres ${DB_NAME} already provisioned. Continuing setup."
    return 0
fi

integration_output=$(vercel integration add prisma/prisma-postgres \
    --non-interactive \
    --token "$VERCEL_ACCESS_TOKEN" \
    --metadata "region=$DB_REGION" \
    --name "$DB_NAME" \
    --environment "$VERCEL_TARGET" 2>&1)

printf '%s\n' "$integration_output"
echo "Prisma Postgres integration added successfully for ${DB_NAME}."
