# PAI Observability System

Browser-based notification dashboard for Personal AI Infrastructure in headless environments.

---

## Overview

The PAI Observability System provides real-time browser notifications for Claude Code agent responses in environments without audio output (Codespaces, remote servers, Docker, WSL).

**Components:**
- **Server** - Bun HTTP + WebSocket server (port 4000)
- **Client** - Vue 3 + Vite dashboard (port 5173)
- **Hooks** - Claude Code event hooks that send notifications

---

## Architecture

```
Claude Code Agent
    ↓
Stop/SubagentStop Hook
    ↓
HTTP POST to /notification
    ↓
Observability Server (Bun + WebSocket)
    ↓
WebSocket Broadcast
    ↓
Browser Clients (Vue Dashboard)
    ↓
- Notification Toast
- Desktop Notification
- Audio Beep
- 7-day History
```

---

## Quick Start

### 1. Install Dependencies

```bash
bash scripts/install-deps.sh
```

Or manually:
```bash
cd apps/server && bun install
cd apps/client && bun install
```

### 2. Start Server

```bash
bash scripts/start-server.sh
```

Server will run on **http://localhost:4000**

Endpoints:
- `GET /health` - Health check
- `POST /notification` - Receive notifications from hooks
- `GET /events/recent?limit=100` - Fetch recent events
- `WS /stream` - WebSocket for real-time streaming

### 3. Start Client

```bash
bash scripts/start-client.sh
```

Dashboard will run on **http://localhost:5173**

In Codespaces, use the forwarded HTTPS URL from the Ports tab.

### 4. Test Notification

```bash
curl -X POST http://localhost:4000/notification \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "agent_response",
    "agent_name": "Kai",
    "message": "Test notification!",
    "emotion": "excited",
    "priority": "high"
  }'
```

Should appear in dashboard immediately.

---

## Configuration

### Server Port

Edit `apps/server/src/index.ts`:
```typescript
const server = Bun.serve({
  port: 4000, // Change this
  // ...
});
```

Don't forget to update hooks to use the new port:
- Update `OBSERVABILITY_URL` in `~/.claude/settings.json`

### Client Port

Edit `apps/client/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5173, // Change this
  },
});
```

---

## Development

### Server (Bun + TypeScript)

**Location:** `apps/server/`

**Files:**
- `src/index.ts` - Main HTTP + WebSocket server
- `src/types.ts` - TypeScript interfaces
- `src/file-ingest.ts` - Event file watcher (optional)
- `package.json` - Dependencies (currently none)

**Run:**
```bash
cd apps/server
bun run dev  # With --watch for auto-reload
bun run start  # Production mode
```

**API Endpoints:**

#### GET /health
Health check endpoint
```bash
curl http://localhost:4000/health
# Returns: {"status":"ok"}
```

#### POST /notification
Receive notification from hooks
```bash
curl -X POST http://localhost:4000/notification \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "agent_response",
    "agent_name": "Kai",
    "message": "Hello!",
    "emotion": "calm",
    "priority": "medium"
  }'
```

**Payload Schema:**
```typescript
{
  notification_type: 'agent_response' | 'subagent_response'
  agent_name: string  // e.g., "Kai", "Explore"
  message: string  // Main notification text
  emotion?: string  // e.g., "calm", "excited", "urgent"
  emotional_markers?: string  // e.g., "thoughtful", "energetic"
  personality?: string  // e.g., "pai", "researcher"
  priority: 'low' | 'medium' | 'high'
  session_id?: string
  timestamp: string  // ISO 8601 format
}
```

#### GET /events/recent?limit=N
Fetch recent events (from file watcher)
```bash
curl http://localhost:4000/events/recent?limit=10
```

#### WS /stream
WebSocket endpoint for real-time event streaming

Connect from client:
```javascript
const ws = new WebSocket('ws://localhost:4000/stream');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle notification
};
```

---

### Client (Vue 3 + Vite)

**Location:** `apps/client/`

**Files:**
- `src/App.vue` - Main app component
- `src/main.ts` - Entry point
- `src/components/NotificationToast.vue` - Toast component
- `src/composables/useNotifications.ts` - Notification logic
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - TailwindCSS config
- `package.json` - Dependencies

**Run:**
```bash
cd apps/client
bun run dev  # Development mode with HMR
bun run build  # Production build (outputs to dist/)
bun run preview  # Preview production build
```

**Tech Stack:**
- Vue 3.5+ (Composition API)
- Vite 7+ (build tool, dev server)
- TailwindCSS 3.4+ (styling)
- lucide-vue-next (icons)
- TypeScript

**Key Components:**

#### NotificationToast.vue
- Displays notification toasts
- Emotion-based styling (calm = blue, excited = orange, urgent = red)
- Priority-based borders (high = red, medium = orange, low = green)
- Auto-dismiss logic (high priority never dismisses, medium = 5s, low = 3s)
- Click to dismiss
- Animated entrance/exit

#### useNotifications.ts Composable
- WebSocket connection management
- Notification state (reactive)
- localStorage persistence (7-day retention)
- Desktop notification API integration
- Audio beep generation (Web Audio API)
- Auto-reconnection with exponential backoff

**Customization:**

