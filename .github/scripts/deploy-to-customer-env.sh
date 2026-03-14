# Configure the vars for the new customer in customer-vars.json before running this script.

set -euo pipefail

# Check for required CLI tools
for tool in vercel openssl gh; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "Error: $tool is required but not installed. Please install it and rerun." >&2
        exit 1
    fi
done

CUSTOMER_VARS_JSON="${1}"
GLOBAL_VARS_JSON="${2}"
VERCEL_TARGET="${3}"

valid_environments="production preview"
if ! printf '%s' "$valid_environments" | grep -qw "$VERCEL_TARGET"; then
    echo "Error: Invalid environment '$VERCEL_TARGET'. Valid options are: $valid_environments." >&2
    exit 1
fi


# Function to extract a value from JSON and exit if missing or null when empty is not allowed
extract_json_value() {
    local json="$1"
    local key="$2"
    local allow_empty="${3:-false}"
    local value
    if value=$(echo "$json" | jq -er "$key"); then
        if { [ -z "$value" ] || [ "$value" = "null" ]; } && [ "$allow_empty" != "true" ]; then
            echo "Error: Required key $key is empty or null in JSON." >&2
            exit 1
        fi
    else
        if [ "$allow_empty" != "true" ]; then
            echo "Error: Required key $key not found or null in JSON." >&2
            exit 1
        else
            value=""
        fi
    fi
    printf '%s' "$value"
}

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" '.VERCEL_ACCESS_TOKEN')

ORG_NAME=$(extract_json_value "$CUSTOMER_VARS_JSON" '.NEXT_PUBLIC_ORG_NAME')
# Sanitize project name to satisfy Vercel constraints.
PROJECT_NAME="${ORG_NAME// /-}-taskmaster"
PROJECT_NAME="$(
    printf '%s' "$PROJECT_NAME" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -E 's/[^a-z0-9._-]+/-/g; s/-{3,}/-/g; s/^-+//; s/-+$//'
)"
PROJECT_NAME="${PROJECT_NAME:0:100}"
PROJECT_NAME="$(printf '%s' "$PROJECT_NAME" | sed -E 's/^-+//; s/-+$//')"

if [ -z "$PROJECT_NAME" ]; then
    echo "Error: project name is empty after sanitization." >&2
    exit 1
fi

DB_REGION=$(extract_json_value "$CUSTOMER_VARS_JSON" '.DB_REGION')
BLOB_REGION=$(extract_json_value "$CUSTOMER_VARS_JSON" '.BLOB_REGION')

EMAIL=$(extract_json_value "$CUSTOMER_VARS_JSON" '.EMAIL')
EMAIL_PASSWORD=$(extract_json_value "$CUSTOMER_VARS_JSON" '.EMAIL_PASSWORD')
SMTP_HOST=$(extract_json_value "$CUSTOMER_VARS_JSON" '.SMTP_HOST')
SMTP_PORT=$(extract_json_value "$CUSTOMER_VARS_JSON" '.SMTP_PORT')

GOOGLE_SITE_VERIFICATION=$(extract_json_value "$CUSTOMER_VARS_JSON" '.GOOGLE_SITE_VERIFICATION') --allow-empty
NEXT_PUBLIC_ORG_DESCRIPTION=$(extract_json_value "$CUSTOMER_VARS_JSON" '.NEXT_PUBLIC_ORG_DESCRIPTION') --allow-empty
NEXT_PUBLIC_SEO_KEYWORDS=$(extract_json_value "$CUSTOMER_VARS_JSON" '.NEXT_PUBLIC_SEO_KEYWORDS') --allow-empty


SWEDBANK_BASE_URL=$(extract_json_value "$GLOBAL_VARS_JSON" '.SWEDBANK_BASE_URL')
# If VERCEL_TARGET=production, take SWEDBANK_PAY_ACCESS_TOKEN and SWEDBANK_PAY_PAYEE_ID
# from customer vars, else from global vars
if [ "$VERCEL_TARGET" = "production" ]; then
    SWEDBANK_PAY_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" '.SWEDBANK_PAY_ACCESS_TOKEN')  --allow-empty
    SWEDBANK_PAY_PAYEE_ID=$(extract_json_value "$CUSTOMER_VARS_JSON" '.SWEDBANK_PAY_PAYEE_ID')  --allow-empty
else
    SWEDBANK_PAY_ACCESS_TOKEN=$(extract_json_value "$GLOBAL_VARS_JSON" '.SWEDBANK_PAY_ACCESS_TOKEN')
    SWEDBANK_PAY_PAYEE_ID=$(extract_json_value "$GLOBAL_VARS_JSON" '.SWEDBANK_PAY_PAYEE_ID')
fi

# Create a new project for the customer on the format "<org name>-taskmaster"
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

# Provision storage resources for the project
provision_prisma_postgres() {
    local db_name="$1"
    shift

    local resources_json
    resources_json=$(vercel integration list --format=json --non-interactive --token "$VERCEL_ACCESS_TOKEN")
    if printf '%s' "$resources_json" | jq -e --arg name "$db_name" '(.resources // []) | any(.name == $name or .resource.name == $name)' >/dev/null; then
        echo "Prisma Postgres ${db_name} already provisioned. Continuing setup."
        return 0
    fi

    local integration_output
    integration_output=$(vercel integration add prisma/prisma-postgres \
        --non-interactive \
        --token "$VERCEL_ACCESS_TOKEN" \
        --metadata "region=$DB_REGION" \
        --name "$db_name" \
        "$@" 2>&1)

    printf '%s\n' "$integration_output"
    echo "Prisma Postgres integration added successfully for ${db_name}."
}

