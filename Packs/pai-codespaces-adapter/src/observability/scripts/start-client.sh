#!/bin/bash
# Start the PAI observability dashboard (Vue client)

cd "$(dirname "$0")/../apps/client" || exit 1

echo "Starting PAI observability dashboard..."
echo "Dashboard will be available at:"
echo "  http://localhost:5173"
echo ""
echo "In Codespaces, use the forwarded HTTPS URL from the Ports tab"
echo ""
echo "Press Ctrl+C to stop"
echo ""

bun run dev
