#!/usr/bin/env bash
# Curl-based smoke test for the demo stack.
#
# Verifies every prospect-visible surface returns HTTP 200 and contains the
# right content. Bypasses Playwright entirely — useful as the final pre-demo
# check.
#
# Pre-reqs: `bun run demo:up` ran successfully + `bun dev` is running.
#
# Run: bash scripts/demo-smoke.sh

set -e

WEB="${WEB:-http://localhost:3000}"
ADMIN="${ADMIN:-http://localhost:3001}"
SUPABASE="${SUPABASE:-http://127.0.0.1:54321}"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass=0
fail=0

check() {
  local label=$1
  local url=$2
  local pattern=${3:-}
  local expected_code=${4:-200}

  local code
  code=$(curl -s -o /tmp/demo-smoke.html -w "%{http_code}" "$url")

  if [ "$code" != "$expected_code" ]; then
    printf "${RED}✗${NC} %-55s HTTP %s (expected %s)\n" "$label" "$code" "$expected_code"
    fail=$((fail + 1))
    return
  fi

  if [ -n "$pattern" ] && ! grep -qE "$pattern" /tmp/demo-smoke.html; then
    printf "${RED}✗${NC} %-55s 200 but no match for: %s\n" "$label" "$pattern"
    fail=$((fail + 1))
    return
  fi

  printf "${GREEN}✓${NC} %-55s %s\n" "$label" "$code"
  pass=$((pass + 1))
}

echo "→ storefront"
check "GET /"                          "$WEB/"
check "GET /boutique"                  "$WEB/boutique"
check "GET /boutique/cosmetique"       "$WEB/boutique/cosmetique"      "/produit/"
check "GET /boutique/visage"           "$WEB/boutique/visage"          "/produit/"
check "GET /boutique/orthopedie"       "$WEB/boutique/orthopedie"      "/produit/"
check "GET /boutique/materiel-medical" "$WEB/boutique/materiel-medical" "/produit/"
check "GET /notre-histoire"            "$WEB/notre-histoire"
check "GET /contact"                   "$WEB/contact"
check "GET /cgv"                       "$WEB/cgv"
check "GET /confidentialite"           "$WEB/confidentialite"
check "GET /mentions-legales"          "$WEB/mentions-legales"

echo
echo "→ admin (auth-gated routes redirect to /login)"
check "GET /login"           "$ADMIN/login" "Espace équipe"

echo
echo "→ supabase services"
check "Auth health"           "$SUPABASE/auth/v1/health"

echo
echo "→ data sanity"
counts=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -At -c \
  "SELECT 'products=' || count(*) FROM products WHERE is_published \
   UNION ALL SELECT 'orders=' || count(*) FROM orders \
   UNION ALL SELECT 'customers=' || count(*) FROM customers \
   UNION ALL SELECT 'staff=' || count(*) FROM staff_users \
   UNION ALL SELECT 'images=' || count(DISTINCT product_id) FROM product_images" 2>/dev/null || echo "FAIL")
echo "  $counts" | tr '\n' ' ' && echo

echo
if [ "$fail" -eq 0 ]; then
  printf "${GREEN}All %d checks passed.${NC}\n" "$pass"
  exit 0
else
  printf "${RED}%d failed, %d passed.${NC}\n" "$fail" "$pass"
  exit 1
fi
