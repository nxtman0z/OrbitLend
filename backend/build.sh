#!/bin/bash
# Render build script for OrbitLend Backend

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npx tsc

echo "Build completed successfully!"
echo "Files generated in dist/ directory:"
ls -la dist/