Change notification styling in `NotificationToast.vue`:
```vue
<template>
  <!-- Modify emotion-based gradients -->
  <div :class="emotionClass">
    <!-- ... -->
  </div>
</template>

<script setup>
const emotionClass = computed(() => {
  switch (emotion.value) {
    case 'excited':
      return 'bg-gradient-to-r from-orange-50 to-amber-50'
    // Add custom emotions here
  }
});
</script>
```

---

## File Ingestion (Optional)

**Location:** `apps/server/src/file-ingest.ts`

The file watcher monitors Claude Code event files and broadcasts them via WebSocket.

**What it watches:**
- `~/.claude/history/raw-outputs/YYYY-MM/YYYY-MM-DD_all-events.jsonl`
- `~/.claude/agent-sessions.json`

**What it provides:**
- Real-time event streaming
- TodoWrite event detection
- Agent name enrichment

**Note:** This is separate from the notification system. Notifications come directly from hooks via HTTP POST, not from file watching.

---

## Deployment

### Development

```bash
# Terminal 1: Server
cd apps/server && bun run dev

# Terminal 2: Client
cd apps/client && bun run dev
```

### Production

**Option 1: Build client and serve statically**
```bash
cd apps/client
bun run build

# Serve dist/ with any static file server
# Or integrate into server.ts to serve from Bun
```

**Option 2: Run both as background services**
```bash
# Start server in background
cd apps/server && bun run start &

# Build and serve client
cd apps/client && bun run build && bun run preview &
```

**Option 3: Codespaces devcontainer.json**
```json
{
  "postCreateCommand": "cd ~/.claude/observability && bash scripts/install-deps.sh",
  "postStartCommand": "cd ~/.claude/observability/apps/server && bun run start &"
}
```

---

## Environment Variables

**Server:**
- `PORT` - Server port (default: 4000)
- `PAI_DIR` - Path to ~/.claude directory (used by file watcher)

**Client:**
- No environment variables needed (connects to localhost:4000 by default)

**Hooks:**
- `OBSERVABILITY_URL` - Server URL (default: http://localhost:4000)
- `PAI_DIR` - Path to ~/.claude
- `DA` - Agent name (e.g., "Kai")
- `TIME_ZONE` - Timezone for timestamps

---

## Troubleshooting

### Server won't start

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill it
kill -9 <PID>

# Or change server port in src/index.ts
```

### Client can't connect to server

**Error:** WebSocket connection failed

**Check:**
1. Server is running: `curl http://localhost:4000/health`
2. No firewall blocking port 4000
3. In Codespaces, port is forwarded (Ports tab)
4. Client is trying to connect to correct URL

**Solution:**
```bash
# Check server logs for errors
cd apps/server && bun run dev

# Check browser console for WebSocket errors
# Verify WebSocket URL in useNotifications.ts
```

### Notifications not appearing

**Check:**
1. Server received notification: Check server console for `POST /notification`
2. WebSocket is connected: Dashboard shows "Connected" status
3. Browser console shows no errors
4. Notification payload is valid JSON

**Test manually:**
```bash
curl -X POST http://localhost:4000/notification \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"agent_response","agent_name":"Test","message":"Hello","priority":"medium"}'
```

### Desktop notifications not working

**Check:**
1. Browser permission granted (Settings > Notifications)
2. OS notifications enabled
3. Not in Do Not Disturb mode
4. Try different browser

---

## API Reference

### Notification Payload

```typescript
interface NotificationEvent {
  notification_type: 'agent_response' | 'subagent_response';
  agent_name: string;
  message: string;
  emotion?: string;
  emotional_markers?: string;
  personality?: string;
  priority: 'low' | 'medium' | 'high';
  session_id?: string;
  timestamp: string;
}
```

### Hook Event

```typescript
interface HookEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  agent_name?: string;
  [key: string]: any;
}
```

### Todo Item

```typescript
interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}
```

---

## Performance

**Server:**
- Memory: ~50MB (Bun runtime)
- CPU: <1% idle, <5% active
- Latency: <10ms for HTTP POST
- WebSocket: <1ms broadcast

**Client:**
- Initial load: ~500ms (Vue + Vite dev)
- Notification render: <50ms
- Memory: ~30MB (browser tab)

**Scalability:**
- Supports multiple browser clients
- Broadcasts to all connected clients simultaneously
- In-memory storage: Max 1000 events
- localStorage: 7-day retention (~100KB per week)

---

## Security

**Current State:**
- No authentication (localhost only)
- No HTTPS (use reverse proxy if needed)
- No rate limiting
- CORS enabled for all origins

**For Production:**
- Add authentication token
- Use HTTPS reverse proxy (nginx, Caddy)
- Implement rate limiting
- Restrict CORS to specific origins
- Validate notification payloads

---

## Contributing

To modify the observability system:

1. Make changes to server (apps/server/src/) or client (apps/client/src/)
2. Test locally with `bun run dev`
3. Update this README if API changes
4. Submit PR to main PAI repository

---

## License

Same as Personal AI Infrastructure (see main repository).

---

## Credits

Created by mrjcleaver for the Personal AI Infrastructure project.

Adapted from pai-voice-system for headless Linux environments.
