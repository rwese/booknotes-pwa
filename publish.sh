#!/bin/bash

# Publish script for booknotes-pwa to S3 compatible bucket
# Uses mc (minio client) with pre-configured aliases

# Configuration
MC_ALIAS="booky"
S3_ENDPOINT="https://s3.severed.nope.at"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-KDKF3RS6LS6AYEAU4ABX}"
S3_SECRET_KEY="${S3_SECRET_KEY:-5AUnlN7U1cGgVb9lCG+TScoppg8FAjkNQ6XawPYO}"
DIST_DIR="dist"

set -e

echo "=== Publishing booknotes-pwa to S3 ==="

# Check mc is available
if ! command -v mc &> /dev/null; then
    echo "Error: mc (minio client) is not installed"
    exit 1
fi

# Configure mc alias if not already set
if ! mc alias list | grep -q "^${MC_ALIAS}"; then
    echo "Configuring mc alias '${MC_ALIAS}'..."
    mc alias set "${MC_ALIAS}" "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}"
fi

# Build the project
echo "Building project..."
npm run build

# Sync with mc
echo "Uploading to ${MC_ALIAS}..."
mc cp --recursive "$DIST_DIR" "${MC_ALIAS}/booky/"

echo "=== Publish complete ==="
