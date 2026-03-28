#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML_FILE="$SCRIPT_DIR/index.html"
APP_DIR="$HOME/Applications"
APP_NAME="Storyboard Image Editor"
APP_PATH="$APP_DIR/$APP_NAME.app"

if [[ ! -f "$HTML_FILE" ]]; then
  echo "Missing HTML file: $HTML_FILE" >&2
  exit 1
fi

mkdir -p "$APP_DIR"

osacompile -o "$APP_PATH" <<OSA
on run
	set htmlPath to POSIX file "$HTML_FILE"
	tell application "Finder"
		if not (exists file htmlPath) then
			display dialog "找不到页面文件: $HTML_FILE" buttons {"OK"} default button "OK"
			return
		end if
	end tell
	do shell script "open " & quoted form of POSIX path of htmlPath
end run
OSA

echo "Built: $APP_PATH"
