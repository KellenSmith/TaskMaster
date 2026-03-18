# Check for required CLI tools
for tool in vercel openssl gh; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "Error: $tool is required but not installed. Please install it and rerun." >&2
        exit 1
    fi
done

if [ ! -f customer_vars.json ]; then
    echo "Error: customer_vars.json file not found!" >&2
    exit 1
fi
if [ ! -f common_vars.json ]; then
    echo "Error: common_vars.json file not found!" >&2
    exit 1
fi

VERCEL_TARGET="${1}"

valid_environments="production preview"
if ! printf '%s' "$valid_environments" | grep -qw "$VERCEL_TARGET"; then
    echo "Error: Invalid environment '$VERCEL_TARGET'. Valid options are: $valid_environments." >&2
    exit 1
fi

bash .github/scripts/set_up_customer_project.sh "${VERCEL_TARGET}"

# Check that .vercel/project.json exists and contains the correct project name
if [ ! -f .vercel/project.json ]; then
    echo "Error: .vercel/project.json not found. Please ensure the project is set up correctly." >&2
    exit 1
fi

# Run the following scripts in parallel and exit 1 if any fail
pids=()
bash .github/scripts/set_customer_env_vars.sh "${VERCEL_TARGET}" & pids+=("$!")
bash .github/scripts/provision_customer_rdb.sh "${VERCEL_TARGET}" & pids+=("$!")
bash .github/scripts/provision_customer_blob.sh "${VERCEL_TARGET}" & pids+=("$!")

# Wait for all background jobs and check exit codes
exit_code=0
for pid in "${pids[@]}"; do
    wait "$pid" || exit_code=1
done

if [ $exit_code -ne 0 ]; then
    echo "One or more provisioning steps failed." >&2
    exit 1
fi

bash .github/scripts/deploy_to_customer_env.sh "${VERCEL_TARGET}"
