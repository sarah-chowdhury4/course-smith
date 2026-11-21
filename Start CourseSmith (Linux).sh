#!/usr/bin/env bash
# Double-click (choose "Run" / "Run as program") to start CourseSmith and open it in your browser.
cd "$(dirname "$0")" || exit 1

# When launched from a file manager without a terminal, reopen in one so the server can be stopped.
if [ ! -t 1 ] && [ -z "$COURSESMITH_IN_TERMINAL" ]; then
  export COURSESMITH_IN_TERMINAL=1
  for term in x-terminal-emulator gnome-terminal konsole xfce4-terminal xterm; do
    if command -v "$term" >/dev/null 2>&1; then
      case "$term" in
        gnome-terminal) exec "$term" -- "$0" ;;
        *) exec "$term" -e "$0" ;;
      esac
    fi
  done
fi

if ! command -v node >/dev/null 2>&1; then
  [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required. Opening the download page..."
  xdg-open "https://nodejs.org/en/download" >/dev/null 2>&1
  read -r -p "Press Enter to close."
  exit 1
fi

node server.js --open
