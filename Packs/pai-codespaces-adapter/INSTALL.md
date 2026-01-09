# Installation Guide: PAI Codespaces Adapter

AI-guided installation wizard for `pai-codespaces-adapter`.

This document follows the 5-phase AI installation pattern used by all PAI Packs.

---

## Prerequisites

Before proceeding, ensure you have:

- **Bun** >=1.0 installed (`which bun` should return a path)
- **pai-core-install** pack installed (REQUIRED)
- **pai-hook-system** pack installed (REQUIRED)
- Linux/Unix environment (Codespaces, remote server, Docker, WSL)
- Modern browser with WebSocket support

---

# PHASE 1: System Analysis

**AI Instructions:** Run all checks in this phase. If critical requirements fail, STOP and inform the user.

## 1.1 Check Dependencies

### pai-core-install (REQUIRED)
```bash
# Check if PAI core is installed
if [ -d "$HOME/.claude/skills/CORE" ]; then
  echo "✅ pai-core-install found"
else
  echo "❌ pai-core-install NOT FOUND - Installation cannot proceed"
  exit 1
fi
```

### pai-hook-system (REQUIRED)
```bash
# Check if hook system is installed
if [ -f "$HOME/.claude/hooks/security-validator.ts" ] || [ -f "$HOME/.claude/hooks/load-core-context.ts" ]; then
  echo "✅ pai-hook-system found"
else
  echo "⚠️  pai-hook-system may not be installed - some hooks may be missing"
  echo "Install pai-hook-system for full functionality"
fi
```

### Bun Runtime (REQUIRED)
```bash
# Check Bun is installed
if command -v bun &> /dev/null; then
  BUN_VERSION=$(bun --version)
  echo "✅ Bun $BUN_VERSION found"
else
  echo "❌ Bun NOT FOUND - Installation cannot proceed"
  echo "Install Bun from https://bun.sh"
  exit 1
fi
```

## 1.2 Check Port Availability

### Port 4000 (Observability Server)
```bash
# Check if port 4000 is available
if lsof -i :4000 &> /dev/null; then
  echo "⚠️  Port 4000 is in use"
  echo "Process: $(lsof -i :4000 | tail -1)"
  echo "You'll need to either kill this process or configure a custom port"
else
  echo "✅ Port 4000 available"
fi
```

### Port 5173 (Vite Dev Server)
```bash
# Check if port 5173 is available
if lsof -i :5173 &> /dev/null; then
  echo "⚠️  Port 5173 is in use"
  echo "Process: $(lsof -i :5173 | tail -1)"
  echo "This is usually fine - Vite will auto-increment to 5174"
else
  echo "✅ Port 5173 available"
fi
```

## 1.3 Detect Existing Installations

### Check for Existing Notification Hooks
```bash
# Check if notification hooks already exist
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

if [ -f "$PAI_DIR/hooks/stop-hook-notification.ts" ]; then
  echo "⚠️  Existing stop-hook-notification.ts found"
  EXISTING_HOOKS=true
else
  echo "✅ No conflicting hooks found"
  EXISTING_HOOKS=false
fi
```

### Check for pai-voice-system (Informational)
```bash
# Check if voice system is installed
if [ -f "$PAI_DIR/hooks/stop-hook-voice.ts" ] || [ -d "$PAI_DIR/VoiceServer" ]; then
  echo "ℹ️  pai-voice-system detected"
  echo "Both systems can work alongside each other for dual notifications"
  VOICE_SYSTEM_PRESENT=true
else
  echo "ℹ️  pai-voice-system not detected"
  VOICE_SYSTEM_PRESENT=false
fi
```

## 1.4 Check Environment Variables

```bash
# Verify required environment variables
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
DA="${DA:-Unknown}"
TIME_ZONE="${TIME_ZONE:-UTC}"

echo "Environment Configuration:"
echo "  PAI_DIR: $PAI_DIR"
echo "  DA (Agent Name): $DA"
echo "  TIME_ZONE: $TIME_ZONE"

if [ "$DA" = "Unknown" ]; then
  echo "⚠️  DA environment variable not set - notifications may not show agent name"
fi
```

## 1.5 Analysis Summary

**AI Instructions:** Summarize findings and determine if installation can proceed.

```
SUMMARY:
- Dependencies: [OK/FAILED]
- Ports: [4000: OK/BUSY, 5173: OK/BUSY]
- Conflicts: [EXISTING_HOOKS: true/false]
- Voice System: [PRESENT: true/false]
- Ready to Proceed: [YES/NO]
```

