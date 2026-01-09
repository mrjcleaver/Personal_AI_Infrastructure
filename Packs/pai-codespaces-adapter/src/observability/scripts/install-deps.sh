#!/bin/bash
# Install dependencies for PAI observability system

SCRIPT_DIR="$(dirname "$0")"

echo "Installing PAI observability dependencies..."
echo ""

# Install server dependencies
echo "Installing server dependencies..."
cd "$SCRIPT_DIR/../apps/server" || exit 1
bun install
echo "✅ Server dependencies installed"
echo ""

# Install client dependencies
echo "Installing client dependencies..."
cd "$SCRIPT_DIR/../apps/client" || exit 1
bun install
echo "✅ Client dependencies installed"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "  Dependencies installed successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Start server: bash $SCRIPT_DIR/start-server.sh"
echo "2. Start client: bash $SCRIPT_DIR/start-client.sh"
echo ""
