#!/bin/bash
# Script to optimize videos using ffmpeg

set -e

INPUT_DIR="/workspace/crm-smartreplit/public/videos/features"
OUTPUT_DIR="/workspace/crm-smartreplit/public/videos/features"
TEMP_DIR="/tmp/video-optimized"

mkdir -p "$TEMP_DIR"

echo "Optimizing videos..."

for video in "$INPUT_DIR"/*.mp4; do
    if [ -f "$video" ]; then
        filename=$(basename "$video")
        echo "Optimizing $filename..."
        
        # Use ffmpeg to compress video
        ffmpeg -y -i "$video" \
            -c:v libx264 \
            -preset slow \
            -crf 28 \
            -c:a aac \
            -b:a 128k \
            -vf "scale=1920:-2" \
            -movflags +faststart \
            "$TEMP_DIR/$filename" 2>/dev/null
        
        # Check file size
        original_size=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video" 2>/dev/null || echo "0")
        optimized_size=$(stat -f%z "$TEMP_DIR/$filename" 2>/dev/null || stat -c%s "$TEMP_DIR/$filename" 2>/dev/null || echo "0")
        
        # If optimized is larger or same, use original
        if [ "$optimized_size" -ge "$original_size" ]; then
            cp "$video" "$OUTPUT_DIR/$filename"
            echo "  → Used original (size: $((original_size / 1024 / 1024)) MB)"
        else
            mv "$TEMP_DIR/$filename" "$OUTPUT_DIR/$filename"
            echo "  → Optimized (size: $((optimized_size / 1024 / 1024)) MB)"
        fi
    fi
done

echo ""
echo "Optimized videos:"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null

# Cleanup
rm -rf "$TEMP_DIR"
