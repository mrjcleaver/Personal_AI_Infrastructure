#!/bin/bash
# Start the PAI observability server

cd "$(dirname "$0")/../apps/server" || exit 1

echo "Starting PAI observability server on port 4000..."
echo "WebSocket endpoint: ws://localhost:4000/stream"
echo ""
echo "Press Ctrl+C to stop"
echo ""

bun run dev
