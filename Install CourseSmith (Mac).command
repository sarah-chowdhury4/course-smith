#!/usr/bin/env bash
# Double-click once to install everything CourseSmith needs. If macOS blocks it, right-click → Open.
cd "$(dirname "$0")" || exit 1
exec bash scripts/setup.sh
