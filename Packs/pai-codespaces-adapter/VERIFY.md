# Verification Checklist: PAI Codespaces Adapter

Post-installation verification for `pai-codespaces-adapter`.

Complete all sections to ensure the pack is working correctly.

---

## Manual Checks

### File Installation

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# Verify all files are in place
echo "Checking installation files..."

# Hooks
[ -f "$PAI_DIR/hooks/stop-hook-notification.ts" ] && echo "✅ stop-hook-notification.ts" || echo "❌ MISSING"
[ -f "$PAI_DIR/hooks/subagent-stop-hook-notification.ts" ] && echo "✅ subagent-stop-hook-notification.ts" || echo "❌ MISSING"

# Hook libraries
[ -f "$PAI_DIR/hooks/lib/prosody-enhancer.ts" ] && echo "✅ prosody-enhancer.ts" || echo "❌ MISSING"
[ -f "$PAI_DIR/hooks/lib/observability.ts" ] && echo "✅ observability.ts" || echo "❌ MISSING"
[ -f "$PAI_DIR/hooks/lib/metadata-extraction.ts" ] && echo "✅ metadata-extraction.ts" || echo "❌ MISSING"

# Observability system
[ -d "$PAI_DIR/observability/apps/server" ] && echo "✅ Server directory" || echo "❌ MISSING"
[ -d "$PAI_DIR/observability/apps/client" ] && echo "✅ Client directory" || echo "❌ MISSING"
[ -f "$PAI_DIR/observability/scripts/start-server.sh" ] && echo "✅ start-server.sh" || echo "❌ MISSING"
[ -f "$PAI_DIR/observability/scripts/start-client.sh" ] && echo "✅ start-client.sh" || echo "❌ MISSING"

# Dependencies
[ -d "$PAI_DIR/observability/apps/server/node_modules" ] && echo "✅ Server dependencies" || echo "⚠️  Run: cd $PAI_DIR/observability/apps/server && bun install"
[ -d "$PAI_DIR/observability/apps/client/node_modules" ] && echo "✅ Client dependencies" || echo "⚠️  Run: cd $PAI_DIR/observability/apps/client && bun install"
```

**Expected:** All items should show ✅

---

### Settings.json Hook Registration

```bash
# Check hooks are registered
grep -q "stop-hook-notification.ts" "$PAI_DIR/settings.json" && echo "✅ Stop hook registered" || echo "❌ Stop hook NOT registered"
grep -q "subagent-stop-hook-notification.ts" "$PAI_DIR/settings.json" && echo "✅ SubagentStop hook registered" || echo "❌ SubagentStop hook NOT registered"

# Show hook configuration
echo ""
echo "Current hook configuration:"
cat "$PAI_DIR/settings.json" | grep -A 20 '"hooks"'
```

**Expected:** Both hooks should be registered in settings.json

---

### Script Permissions

```bash
# Verify scripts are executable
ls -lh "$PAI_DIR/observability/scripts/"*.sh

# Should show -rwxr-xr-x (executable bit set)
```

**Expected:** All .sh files should have execute permission (x flag)

---

### Port Availability

```bash
# Check if required ports are available
lsof -i :4000 && echo "⚠️  Port 4000 in use" || echo "✅ Port 4000 available"
lsof -i :5173 && echo "⚠️  Port 5173 in use (may auto-increment)" || echo "✅ Port 5173 available"
```

**Expected:** Ports should be available (or note the running services)

---

### Environment Variables

```bash
# Check environment configuration
echo "PAI_DIR: ${PAI_DIR:-NOT SET}"
echo "DA: ${DA:-NOT SET}"
echo "TIME_ZONE: ${TIME_ZONE:-NOT SET}"
echo "OBSERVABILITY_URL: ${OBSERVABILITY_URL:-NOT SET (will default to http://localhost:4000)}"
```

**Expected:**
- PAI_DIR should be set (usually ~/.claude)
- DA should be your agent name (e.g., "Kai")
- TIME_ZONE is recommended but optional

---

## Functional Tests

### Test 1: Server Startup

```bash
# Start the observability server
cd ~/.claude/observability/apps/server
bun run dev
```

**Expected Output:**
```
Observability server running on port 4000
WebSocket endpoint: ws://localhost:4000/stream
```

**Verification:**
- [ ] Server starts without errors
- [ ] Console shows "running on port 4000"
- [ ] No TypeScript errors in output

**Keep server running for remaining tests.**

---

### Test 2: Server Health Check

```bash
# In a new terminal, check server health
curl http://localhost:4000/health

# Should return: {"status":"ok"}
```

**Verification:**
- [ ] Returns JSON with status "ok"
- [ ] HTTP status code 200

---

### Test 3: Recent Events Endpoint

```bash
# Fetch recent events
curl http://localhost:4000/events/recent?limit=10

