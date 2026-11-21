#!/usr/bin/env bash
# Double-click once (choose "Run" / "Run as program") to install everything CourseSmith needs.
cd "$(dirname "$0")" || exit 1

# When launched from a file manager without a terminal, reopen in one so prompts are visible.
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

exec bash scripts/setup.sh
