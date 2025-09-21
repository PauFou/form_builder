#!/bin/bash

# Kill any existing Next.js dev servers
echo "Stopping existing dev servers..."
pkill -f "next dev" || true
pkill -f "turbo dev" || true

# Wait a moment for processes to stop
sleep 2

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf apps/builder/.next
rm -rf apps/marketing/.next
rm -rf apps/runtime-demo/.next

# Reinstall dependencies to ensure proper linking
echo "Reinstalling dependencies..."
pnpm install

# Start the dev server
echo "Starting dev server..."
pnpm dev