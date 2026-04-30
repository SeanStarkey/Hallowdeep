#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HALLOWDEEP_DEPLOY_DIR:-/var/www/seanstarkey.dev/public/Hallowdeep}"
OWNER="${HALLOWDEEP_DEPLOY_OWNER:-}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required for deployment." >&2
  exit 1
fi

echo "Deploying Hallowdeep"
echo "Source: ${SOURCE_DIR}"
echo "Target: ${TARGET_DIR}"

mkdir -p "${TARGET_DIR}/data"

if [ ! -f "${TARGET_DIR}/data/high-scores.json" ]; then
  printf '[]\n' > "${TARGET_DIR}/data/high-scores.json"
fi

rsync -av --delete \
  --exclude ".git/" \
  --exclude ".DS_Store" \
  --exclude "data/high-scores.json" \
  "${SOURCE_DIR}/" \
  "${TARGET_DIR}/"

if [ -n "${OWNER}" ]; then
  chown -R "${OWNER}" "${TARGET_DIR}"
fi

echo "Deployment complete."
echo "Remember to restart the Hallowdeep Node score server if server.js changed."
