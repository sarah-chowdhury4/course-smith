#!/usr/bin/env bash
# Double-click in Finder to start CourseSmith and open it in your browser.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required. Opening the download page..."
  open "https://nodejs.org/en/download"
  read -r -p "Press Enter to close."
  exit 1
fi

node server.js --open