# Should return JSON array of events
```

**Verification:**
- [ ] Returns valid JSON array
- [ ] No 404 or 500 errors

---

### Test 4: Client Build and Startup

```bash
# In a new terminal, start the dashboard client
cd ~/.claude/observability/apps/client
bun run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Verification:**
- [ ] Vite builds without errors
- [ ] Shows localhost URL
- [ ] No TypeScript errors

**Keep client running for remaining tests.**

---

### Test 5: Browser Connection

1. Open browser to `http://localhost:5173`
2. Check dashboard loads

**Verification:**
- [ ] Page loads without errors
- [ ] Dashboard UI is visible
- [ ] Connection status shows "Connected" (green indicator)
- [ ] No console errors in browser dev tools

**In Codespaces:**
- Use the forwarded HTTPS URL (Ports tab)
- Port 5173 should be auto-forwarded

---

### Test 6: WebSocket Connection

In browser dev tools console:
```javascript
// Check WebSocket connection
// Should see WebSocket connection in Network tab (WS filter)
```

**Verification:**
- [ ] WebSocket shows "Connected" status in dashboard
- [ ] Browser console shows no WebSocket errors
- [ ] Network tab shows WS connection to ws://localhost:4000/stream

---

### Test 7: Manual Notification Test

```bash
# Send a test notification directly to the server
curl -X POST http://localhost:4000/notification \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "agent_response",
    "agent_name": "Kai",
    "message": "Test notification - Installation verification",
    "emotion": "calm",
    "emotional_markers": "thoughtful",
    "priority": "medium",
    "session_id": "test-session",
    "timestamp": "'$(date -Iseconds)'"
  }'
```

**Verification:**
- [ ] Notification toast appears in browser dashboard
- [ ] Shows "Test notification - Installation verification" message
- [ ] Has calm emotion styling (blue gradient)
- [ ] Shows "Kai" as agent name
- [ ] Auto-dismisses after 5 seconds (medium priority)

---

### Test 8: Desktop Notification Permission

In browser:
1. Grant notification permission when prompted
2. If not prompted, click a notification to trigger permission request

**Verification:**
- [ ] Browser requests notification permission
- [ ] Permission granted successfully
- [ ] Future notifications should show as desktop notifications

---

### Test 9: Live Agent Notification Test

