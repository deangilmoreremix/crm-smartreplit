#!/bin/bash
# Script to record demo videos with error handling and retry logic

set -e

RECORDING_DIR="/tmp/recordings"
OUTPUT_DIR="/workspace/crm-smartreplit/public/videos/features"
MAX_RETRIES=3

echo "Starting video recording process..."

# Create directories
mkdir -p "$RECORDING_DIR" "$OUTPUT_DIR"

# Function to record a video
record_video() {
    local video_name=$1
    local script=$2
    local retry=0
    
    echo "Recording $video_name..."
    
    while [ $retry -lt $MAX_RETRIES ]; do
        echo "Attempt $((retry + 1)) of $MAX_RETRIES"
        
        if node "$script" 2>&1; then
            echo "✓ Successfully recorded $video_name"
            
            # Copy to output directory with retry logic
            local output_path="$OUTPUT_DIR/${video_name}.mp4"
            cp "$RECORDING_DIR/video.mp4" "$output_path" 2>/dev/null || \
            cp "$RECORDING_DIR/${video_name}.mp4" "$output_path" 2>/dev/null || \
            echo "Warning: Could not copy video to output directory"
            
            return 0
        else
            echo "✗ Recording failed, retrying..."
            retry=$((retry + 1))
            sleep 2
        fi
    done
    
    echo "✗ Failed to record $video_name after $MAX_RETRIES attempts"
    return 1
}

# Record Contact Enrichment
echo "=== Recording Contact Enrichment Video ==="
record_video "contact-enrichment" "scripts/record-contact-enrichment.js" || true

# Record Bulk Operations
echo "=== Recording Bulk Operations Video ==="
record_video "bulk-operations" "scripts/record-bulk-operations.js" || true

# Record Lead Scoring
echo "=== Recording Lead Scoring Video ==="
record_video "lead-scoring" "scripts/record-lead-scoring.js" || true

echo "=== Video Recording Complete ==="

# List recorded files
echo ""
echo "Recorded videos:"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null || echo "No videos found in output directory"
