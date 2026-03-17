# Configure the vars for the new customer in customer-vars.json before running this script.

set -euo pipefail

# Source the util functions from their own file
source "$(dirname "$0")/utils.sh"

CUSTOMER_VARS_JSON="$1"
VERCEL_TARGET="${3}"

# Authenticate to vercel using the customer's access token
VERCEL_ACCESS_TOKEN=$(extract_json_value "$CUSTOMER_VARS_JSON" '.VERCEL_ACCESS_TOKEN')

-------------------------------------------------------------------------------------



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