If critical dependencies failed, STOP here and inform the user.

---

# PHASE 2: User Questions

**AI Instructions:** Use the `AskUserQuestion` tool to gather user preferences.

## 2.1 Handle Existing Hooks (if detected)

**If `EXISTING_HOOKS=true`:**

Ask the user:
```
Question: "Existing notification hooks were found. How should we proceed?"
Options:
1. Backup and replace (Recommended) - Backup existing hooks with timestamp, install new ones
2. Skip installation - Keep existing hooks, do not install
```

## 2.2 Custom Port Configuration

Ask the user:
```
Question: "What port should the observability server use?"
Options:
1. 4000 (Default/Recommended) - Standard port, works with default config
2. Custom port - Specify a different port (you'll need to update hooks manually)
```

If "Custom port" selected, ask for the port number (numeric input).

## 2.3 Auto-Start Configuration

Ask the user:
```
Question: "Enable auto-start for observability server on shell startup?"
Options:
1. No (Recommended) - Start manually when needed
2. Yes - Add to ~/.bashrc or ~/.zshrc for automatic startup

Note: In Codespaces, you may want to add this to .devcontainer.json instead.
```

## 2.4 Final Confirmation

Ask the user:
```
Question: "Ready to install pai-codespaces-adapter?"
Summary:
- Hooks will be installed to: $PAI_DIR/hooks/
- Observability system to: $PAI_DIR/observability/
- Settings.json will be updated with new hooks
- Existing files will be backed up if conflicts exist

Proceed?
Options:
1. Yes, proceed with installation
2. No, cancel installation
```

If user selects "No", exit gracefully.

---

# PHASE 3: Backup

**AI Instructions:** Create timestamped backups of any files that will be modified.

## 3.1 Create Backup Directory

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
BACKUP_DIR="$PAI_DIR/backups/pai-codespaces-adapter-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"
```

## 3.2 Backup Existing Hooks (if present)

```bash
# Backup existing notification hooks if they exist
if [ -f "$PAI_DIR/hooks/stop-hook-notification.ts" ]; then
  cp "$PAI_DIR/hooks/stop-hook-notification.ts" "$BACKUP_DIR/"
  echo "✅ Backed up: stop-hook-notification.ts"
fi

if [ -f "$PAI_DIR/hooks/subagent-stop-hook-notification.ts" ]; then
  cp "$PAI_DIR/hooks/subagent-stop-hook-notification.ts" "$BACKUP_DIR/"
  echo "✅ Backed up: subagent-stop-hook-notification.ts"
fi

# Backup hook libraries if they exist
if [ -d "$PAI_DIR/hooks/lib" ]; then
  cp -r "$PAI_DIR/hooks/lib" "$BACKUP_DIR/hooks-lib-backup"
  echo "✅ Backed up: hooks/lib/ directory"
fi
```

## 3.3 Backup Settings

```bash
# Always backup settings.json before modification
if [ -f "$PAI_DIR/settings.json" ]; then
  cp "$PAI_DIR/settings.json" "$BACKUP_DIR/settings.json.bak"
  echo "✅ Backed up: settings.json"
fi
```

## 3.4 Backup Observability System (if exists)

```bash
# Backup existing observability system if present
if [ -d "$PAI_DIR/observability" ]; then
  cp -r "$PAI_DIR/observability" "$BACKUP_DIR/observability-backup"
  echo "✅ Backed up: existing observability/ directory"
fi
```

---

# PHASE 4: Installation

**AI Instructions:** Execute installation commands. Use the pack's location to copy files.

## 4.1 Set Variables

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
PACK_DIR="/workspaces/Personal_AI_Infrastructure/Packs/pai-codespaces-adapter"
# If pack is elsewhere, adjust PACK_DIR accordingly
```

## 4.2 Install Hooks

```bash
# Create hooks directory if it doesn't exist
mkdir -p "$PAI_DIR/hooks/lib"

# Copy notification hooks
echo "Installing notification hooks..."
cp "$PACK_DIR/src/hooks/stop-hook-notification.ts" "$PAI_DIR/hooks/"
cp "$PACK_DIR/src/hooks/subagent-stop-hook-notification.ts" "$PAI_DIR/hooks/"

# Copy hook libraries
echo "Installing hook libraries..."
cp "$PACK_DIR/src/hooks/lib/prosody-enhancer.ts" "$PAI_DIR/hooks/lib/"
cp "$PACK_DIR/src/hooks/lib/observability.ts" "$PAI_DIR/hooks/lib/"
cp "$PACK_DIR/src/hooks/lib/metadata-extraction.ts" "$PAI_DIR/hooks/lib/"

echo "✅ Hooks installed"
```

