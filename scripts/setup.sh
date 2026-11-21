#!/usr/bin/env bash
# Installs everything CourseSmith needs on macOS / Linux: Python packages, the Devin CLI, and the Devin + Notion sign-ins.
cd "$(dirname "$0")/.." || exit 1
unset ACP_BACKEND WINDSURF_IDE_TYPE

if [ "$(uname)" = "Darwin" ]; then OPEN=open; else OPEN=xdg-open; fi
fail() { echo; echo "Setup did not finish: $1"; read -r -p "Press Enter to close."; exit 1; }

echo "== CourseSmith setup =="
echo

if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh"; fi
if ! command -v node >/dev/null 2>&1; then
  $OPEN "https://nodejs.org/en/download" >/dev/null 2>&1
  fail "Node.js 18 or newer is required (download page opened)."
fi
echo "[ok] Node.js $(node --version)"

command -v python3 >/dev/null 2>&1 || { $OPEN "https://www.python.org/downloads/" >/dev/null 2>&1; fail "Python 3 is required (download page opened)."; }
python3 -m pip --version >/dev/null 2>&1 || fail "pip is missing. Install it (e.g. 'sudo apt install python3-pip'), then run this again."
echo "Installing Python packages..."
python3 -m pip install --user --quiet -r requirements.txt 2>/dev/null \
  || python3 -m pip install --user --quiet --break-system-packages -r requirements.txt \
  || fail "Could not install the Python packages."
echo "[ok] Python packages installed"

export PATH="$HOME/.local/bin:$PATH"
if ! command -v devin >/dev/null 2>&1; then
  echo "Installing the Devin CLI..."
  curl -fsSL https://cli.devin.ai/install.sh | bash || fail "Devin CLI install failed."
  export PATH="$HOME/.local/bin:$PATH"
fi
command -v devin >/dev/null 2>&1 || fail "The Devin CLI was installed but is not on PATH yet. Open a new terminal and run this again."
echo "[ok] Devin CLI found"

echo
echo "Sign in to Devin. A browser window will open..."
devin auth login
echo
echo "Connect Notion. Allow access to your copy of the Student OS dashboard..."
devin mcp login notion

echo
echo "Setup complete. Double-click the Start CourseSmith launcher to open the app."
read -r -p "Press Enter to close."
