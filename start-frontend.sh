#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "$DIR"
exec node ./node_modules/next/dist/bin/next dev --port 3000
