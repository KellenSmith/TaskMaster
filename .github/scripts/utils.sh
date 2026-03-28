#!/usr/bin/env bash
# Function to extract a value from JSON and exit if missing or null when empty is not allowed
extract_json_value() {
    local json="$1"
    local key="$2"
    local allow_empty="${3:-false}"
    local value
    if value=$(echo "$json" | jq -er ".${key}"); then
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

# Function to sanitize and generate a valid Vercel project name
get_project_name() {
    local org_name="$1"
    local project_name
    project_name="${org_name// /-}-taskmaster"
    project_name="$(
        printf '%s' "$project_name" \
            | tr '[:upper:]' '[:lower:]' \
            | sed -E 's/[^a-z0-9._-]+/-/g; s/-{3,}/-/g; s/^-+//; s/-+$//'
    )"
    project_name="${project_name:0:100}"
    project_name="$(printf '%s' "$project_name" | sed -E 's/^-+//; s/-+$//')"
    if [ -z "$project_name" ]; then
        echo "Error: project name is empty after sanitization." >&2
        exit 1
    fi
    printf '%s' "$project_name"
}

env_var_exists() {
    local var_name="$1"
    local environment="$2"
    local env_vars_json
    env_vars_json=$(vercel env ls "$environment" --format=json --non-interactive --token "$VERCEL_ACCESS_TOKEN")
    if printf '%s' "$env_vars_json" | jq -e --arg name "$var_name" '(.envs // []) | any(.key == $name)' >/dev/null; then
        return 0
    else
        return 1
    fi
}