## 4.3 Install Observability System

```bash
# Create observability directory
mkdir -p "$PAI_DIR/observability"

# Copy entire observability system
echo "Installing observability system..."
cp -r "$PACK_DIR/src/observability/"* "$PAI_DIR/observability/"

echo "✅ Observability system installed"
```

## 4.4 Make Scripts Executable

```bash
# Make management scripts executable
chmod +x "$PAI_DIR/observability/scripts/"*.sh

echo "✅ Scripts made executable"
```

## 4.5 Install Dependencies

```bash
# Install server dependencies
echo "Installing server dependencies..."
cd "$PAI_DIR/observability/apps/server"
bun install

# Install client dependencies
echo "Installing client dependencies..."
cd "$PAI_DIR/observability/apps/client"
bun install

echo "✅ Dependencies installed"
```

## 4.6 Update Settings.json

**AI Instructions:** Use the Read and Edit tools to merge `config/settings-hooks.json` into `~/.claude/settings.json`.

**Steps:**
1. Read `$PAI_DIR/settings.json`
2. Read `$PACK_DIR/config/settings-hooks.json`
3. Merge the hooks sections:
   - Add `Stop` hook: `bun run $PAI_DIR/hooks/stop-hook-notification.ts`
   - Add `SubagentStop` hook: `bun run $PAI_DIR/hooks/subagent-stop-hook-notification.ts`
4. Add env variable if not present: `OBSERVABILITY_URL: "http://localhost:4000"`
5. If custom port was specified, update `OBSERVABILITY_URL` accordingly
6. Write merged settings back to `$PAI_DIR/settings.json`

**Important Notes:**
- Do NOT remove existing hooks (especially pai-voice-system hooks)
- Hooks should be ADDED to existing hook arrays, not replaced
- Preserve all other settings unchanged

Example final hooks section:
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun run $PAI_DIR/hooks/stop-hook.ts"
          },
          {
            "type": "command",
            "command": "bun run $PAI_DIR/hooks/stop-hook-notification.ts"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun run $PAI_DIR/hooks/subagent-stop-hook.ts"
          },
          {
            "type": "command",
            "command": "bun run $PAI_DIR/hooks/subagent-stop-hook-notification.ts"
          }
        ]
      }
    ]
  }
}
```

## 4.7 Installation Complete

```bash
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  PAI Codespaces Adapter Installation Complete"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Start the observability server:"
echo "   bash ~/.claude/observability/scripts/start-server.sh"
echo ""
echo "2. Start the dashboard (in another terminal):"
echo "   bash ~/.claude/observability/scripts/start-client.sh"
echo ""
echo "3. Open browser to http://localhost:5173"
echo "   (In Codespaces, use the forwarded HTTPS URL)"
echo ""
echo "4. Test notifications by sending a message to Claude Code"
echo ""
echo "See VERIFY.md for complete verification checklist"
echo "═══════════════════════════════════════════════════════"
```

---

# PHASE 5: Verification

**AI Instructions:** Run verification checks from VERIFY.md and report results.

## 5.1 File Installation Check

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

echo "Verifying installation..."

# Check hooks installed
[ -f "$PAI_DIR/hooks/stop-hook-notification.ts" ] && echo "✅ stop-hook-notification.ts" || echo "❌ stop-hook-notification.ts MISSING"
[ -f "$PAI_DIR/hooks/subagent-stop-hook-notification.ts" ] && echo "✅ subagent-stop-hook-notification.ts" || echo "❌ subagent-stop-hook-notification.ts MISSING"

# Check libraries installed
[ -f "$PAI_DIR/hooks/lib/prosody-enhancer.ts" ] && echo "✅ prosody-enhancer.ts" || echo "❌ prosody-enhancer.ts MISSING"
[ -f "$PAI_DIR/hooks/lib/observability.ts" ] && echo "✅ observability.ts" || echo "❌ observability.ts MISSING"
[ -f "$PAI_DIR/hooks/lib/metadata-extraction.ts" ] && echo "✅ metadata-extraction.ts" || echo "❌ metadata-extraction.ts MISSING"

# Check observability system installed
[ -d "$PAI_DIR/observability/apps/server" ] && echo "✅ Server installed" || echo "❌ Server MISSING"
[ -d "$PAI_DIR/observability/apps/client" ] && echo "✅ Client installed" || echo "❌ Client MISSING"
[ -f "$PAI_DIR/observability/scripts/start-server.sh" ] && echo "✅ Scripts installed" || echo "❌ Scripts MISSING"

# Check node_modules installed
[ -d "$PAI_DIR/observability/apps/server/node_modules" ] && echo "✅ Server dependencies" || echo "⚠️  Server dependencies not installed"
[ -d "$PAI_DIR/observability/apps/client/node_modules" ] && echo "✅ Client dependencies" || echo "⚠️  Client dependencies not installed"
```

