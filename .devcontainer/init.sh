#!/bin/sh
set -e
mkdir -p "$HOME/.claude"
test -f "$HOME/.claude.json" || touch "$HOME/.claude.json"
