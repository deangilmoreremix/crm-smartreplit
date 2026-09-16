#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

check_env() {
    if [[ -z "${NETLIFY_AUTH_TOKEN:-}" ]]; then
        error "NETLIFY_AUTH_TOKEN environment variable is not set"
        exit 1
    fi
    if [[ -z "${NETLIFY_SITE_ID:-}" ]]; then
        error "NETLIFY_SITE_ID environment variable is not set"
        exit 1
    fi
}

build_client() {
    log "Building client application..."
    cd "$PROJECT_DIR"
    
    if [[ ! -f "package.json" ]]; then
        error "package.json not found"
        exit 1
    fi
    
    npm run build:client
    
    if [[ ! -d "client/dist" ]]; then
        error "Build failed: client/dist directory not found"
        exit 1
    fi
    
    log "Client build completed successfully"
}

deploy_netlify() {
    log "Deploying to Netlify..."
    cd "$PROJECT_DIR"
    
    local site_name="${1:-}"
    local deploy_args="--prod"
    
    if [[ -n "$site_name" ]]; then
        deploy_args="--prod --site-name=$site_name"
    fi
    
    local output
    output=$(netlify deploy $deploy_args 2>&1)
    
    echo "$output"
    
    if echo "$output" | grep -q "Deploying to main site"; then
        local url
        url=$(echo "$output" | grep -oP 'Website family URL: \Khttps://[^ ]+' || echo "$output" | grep -oP 'Netlify: \K[^ ]+' || echo "Check Netlify dashboard")
        log "Deployment successful!"
        log "Deployed URL: $url"
    else
        error "Deployment may have failed. Please check Netlify dashboard."
        exit 1
    fi
}

main() {
    log "Starting SmartCRM deployment..."
    
    check_env
    build_client
    deploy_netlify "${1:-}"
    
    log "Deployment pipeline completed"
}

main "$@"
