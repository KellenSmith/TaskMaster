set -euo pipefail

# Source the util functions from their own file
source "$(dirname "$0")/utils.sh"

if [ ! -f customer_vars.json ]; then
    echo "Error: customer_vars.json file not found!" >&2
    exit 1
fi
CUSTOMER_VARS_JSON=$(cat customer_vars.json)
if [ ! -f common_vars.json ]; then
    echo "Error: common_vars.json file not found!" >&2
    exit 1
fi
COMMON_VARS_JSON=$(cat common_vars.json)
VERCEL_TARGET="${1}"

echo "Decoded customer vars JSON: $CUSTOMER_VARS_JSON"
echo "Decoded global vars JSON: $COMMON_VARS_JSON"

valid_environments="production preview"
if ! printf '%s' "$valid_environments" | grep -qw "$VERCEL_TARGET"; then
    echo "Error: Invalid environment '$VERCEL_TARGET'. Valid options are: $valid_environments." >&2
    exit 1
fi

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" 'VERCEL_ACCESS_TOKEN')

EMAIL=$(extract_json_value "$CUSTOMER_VARS_JSON" 'EMAIL')
EMAIL_PASSWORD=$(extract_json_value "$CUSTOMER_VARS_JSON" 'EMAIL_PASSWORD')
SMTP_HOST=$(extract_json_value "$CUSTOMER_VARS_JSON" 'SMTP_HOST')
SMTP_PORT=$(extract_json_value "$CUSTOMER_VARS_JSON" 'SMTP_PORT')

GOOGLE_SITE_VERIFICATION=$(extract_json_value "$CUSTOMER_VARS_JSON" 'GOOGLE_SITE_VERIFICATION' true)
NEXT_PUBLIC_ORG_DESCRIPTION=$(extract_json_value "$CUSTOMER_VARS_JSON" 'NEXT_PUBLIC_ORG_DESCRIPTION' true)
NEXT_PUBLIC_SEO_KEYWORDS=$(extract_json_value "$CUSTOMER_VARS_JSON" 'NEXT_PUBLIC_SEO_KEYWORDS' true)


SWEDBANK_BASE_URL=$(extract_json_value "$COMMON_VARS_JSON" 'SWEDBANK_BASE_URL')
# If VERCEL_TARGET=production, take SWEDBANK_PAY_ACCESS_TOKEN and SWEDBANK_PAY_PAYEE_ID
# from customer vars, else from global vars
if [ "$VERCEL_TARGET" = "production" ]; then
    SWEDBANK_PAY_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" 'SWEDBANK_PAY_ACCESS_TOKEN' true)
    SWEDBANK_PAY_PAYEE_ID=$(extract_json_value "$CUSTOMER_VARS_JSON" 'SWEDBANK_PAY_PAYEE_ID' true)
else
    SWEDBANK_PAY_ACCESS_TOKEN=$(extract_json_value "$COMMON_VARS_JSON" 'SWEDBANK_PAY_ACCESS_TOKEN')
    SWEDBANK_PAY_PAYEE_ID=$(extract_json_value "$COMMON_VARS_JSON" 'SWEDBANK_PAY_PAYEE_ID')
fi

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
