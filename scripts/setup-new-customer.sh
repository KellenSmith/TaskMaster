# Configure the vars for the new customer in customer-vars.json before running this script.

set -euo pipefail

# Remove existing .vercel dir if it exists to avoid conflicts during setup
if [ -d ".vercel" ]; then
    rm -rf .vercel
    echo "Removed existing .vercel directory to avoid conflicts."
fi

# Default vars file
CUSTOMER_VARS_FILE="scripts/customer-vars.json"

# Parse --vars <path> flag
while [[ $# -gt 0 ]]; do
    case $1 in
        --vars)
            shift
            if [[ $# -gt 0 ]]; then
                CUSTOMER_VARS_FILE="$1"
                shift
            else
                echo "Error: --vars flag requires a path argument." >&2
                exit 1
            fi
            ;;
        *)
            break
            ;;
    esac
done

if [ ! -f "$CUSTOMER_VARS_FILE" ]; then
    echo "Error: $CUSTOMER_VARS_FILE not found!"
    exit 1
fi

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(jq -r '.VERCEL_ACCESS_TOKEN' $CUSTOMER_VARS_FILE)

if ! command -v expect >/dev/null 2>&1; then
    echo "Error: expect is required for automated blob store setup. Install it and rerun." >&2
    exit 1
fi

# Define org name through NEXT_PUBLIC_ORG_NAME config var in customer-vars.json
ORG_NAME=$(jq -r '.NEXT_PUBLIC_ORG_NAME' $CUSTOMER_VARS_FILE)

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
DB_REGION=$(jq -r '.DB_REGION' $CUSTOMER_VARS_FILE)
BLOB_REGION=$(jq -r '.BLOB_REGION' $CUSTOMER_VARS_FILE)

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
    local environment="$2"

    # Remove existing .env.local file if it exists to avoid conflicts
    if [ -f ".env.local" ]; then
        rm -f ".env.local"
        echo "Removed existing .env.local file to avoid conflicts."
    fi
    vercel env pull .env.local --yes --environment "$environment" --token "$VERCEL_ACCESS_TOKEN" >/dev/null

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
valid_environments="production preview development"

provision_vercel_blob_store() {
    local blob_store_name="$1"
    local access="$2"
    local environments="$3"
    local token_prefix="${4:-BLOB}"
    local token_name="${token_prefix}_READ_WRITE_TOKEN"
    local first_environment
    first_environment=$(printf '%s' "$environments" | awk '{print $1}')

    # Check if the access level is valid
    if ! printf '%s' "$valid_blob_access_levels" | grep -qw "$access"; then
        echo "Error: Invalid blob access level '$access'. Valid options are: $valid_blob_access_levels." >&2
        exit 1
    fi
    # Check if the environments are valid
    for env in $environments; do
        if ! printf '%s' "$valid_environments" | grep -qw "$env"; then
            echo "Error: Invalid environment '$env'. Valid options are: $valid_environments." >&2
            exit 1
        fi
    done

    if env_var_exists "$token_name" && get_env_var_value_from_env_file "$token_name" "$first_environment" >/dev/null; then
        echo "$token_name environment variable already exists. Skipping blob store provisioning."
        return 0
    fi

    echo "Provisioning Vercel Blob Store ${blob_store_name} with access level ${access} for environments: ${environments}."

    if [ "$token_prefix" != "BLOB" ]; then
        echo "---"
        echo "Please respond with 'n' when prompted to connect the blob store to the project during provisioning."
        echo "Instead go to the Vercel dashboard, navigate to the project, and connect the blob store to the project manually using the prefix '$token_prefix' \
            for the token name. This is required to ensure the token is created with the correct permissions and added to the correct environments."
    fi

    vercel blob create-store "$blob_store_name" --token "$VERCEL_ACCESS_TOKEN" --region "$BLOB_REGION"  --access "$access" --non-interactive

    # If a token prefix was given, wait for the user to respond "yes" to the
    # prompt to connect the blob store to the project.
    if [ "$token_prefix" != "BLOB" ]; then
        while true; do
            sleep 5
            echo "Checking if ${token_name} environment variable has been created with a value for the ${first_environment} environment..."
            if env_var_exists "$token_name" && get_env_var_value_from_env_file "$token_name" "$first_environment" >/dev/null; then
                break
            fi
        done
    fi


    echo "Vercel Blob Store ${blob_store_name} provisioned successfully with access level ${access} for environments: ${environments}."
}

generate_secret() {
    # Generate a random 256-bit (32-byte) secret and encode it in base64
    openssl rand -base64 32
}

add_customer_var_to_environments() {
    local key="$1"
    local value="$2"
    local environments="$3"
    shift 3

    # Add the environment variable to all specified environments "production preview development"
    for env in $environments; do
        # If env=preview, add "" after "$env"
        if [ "$env" = "preview" ]; then
            vercel env add "$key" "$env" "" --value "$value" "$@" --non-interactive --yes --force --token "$VERCEL_ACCESS_TOKEN" || true
        else
            vercel env add "$key" "$env" --value "$value" "$@" --non-interactive --yes --force --token "$VERCEL_ACCESS_TOKEN" || true
        fi
    done
}



## Production
provision_prisma_postgres "${PROJECT_NAME}-db-production" \
    --environment production
provision_vercel_blob_store "${PROJECT_NAME}-blob-backup" "private" "production" "BLOB_BACKUP"
provision_vercel_blob_store "${PROJECT_NAME}-blob-production" "public" "production"

## Preview/Development
provision_prisma_postgres "${PROJECT_NAME}-db-preview" \
    --environment preview \
    --environment development
provision_vercel_blob_store "${PROJECT_NAME}-blob-preview" "public" "preview development"

# Generate secrets for the project and set them as environment variables
PROD_AUTH_SECRET=$(generate_secret)
PROD_CRON_SECRET=$(generate_secret)
PREVIEW_AUTH_SECRET=$(generate_secret)
PREVIEW_CRON_SECRET=$(generate_secret)
EMAIL=$(jq -r '.EMAIL' $CUSTOMER_VARS_FILE)
EMAIL_PASSWORD=$(jq -r '.EMAIL_PASSWORD' $CUSTOMER_VARS_FILE)
SMTP_HOST=$(jq -r '.SMTP_HOST' $CUSTOMER_VARS_FILE)
SMTP_PORT=$(jq -r '.SMTP_PORT' $CUSTOMER_VARS_FILE)
GOOGLE_SITE_VERIFICATION=$(jq -r '.GOOGLE_SITE_VERIFICATION' $CUSTOMER_VARS_FILE)
NEXT_PUBLIC_ORG_DESCRIPTION=$(jq -r '.NEXT_PUBLIC_ORG_DESCRIPTION' $CUSTOMER_VARS_FILE)
NEXT_PUBLIC_ORG_NAME=$(jq -r '.NEXT_PUBLIC_ORG_NAME' $CUSTOMER_VARS_FILE)
NEXT_PUBLIC_SEO_KEYWORDS=$(jq -r '.NEXT_PUBLIC_SEO_KEYWORDS' $CUSTOMER_VARS_FILE)
SWEDBANK_PAY_ACCESS_TOKEN=$(jq -r '.SWEDBANK_PAY_ACCESS_TOKEN' $CUSTOMER_VARS_FILE)
SWEDBANK_PAY_PAYEE_ID=$(jq -r '.SWEDBANK_PAY_PAYEE_ID' $CUSTOMER_VARS_FILE)

add_customer_var_to_environments "AUTH_SECRET" "$PROD_AUTH_SECRET" "production" --sensitive
add_customer_var_to_environments "CRON_SECRET" "$PROD_CRON_SECRET" "production" --sensitive
add_customer_var_to_environments "AUTH_SECRET" "$PREVIEW_AUTH_SECRET" "preview" --sensitive
add_customer_var_to_environments "CRON_SECRET" "$PREVIEW_CRON_SECRET" "preview" --sensitive
add_customer_var_to_environments "AUTH_SECRET" "$PREVIEW_AUTH_SECRET" "development"
add_customer_var_to_environments "CRON_SECRET" "$PREVIEW_CRON_SECRET" "development"

add_customer_var_to_environments "EMAIL" "$EMAIL" "production"
add_customer_var_to_environments "EMAIL_PASSWORD" "$EMAIL_PASSWORD" "production" --sensitive
add_customer_var_to_environments "SMTP_HOST" "$SMTP_HOST" "production"
add_customer_var_to_environments "SMTP_PORT" "$SMTP_PORT" "production"

add_customer_var_to_environments "EMAIL" "kellensmith407@gmail.com" "preview development"
add_customer_var_to_environments "EMAIL_PASSWORD" "nxwc rinu nino setk" "preview" --sensitive
add_customer_var_to_environments "EMAIL_PASSWORD" "nxwc rinu nino setk" "development"
add_customer_var_to_environments "SMTP_HOST" "smtp.gmail.com" "preview development"
add_customer_var_to_environments "SMTP_PORT" "587" "preview development"

add_customer_var_to_environments "GOOGLE_SITE_VERIFICATION" "$GOOGLE_SITE_VERIFICATION" "production preview development"
add_customer_var_to_environments "NEXT_PUBLIC_ORG_DESCRIPTION" "$NEXT_PUBLIC_ORG_DESCRIPTION" "production preview development"
add_customer_var_to_environments "NEXT_PUBLIC_ORG_NAME" "$NEXT_PUBLIC_ORG_NAME" "production preview development"
add_customer_var_to_environments "NEXT_PUBLIC_SEO_KEYWORDS" "$NEXT_PUBLIC_SEO_KEYWORDS" "production preview development"

add_customer_var_to_environments "SWEDBANK_BASE_URL" "https://api.payex.com" "production"
add_customer_var_to_environments "SWEDBANK_PAY_PAYEE_ID" "$SWEDBANK_PAY_PAYEE_ID" "production"
add_customer_var_to_environments "SWEDBANK_PAY_ACCESS_TOKEN" "$SWEDBANK_PAY_ACCESS_TOKEN" "production" --sensitive

add_customer_var_to_environments "SWEDBANK_BASE_URL" "https://api.externalintegration.payex.com" "preview development"
add_customer_var_to_environments "SWEDBANK_PAY_PAYEE_ID" "5c5b722a-2b29-4dfe-acf7-1f69cd616063" "preview development"
add_customer_var_to_environments "SWEDBANK_PAY_ACCESS_TOKEN" "cfc528837b8e476dda3eced76c53d7f0d0859547a75b6864fee12df35d3c7b02" "preview" --sensitive
add_customer_var_to_environments "SWEDBANK_PAY_ACCESS_TOKEN" "cfc528837b8e476dda3eced76c53d7f0d0859547a75b6864fee12df35d3c7b02" "development"

vercel env pull .env.local --token "$VERCEL_ACCESS_TOKEN"

git fetch origin
git checkout dev
vercel deploy --target "preview" --no-wait --token "$VERCEL_ACCESS_TOKEN"
git checkout master
vercel deploy --prod --no-wait --token "$VERCEL_ACCESS_TOKEN"
