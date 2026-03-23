# Configure the vars for the new customer in customer-vars.json before running this script.

set -euo pipefail

# Source the util functions from their own file
source "$(dirname "$0")/utils.sh"

# Read customer_vars.json file for CUSTOMER_VARS_JSON
if [ ! -f customer_vars.json ]; then
    echo "Error: customer_vars.json file not found!" >&2
    exit 1
fi
CUSTOMER_VARS_JSON=$(cat customer_vars.json)
VERCEL_TARGET="${1}"

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" 'VERCEL_ACCESS_TOKEN')

echo "Deploying to Vercel project for environment: $VERCEL_TARGET"
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
