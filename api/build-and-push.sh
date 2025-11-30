#!/bin/bash

# Build and push Docker image to GitHub Container Registry
# Usage: ./build-and-push.sh [tag]
# Example: ./build-and-push.sh latest

set -e

IMAGE_NAME="ghcr.io/absinthelabs/absinthe-auto-forge-be"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${TAG}"
PLATFORM="linux/amd64"

echo "🔨 Building Docker image for AMD64: ${FULL_IMAGE}"

# Build the image for AMD64 platform
docker build --platform="${PLATFORM}" -t "${FULL_IMAGE}" .

echo "✅ Build complete!"
echo ""
echo "To push the image, run:"
echo "  docker push ${FULL_IMAGE}"
echo ""
echo "Or to push now, run:"
echo "  docker push ${FULL_IMAGE}"

