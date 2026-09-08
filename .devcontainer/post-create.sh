#!/usr/bin/env bash
set -euo pipefail

# The claude-code devcontainer feature installs @anthropic-ai/claude-code as root into
# the global npm prefix, without restoring ownership to vscode like the node feature does
# for its other subdirectories (corepack/, npm/, pnpm/). That leaves Claude Code's own
# auto-updater — which runs as vscode — unable to write to its own package directory,
# failing with "no write permission to npm prefix" (~/.claude/.last-update-result.json
# shows status "no_permissions").
sudo chown -R vscode:nvm "$(npm config get prefix)/lib/node_modules"

# Seed ~/.claude.json once from the host's file (mounted read-only at a separate path,
# not bind-mounted onto ~/.claude.json itself) so Claude Code skips the theme/subscription
# prompts on every fresh container. A one-time copy, not a live sync: Claude Code writes
# this file via atomic rename (temp + rename), which detaches a single-file bind mount from
# the host inode, leaving the container with stale content until a rebuild. Copying once on
# creation avoids that without keeping host and container in sync afterwards.
if [ ! -f "$HOME/.claude.json" ] && [ -f /tmp/host-claude.json ]; then
  cp /tmp/host-claude.json "$HOME/.claude.json"
fi

# Playwright's own browser binary and OS-level libraries (libnss3, libatk, ...) live
# outside node_modules, so `npm install` alone leaves chromium unable to launch. This
# installs both, and is a no-op on rebuilds where the cache under ~/.cache/ms-playwright
# already has the binary.
npx playwright install --with-deps chromium
