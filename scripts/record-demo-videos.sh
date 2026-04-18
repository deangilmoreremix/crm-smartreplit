#!/bin/bash
# Complete demo video recording pipeline

set -e

echo "=========================================="
echo "  CRM SmartReplit Demo Video Recorder"
echo "=========================================="
echo ""

# Step 1: Check if Playwright is installed
echo "Step 1: Checking Playwright installation..."
if ! command -v npx &> /dev/null; then
    echo "Installing Playwright..."
    npm install playwright
    npx playwright install chromium
else
    echo "✓ Playwright is available"
fi

# Step 2: Ensure test data is seeded
echo ""
echo "Step 2: Ensuring test data is available..."
# Add any setup commands here if needed

# Step 3: Record videos
echo ""
echo "Step 3: Recording demo videos..."
bash scripts/record-videos.sh

# Step 4: Optimize videos
echo ""
echo "Step 4: Optimizing videos..."
bash scripts/optimize-videos.sh

# Step 5: Verify videos
echo ""
echo "Step 5: Validating videos..."
node scripts/verify-videos.js

echo ""
echo "=========================================="
echo "  Recording Pipeline Complete"
echo "=========================================="

# Display final results
echo ""
echo "Final video files:"
ls -lh public/videos/features/*.mp4 2>/dev/null || echo "No videos found"
