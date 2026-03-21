#!/usr/bin/env bash
set -euo pipefail

echo "[netlify-build] starting pre-build steps"

# Ensure a clean install of workspace dependencies
echo "[netlify-build] running npm ci at repo root"
npm ci

# Some optional native bindings (like Tailwind Oxide) are platform-specific
# and may not be installed by npm automatically in workspaces. Attempt to
# install the linux prebuilt and rebuild the native module inside the web
# workspace to ensure the native .node file is present.
echo "[netlify-build] installing platform-specific oxide binary for apps/web"
if [ -d "apps/web" ]; then
  pushd apps/web >/dev/null
  npm i @tailwindcss/oxide-linux-x64-gnu --no-save || true
  npm rebuild @tailwindcss/oxide || true
  popd >/dev/null
fi

echo "[netlify-build] running root build"
npm run build

echo "[netlify-build] done"