env_var_exists() {
    local var_name="$1"
    local env_vars_json
    env_vars_json=$(vercel env ls --format=json --non-interactive --token "$VERCEL_ACCESS_TOKEN")
    printf '%s' "$env_vars_json" | jq -e --arg name "$var_name" '(.envs // []) | any(.key == $name)' >/dev/null
}

get_env_var_value_from_env_file() {
    local var_name="$1"

    # Remove existing .env.local file if it exists to avoid conflicts
    if [ -f ".env.local" ]; then
        rm -f ".env.local"
        echo "Removed existing .env.local file to avoid conflicts."
    fi
    vercel env pull .env.local --yes --environment "$VERCEL_TARGET" --token "$VERCEL_ACCESS_TOKEN" >/dev/null

    local env_var
    # Read the value of the variable from the .env.local file
    if [ -f ".env.local" ]; then
        env_var=$(grep -E "^${var_name}=" .env.local | cut -d '=' -f2-)
    fi

    # Normalize CRLF and remove surrounding quotes from env pull output.
    env_var="${env_var%$'\r'}"
    env_var="${env_var#\"}"
    env_var="${env_var%\"}"

    if [ -n "$env_var" ] && [ "$env_var" != "null" ]; then
        echo "$env_var"
        return 0
    fi

    return 1
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

    if env_var_exists "$token_name" && get_env_var_value_from_env_file "$token_name" >/dev/null; then
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

    # If a token prefix was given, wait for the user to respond "yes" to the
    # prompt to connect the blob store to the project.
    if [ "$token_prefix" != "BLOB" ]; then
        while true; do
            sleep 5
            echo "Checking if ${token_name} environment variable has been created with a value for the ${VERCEL_TARGET} environment..."
            if env_var_exists "$token_name" && get_env_var_value_from_env_file "$token_name" >/dev/null; then
                break
            fi
        done
    fi


    echo "Vercel Blob Store ${blob_store_name} provisioned successfully with access level ${access} for environment ${VERCEL_TARGET}."
}

provision_prisma_postgres "${PROJECT_NAME}-db-${VERCEL_TARGET}" \--environment "$VERCEL_TARGET"
if [ "$VERCEL_TARGET" = "production" ]; then
    provision_vercel_blob_store "${PROJECT_NAME}-blob-backup" "private" "BLOB_BACKUP"
fi
provision_vercel_blob_store "${PROJECT_NAME}-blob-${VERCEL_TARGET}" "public"


generate_secret() {
    # Generate a random 256-bit (32-byte) secret and encode it in base64
    openssl rand -base64 32
}

add_customer_var_to_environments() {
    local key="$1"
    local value="$2"
    shift 2

    # If env=preview, add "" after "$env" due to a quirk in the vercel CLI where it requires a target branch name (it should be optional but it's not).
    if [ "$VERCEL_TARGET" = "preview" ]; then
        vercel env add "$key" "$VERCEL_TARGET" "" --value "$value" "$@" --non-interactive --yes --force --token "$VERCEL_ACCESS_TOKEN" || true
    else
        vercel env add "$key" "$VERCEL_TARGET" --value "$value" "$@" --non-interactive --yes --force --token "$VERCEL_ACCESS_TOKEN" || true
    fi
}

# Generate secrets for the project and set them as environment variables
add_customer_var_to_environments "AUTH_SECRET" "$(generate_secret)" --sensitive
add_customer_var_to_environments "CRON_SECRET" "$(generate_secret)" --sensitive
# Set env vars for the given vercel target env
add_customer_var_to_environments "EMAIL" "$EMAIL"
add_customer_var_to_environments "EMAIL_PASSWORD" "$EMAIL_PASSWORD" --sensitive
add_customer_var_to_environments "SMTP_HOST" "$SMTP_HOST"
add_customer_var_to_environments "SMTP_PORT" "$SMTP_PORT"

add_customer_var_to_environments "GOOGLE_SITE_VERIFICATION" "$GOOGLE_SITE_VERIFICATION"
add_customer_var_to_environments "NEXT_PUBLIC_ORG_DESCRIPTION" "$NEXT_PUBLIC_ORG_DESCRIPTION"
add_customer_var_to_environments "NEXT_PUBLIC_ORG_NAME" "$NEXT_PUBLIC_ORG_NAME"
add_customer_var_to_environments "NEXT_PUBLIC_SEO_KEYWORDS" "$NEXT_PUBLIC_SEO_KEYWORDS"

add_customer_var_to_environments "SWEDBANK_BASE_URL" "$SWEDBANK_BASE_URL"
add_customer_var_to_environments "SWEDBANK_PAY_PAYEE_ID" "$SWEDBANK_PAY_PAYEE_ID"
add_customer_var_to_environments "SWEDBANK_PAY_ACCESS_TOKEN" "$SWEDBANK_PAY_ACCESS_TOKEN" --sensitive

if [ "$VERCEL_TARGET" = "production" ]; then
    vercel deploy --prod --token "$VERCEL_ACCESS_TOKEN"
else
    vercel deploy --target "$VERCEL_TARGET" --token "$VERCEL_ACCESS_TOKEN"
fi

# Clean up generated .vercel dir and .env.local file
if [ -d ".vercel" ]; then
    rm -rf .vercel
    rm -f .env.local
    echo "Removed existing .vercel directory."
fi
if [ -f ".env.local" ]; then
    rm -f .env.local
    echo "Removed existing .env.local file."
fi
