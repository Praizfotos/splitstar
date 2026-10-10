#!/usr/bin/env bash
# =============================================================================
# create_test_pool.sh — Create a sample pool on testnet after deployment
# =============================================================================
# Prerequisites:
#   - scripts/deployed.testnet.json exists (run deploy.sh first)
#   - stellar CLI installed
#   - Deployer identity funded
#
# Usage:
#   chmod +x scripts/create_test_pool.sh
#   ./scripts/create_test_pool.sh
# =============================================================================
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
DEPLOY_FILE="scripts/deployed.${NETWORK}.json"
IDENTITY="splitstar-deployer"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ -f "${DEPLOY_FILE}" ]] || error "${DEPLOY_FILE} not found. Run deploy.sh first."

CONTRACT_ID=$(jq -r '.contractId' "${DEPLOY_FILE}")
DEPLOYER=$(stellar keys address "${IDENTITY}")
info "Contract: ${CONTRACT_ID}"
info "Deployer: ${DEPLOYER}"

# Use XLM SAC on testnet as the pool token
TOKEN="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3"
info "Token (XLM SAC): ${TOKEN}"

# Pool name as hex-encoded Bytes (Soroban Bytes argument)
POOL_NAME_HEX=$(printf 'Test Trip Fund' | xxd -p | tr -d '\n')
info "Creating pool: 'Test Trip Fund'"

POOL_ID=$(stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --source "${IDENTITY}" \
  --network "${NETWORK}" \
  --fee 1000000 \
  -- create_pool \
  --owner "${DEPLOYER}" \
  --token "${TOKEN}" \
  --name "${POOL_NAME_HEX}" \
  --goal 0 \
  --max_members 5 2>/dev/null | tr -d '"')

info "Pool created with ID: ${POOL_ID}"

# Deposit 10 XLM (100000000 stroops)
DEPOSIT_AMOUNT=100000000
info "Depositing 10 XLM (${DEPOSIT_AMOUNT} stroops)…"

stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --source "${IDENTITY}" \
  --network "${NETWORK}" \
  --fee 1000000 \
  -- deposit \
  --pool_id "${POOL_ID}" \
  --member "${DEPLOYER}" \
  --amount "${DEPOSIT_AMOUNT}"

info "Deposit complete."

# Read pool state
info "Fetching pool state…"
stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --source "${IDENTITY}" \
  --network "${NETWORK}" \
  -- get_pool \
  --pool_id "${POOL_ID}" | jq .

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN} Test pool #${POOL_ID} ready!${NC}"
echo -e "${GREEN} View in frontend: /pool/${POOL_ID}${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
