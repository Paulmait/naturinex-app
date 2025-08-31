#!/bin/bash

echo "=== Naturinex Server Startup Script ==="
echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la

# Check if we're in the wrong directory
if [ -d "src/server" ]; then
    echo "ERROR: Phantom src/server directory detected!"
    echo "Removing phantom directory..."
    rm -rf src/server
fi

# Ensure we're starting from the right place
if [ -f "server/index.js" ]; then
    echo "✓ Found server/index.js"
    cd server
    echo "Changed to server directory: $(pwd)"
    echo "Starting server..."
    node index.js
elif [ -f "index.js" ] && [ -d "../server" ]; then
    echo "We're already in a subdirectory, going to server..."
    cd ../server
    node index.js
elif [ -f "index.js" ]; then
    echo "Found index.js in current directory"
    node index.js
else
    echo "ERROR: Cannot find server files!"
    echo "Directory structure:"
    find . -name "index.js" -type f | head -10
    exit 1
fi