1. Keep dashboard open in browser
2. Send a message to Claude Code (the AI agent you're talking to)
3. Wait for response to complete

**Verification:**
- [ ] Notification appears in dashboard after agent responds
- [ ] Message content is extracted correctly
- [ ] Emotion detection works (check styling matches tone)
- [ ] Desktop notification appears (if permission granted)
- [ ] Notification is added to history

**Note:** This requires Claude Code to be running and the hooks to be active.

---

### Test 10: Subagent Notification Test

In Claude Code, spawn a subagent using the Task tool:
```
Can you use the Task tool to spawn an Explore agent to search for TypeScript files?
```

**Verification:**
- [ ] Subagent completion triggers notification
- [ ] Agent name is detected (shows "Explore" or subagent type)
- [ ] Notification_type is "subagent_response"
- [ ] Personality field is populated

---

### Test 11: Notification History

1. Send 3-5 test notifications (manual or via agent)
2. Refresh browser page (Ctrl+R or Cmd+R)
3. Check notifications persist

**Verification:**
- [ ] Notifications are still visible after refresh
- [ ] History is stored in localStorage (check browser dev tools > Application > localStorage)
- [ ] Old notifications auto-dismiss when page reloads
- [ ] Recent notifications remain visible

---

### Test 12: Notification Filtering and Priority

Send notifications with different priorities:
```bash
# High priority (should NOT auto-dismiss)
curl -X POST http://localhost:4000/notification \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"agent_response","agent_name":"Kai","message":"HIGH PRIORITY TEST","emotion":"urgent","priority":"high","timestamp":"'$(date -Iseconds)'"}'

# Low priority (fast auto-dismiss)
curl -X POST http://localhost:4000/notification \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"agent_response","agent_name":"Kai","message":"Low priority test","emotion":"calm","priority":"low","timestamp":"'$(date -Iseconds)'"}'
```

**Verification:**
- [ ] High priority notification has red border
- [ ] High priority does NOT auto-dismiss
- [ ] Low priority has green border
- [ ] Low priority auto-dismisses quickly
- [ ] Can manually dismiss by clicking

---

### Test 13: WebSocket Reconnection

1. Stop the server (Ctrl+C in server terminal)
2. Check dashboard shows "Disconnected" status
3. Restart server: `cd ~/.claude/observability/apps/server && bun run dev`
4. Watch dashboard reconnect automatically

**Verification:**
- [ ] Dashboard detects disconnection (status changes to "Disconnected")
- [ ] Reconnection happens automatically (within 5-10 seconds)
- [ ] Status changes back to "Connected"
- [ ] No manual refresh needed

---

### Test 14: Multiple Browser Tabs

1. Open dashboard in 2-3 browser tabs
2. Send a test notification
3. Verify all tabs receive it

**Verification:**
- [ ] All open tabs receive the same notification simultaneously
- [ ] Each tab maintains independent notification state
- [ ] No conflicts or duplicate issues

---

### Test 15: Codespaces Port Forwarding (if applicable)

**In GitHub Codespaces only:**

1. Open Ports tab (bottom panel)
2. Verify ports 4000 and 5173 are forwarded
3. Click the forwarded URL for port 5173
4. Dashboard should load via HTTPS

**Verification:**
- [ ] Port 4000 is forwarded (Private or Public)
- [ ] Port 5173 is forwarded (Public recommended)
- [ ] Can access dashboard via forwarded HTTPS URL
- [ ] WebSocket connection works over forwarded port

---

## Diagnostic Commands

### Check Hook Execution

```bash
# Test hook directly (simulates agent response)
export PAI_DIR="$HOME/.claude"
export DA="Kai"
export TIME_ZONE="America/Toronto"

bun run ~/.claude/hooks/stop-hook-notification.ts

# Should execute without errors
```

**Expected:** Hook runs without errors (may show "no transcript found" if not in active session)

---

### Check Server Logs

```bash
# View server console output
# Look for:
# - "Observability server running on port 4000"
# - "WebSocket client connected"
# - "POST /notification" requests

# Check for errors:
grep -i error ~/.claude/observability/apps/server/logs/*.log 2>/dev/null || echo "No error logs found"
```

---

### Check Client Console

Open browser dev tools (F12) and check Console tab for:
- [ ] No errors or warnings
- [ ] WebSocket connection messages
- [ ] Notification received messages

---

### Check Settings Merge

```bash
# View full hook configuration
cat ~/.claude/settings.json | jq '.hooks'

# Should show both stop-hook-notification.ts hooks
```

---

## Performance Checks

### Notification Latency

Time from agent response to notification appearance:
- [ ] < 100ms (excellent)
- [ ] < 500ms (good)
- [ ] < 1s (acceptable)
- [ ] > 1s (investigate WebSocket or server issues)

### Resource Usage

```bash
# Check server resource usage
ps aux | grep "bun.*observability"

# Should use minimal CPU when idle (<5%)
```

---

## Cleanup (After Verification)

```bash
# Stop server (Ctrl+C in server terminal)
# Stop client (Ctrl+C in client terminal)

# Optionally, clear test notifications from localStorage
# (Browser dev tools > Application > localStorage > Clear)
```

---

## Troubleshooting

### Notifications Not Appearing

**Check:**
1. Server is running: `curl http://localhost:4000/health`
2. Client is running: Open http://localhost:5173
3. WebSocket connected: Dashboard shows "Connected"
4. Hooks are registered: `grep "stop-hook-notification.ts" ~/.claude/settings.json`
5. Agent is actually responding (not just user messages)

### WebSocket Connection Fails

**Check:**
1. Server running on correct port: `lsof -i :4000`
2. No firewall blocking: Try `telnet localhost 4000`
3. OBSERVABILITY_URL matches server port
4. In Codespaces, port is forwarded and Public

### Desktop Notifications Not Working

**Check:**
1. Browser permission granted: Settings > Site Settings > Notifications
2. OS notifications enabled (System Preferences / Settings)
3. Not in Do Not Disturb mode
4. Try different browser (Chrome/Firefox/Edge)

### Hooks Not Triggering

**Check:**
1. settings.json syntax is valid JSON: `cat ~/.claude/settings.json | jq`
2. Hooks array is correct format
3. $PAI_DIR environment variable is set correctly
4. Hook files are executable: `ls -lh ~/.claude/hooks/*.ts`

---

## Success Criteria

All items below should be ✅:

**Installation:**
- [ ] All files copied to correct locations
- [ ] Dependencies installed (node_modules present)
- [ ] Scripts are executable
- [ ] Hooks registered in settings.json

**Server:**
- [ ] Starts without errors
- [ ] Health endpoint responds
- [ ] WebSocket accepts connections
- [ ] Receives and broadcasts notifications

**Client:**
- [ ] Builds without errors
- [ ] Loads in browser
- [ ] WebSocket connects successfully
- [ ] Displays notifications in real-time

**Functional:**
- [ ] Manual test notification appears
- [ ] Live agent response triggers notification
- [ ] Subagent completion triggers notification
- [ ] Desktop notifications work (with permission)
- [ ] Notification history persists across refresh
- [ ] Priority levels affect auto-dismiss behavior
- [ ] WebSocket reconnection works after server restart

**Codespaces (if applicable):**
- [ ] Ports are forwarded correctly
- [ ] Dashboard accessible via HTTPS URL
- [ ] WebSocket works over forwarded connection

---

## Next Steps

Once verification is complete:

1. **Daily Use:** Keep server and client running while working
2. **Auto-Start:** Consider adding to shell startup or devcontainer.json
3. **Customization:** Modify NotificationToast.vue for custom styling
4. **Integration:** Works alongside pai-voice-system if installed

---

**End of Verification Checklist**

If all checks pass, installation is successful! 🎉