## 5.2 Settings.json Hook Registration

```bash
# Check if hooks are registered in settings.json
if grep -q "stop-hook-notification.ts" "$PAI_DIR/settings.json"; then
  echo "✅ Stop hook registered in settings.json"
else
  echo "❌ Stop hook NOT registered - check settings.json"
fi

if grep -q "subagent-stop-hook-notification.ts" "$PAI_DIR/settings.json"; then
  echo "✅ SubagentStop hook registered in settings.json"
else
  echo "❌ SubagentStop hook NOT registered - check settings.json"
fi
```

## 5.3 Start Server (Test)

```bash
# Try starting the server (will fail if already running)
echo "Testing server startup..."
cd "$PAI_DIR/observability/apps/server"

# Start in background for 5 seconds
timeout 5s bun run dev &
SERVER_PID=$!
sleep 2

# Check if server is responding
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo "✅ Server starts successfully and responds to health check"
  kill $SERVER_PID 2>/dev/null
else
  echo "⚠️  Server may not be responding - check logs"
fi
```

## 5.4 Next Steps

Inform the user:
```
Installation verification complete!

For full functional testing, see VERIFY.md which includes:
- Starting server and client
- Testing notifications
- Verifying WebSocket connection
- Testing desktop notifications
- Checking notification history

Run through VERIFY.md to ensure everything works end-to-end.
```

---

# Troubleshooting Installation

## Common Issues

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find and kill process using port 4000
lsof -i :4000
kill -9 <PID>

# Or configure custom port (see Phase 2)
```

### Bun Not Found

**Error:** `bun: command not found`

**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

### Permission Denied

**Error:** `Permission denied` when running scripts

**Solution:**
```bash
# Make scripts executable
chmod +x ~/.claude/observability/scripts/*.sh
```

### Settings.json Merge Failed

**Error:** AI couldn't merge settings.json

**Solution:**
```bash
# Manually add hooks to ~/.claude/settings.json
# Add to "hooks" > "Stop" array:
{
  "type": "command",
  "command": "bun run $PAI_DIR/hooks/stop-hook-notification.ts"
}

# Add to "hooks" > "SubagentStop" array:
{
  "type": "command",
  "command": "bun run $PAI_DIR/hooks/subagent-stop-hook-notification.ts"
}
```

---

# Rollback

If installation fails and you need to rollback:

```bash
# Restore from backup
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
BACKUP_DIR="$PAI_DIR/backups/pai-codespaces-adapter-TIMESTAMP"  # Use your timestamp

# Restore settings.json
cp "$BACKUP_DIR/settings.json.bak" "$PAI_DIR/settings.json"

# Remove installed hooks
rm "$PAI_DIR/hooks/stop-hook-notification.ts"
rm "$PAI_DIR/hooks/subagent-stop-hook-notification.ts"

# Restore hook libraries if you had backups
cp -r "$BACKUP_DIR/hooks-lib-backup/"* "$PAI_DIR/hooks/lib/"

# Remove observability system
rm -rf "$PAI_DIR/observability"

# Restore old observability if you had one
if [ -d "$BACKUP_DIR/observability-backup" ]; then
  cp -r "$BACKUP_DIR/observability-backup" "$PAI_DIR/observability"
fi

echo "Rollback complete"
```

---

# Support

For issues during installation:

1. Check this INSTALL.md troubleshooting section
2. Review VERIFY.md for diagnostic commands
3. Submit issue to PAI repository with:
   - Installation phase where failure occurred
   - Error messages (exact text)
   - Output of system analysis (Phase 1)
   - OS and environment details

---

**End of Installation Guide**
