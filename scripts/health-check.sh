#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

check_supabase_connection() {
    log_info "Checking Supabase connection..."
    
    local supabase_url="${VITE_SUPABASE_URL:-}"
    local supabase_key="${VITE_SUPABASE_ANON_KEY:-}"
    
    if [[ -z "$supabase_url" ]] || [[ -z "$supabase_key" ]]; then
        log_error "Supabase credentials not configured"
        return 1
    fi
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "$supabase_url/rest/v1/" \
        -H "apikey: $supabase_key" \
        -H "Authorization: Bearer $supabase_key")
    
    if [[ "$response" == "200" ]]; then
        log_info "Supabase connection: OK"
        return 0
    else
        log_error "Supabase connection failed (HTTP $response)"
        return 1
    fi
}

check_api_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    
    log_info "Checking API endpoint: $endpoint"
    
    local url
    if [[ "$endpoint" =~ ^/ ]]; then
        url="${API_BASE_URL:-http://localhost:5000}$endpoint"
    else
        url="$endpoint"
    fi
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [[ "$response" == "$expected_status" ]] || [[ "$expected_status" == "any" && "$response" != "000" ]]; then
        log_info "Endpoint $endpoint: OK (HTTP $response)"
        return 0
    else
        log_error "Endpoint $endpoint: FAILED (HTTP $response, expected $expected_status)"
        return 1
    fi
}

check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    local supabase_url="${VITE_SUPABASE_URL:-}"
    local supabase_key="${VITE_SUPABASE_ANON_KEY:-}"
    
    if [[ -z "$supabase_url" ]] || [[ -z "$supabase_key" ]]; then
        log_error "Supabase credentials not configured"
        return 1
    fi
    
    local result
    result=$(curl -s "$supabase_url/rest/v1/contacts?select=id&limit=1" \
        -H "apikey: $supabase_key" \
        -H "Authorization: Bearer $supabase_key")
    
    if [[ "$result" == *"id"* ]] || [[ "$result" == *"[]"* ]]; then
        log_info "Database connectivity: OK"
        return 0
    else
        log_error "Database connectivity: FAILED"
        log_error "Response: $result"
        return 1
    fi
}

check_netlify_functions() {
    log_info "Checking Netlify Functions..."
    
    local functions_dir="$PROJECT_DIR/netlify/functions"
    
    if [[ ! -d "$functions_dir" ]]; then
        log_warn "Functions directory not found, skipping function check"
        return 0
    fi
    
    local failed=0
    for func_dir in "$functions_dir"/*/; do
        if [[ -d "$func_dir" ]]; then
            local func_name
            func_name=$(basename "$func_dir")
            
            if ls "$func_dir"/*.js "$func_dir"/*.mjs 1>/dev/null 2>&1; then
                log_info "Function $func_name: Built"
            else
                log_warn "Function $func_name: No bundle found"
            fi
        fi
    done
    
    return 0
}

print_status() {
    local status="$1"
    local message="$2"
    
    if [[ "$status" == "0" ]]; then
        echo -e "  ${GREEN}✓${NC} $message"
    else
        echo -e "  ${RED}✗${NC} $message"
    fi
}

main() {
    log_info "SmartCRM Health Check"
    log_info "======================"
    echo ""
    
    local overall_status=0
    
    echo "Environment:"
    echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+configured}${VITE_SUPABASE_URL:-not set}"
    echo "  API_BASE_URL: ${API_BASE_URL:+configured}${API_BASE_URL:-not set}"
    echo ""
    
    check_supabase_connection
    print_status $? "Supabase connection"
    [[ $? -ne 0 ]] && overall_status=1
    
    check_database_connectivity
    print_status $? "Database connectivity"
    [[ $? -ne 0 ]] && overall_status=1
    
    check_api_endpoint "/api/health" "any"
    print_status $? "Health API endpoint"
    [[ $? -ne 0 ]] && overall_status=1
    
    check_netlify_functions
    print_status $? "Netlify Functions"
    [[ $? -ne 0 ]] && overall_status=1
    
    echo ""
    
    if [[ "$overall_status" == "0" ]]; then
        log_info "All checks passed!"
        exit 0
    else
        log_error "Some checks failed. Please review the output above."
        exit 1
    fi
}

main "$@"
