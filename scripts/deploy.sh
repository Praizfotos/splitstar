#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Deploy SplitStar to Stellar Testnet
# =============================================================================
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
WASM="target/wasm32-unknown-unknown/release/splitstar_contract.wasm"
GREEN='\033[0;32m'; NC='\033[0m'

command -v stellar &>/dev/null || { echo "stellar CLI not found"; exit 1; }

IDENTITY="splitstar-deployer"
if ! stellar keys show "${IDENTITY}" &>/dev/null; then
  stellar keys generate "${IDENTITY}" --network "${NETWORK}"
fi
ADDR=$(stellar keys address "${IDENTITY}")
echo -e "${GREEN}Deployer: ${ADDR}${NC}"

if [[ "${NETWORK}" == "testnet" ]]; then
  curl -sf "https://friendbot.stellar.org?addr=${ADDR}" -o /dev/null || true
fi

echo "Building WASM…"
stellar contract build --manifest-path contracts/splitstar/Cargo.toml --profile release
echo "WASM: $(du -sh "${WASM}" | cut -f1)"

echo "Deploying…"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "${WASM}" --source "${IDENTITY}" --network "${NETWORK}" --fee 1000000)
echo -e "${GREEN}Contract ID: ${CONTRACT_ID}${NC}"

echo "Initialising…"
stellar contract invoke --id "${CONTRACT_ID}" --source "${IDENTITY}" \
  --network "${NETWORK}" --fee 1000000 -- initialize

cat > "scripts/deployed.${NETWORK}.json" <<EOF
{"network":"${NETWORK}","contractId":"${CONTRACT_ID}","deployedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF

echo -e "${GREEN}✓ SplitStar deployed! Contract: ${CONTRACT_ID}${NC}"
echo "Add to frontend/.env.local: NEXT_PUBLIC_CONTRACT_ID=${CONTRACT_ID}"
