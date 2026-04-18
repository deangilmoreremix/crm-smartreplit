# Demo Video Recording Pipeline

## Overview
This pipeline automates the recording of three demo videos for the CRM SmartReplit landing page.

## Videos to Record
1. **contact-enrichment.mp4** - Contact Enrichment Workflow
2. **bulk-operations.mp4** - Bulk Operations Demonstration  
3. **lead-scoring.mp4** - Lead Scoring Visualization

## Specifications
- Resolution: 1920x1080 (Full HD)
- Format: MP4 with H.264 codec
- Target size: <5MB per video
- Duration: 30-60 seconds
- Frame rate: 30fps

## Usage

### Quick Record All Videos
```bash
./scripts/record-demo-videos.sh
```

### Individual Steps

1. **Setup Playwright**
   ```bash
   npx playwright install chromium
   ```

2. **Record Videos**
   ```bash
   bash scripts/record-videos.sh
   ```

3. **Optimize Videos**
   ```bash
   bash scripts/optimize-videos.sh
   ```

4. **Verify Videos**
   ```bash
   node scripts/verify-videos.js
   ```

### Run Tests with Video Recording
```bash
npx playwright test tests/contact-enrichment-video.test.js --video
npx playwright test tests/bulk-operations-video.test.js --video
npx playwright test tests/lead-scoring-video.test.js --video
```

## Video Locations
- Input: `/tmp/recordings/`
- Output: `/workspace/crm-smartreplit/public/videos/features/`

## Quality Checks
- All videos must be under 5MB
- Videos must demonstrate key UI features
- Videos must be embeddable in landing page

## Troubleshooting
- If recording fails, check browser console output
- Increase timeout in test files if needed
- Ensure sufficient disk space in `/tmp` directory
