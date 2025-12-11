# SmartCRM Demo Generator

Automated demo recording system using Puppeteer to create professional GIFs and videos of SmartCRM features.

## 🎬 Quick Start

### Generate All Demos
```bash
tsx scripts/demos/generate-all.ts
```

This will run all feature demos sequentially and save MP4 videos to `demos/output/`

## 📁 Output

All generated demos are saved to `demos/output/` directory:
- **MP4 videos**: High-quality screen recordings
- **GIF files**: Optimized animated previews (when using GIF conversion)

## ⚙️ Configuration

### Environment Variables

Set the app URL before running demos:

```bash
# Development (default)
export APP_URL=http://localhost:5000

# Production
export APP_URL=https://app.smartcrm.vip
```

### Recording Options

Edit the recorder options in each demo script:

```typescript
const recorder = await createRecorder({
  width: 1920,        // Video width
  height: 1080,       // Video height
  fps: 30,            // Frames per second
  quality: 80,        // Quality (1-100)
  outputDir: 'demos/output'  // Output directory
});
```

## 🛠️ Creating Custom Demos

### Basic Demo Structure

```typescript
import { createRecorder } from './utils/recorder';

async function recordMyFeatureDemo() {
  const recorder = await createRecorder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Navigate to your feature
    await recorder.navigate(`${baseUrl}/my-feature`);
    await recorder.wait(2000);

    // Start recording
    await recorder.startRecording('my-feature-demo');

    // Interact with the page
    await recorder.hover('[data-testid="button-example"]', 800);
    await recorder.click('[data-testid="button-example"]', 1000);
    await recorder.scroll(400, 2000);
    
    // Type in inputs
    await recorder.type('[data-testid="input-search"]', 'Search term', 1000);

    // Stop recording
    await recorder.stopRecording();
    
    console.log('✅ Demo recorded successfully!');
  } catch (error) {
    console.error('❌ Error recording demo:', error);
    throw error;
  } finally {
    await recorder.close();
  }
}

export default recordMyFeatureDemo;
```

### Available Recorder Methods

| Method | Description | Example |
|--------|-------------|---------|
| `navigate(url)` | Navigate to a URL | `await recorder.navigate('http://localhost:5000/dashboard')` |
| `wait(ms)` | Wait for specified time | `await recorder.wait(1000)` |
| `click(selector, waitAfter?)` | Click an element | `await recorder.click('[data-testid="button"]', 500)` |
| `type(selector, text, waitAfter?)` | Type text | `await recorder.type('input', 'Hello', 500)` |
| `hover(selector, waitAfter?)` | Hover over element | `await recorder.hover('.menu-item', 300)` |
| `scroll(distance, duration?)` | Smooth scroll | `await recorder.scroll(400, 2000)` |
| `captureScreenshot(name)` | Take screenshot | `await recorder.captureScreenshot('frame-001')` |
| `startRecording(name)` | Start video recording | `await recorder.startRecording('demo')` |
| `stopRecording()` | Stop video recording | `await recorder.stopRecording()` |
| `convertToGIF(name)` | Convert screenshots to GIF | `await recorder.convertToGIF('demo')` |

## 🎯 Best Practices

### 1. Use data-testid Attributes
Always use `data-testid` selectors for reliability:
```typescript
await recorder.click('[data-testid="button-submit"]');
```

### 2. Add Appropriate Delays
Give animations time to complete:
```typescript
await recorder.click('[data-testid="modal-open"]', 1500); // Wait for modal animation
```

### 3. Smooth Scrolling
Use duration parameter for smooth scroll effects:
```typescript
await recorder.scroll(400, 2000); // Scroll 400px over 2 seconds
```

### 4. Hover for Context
Hover over elements to show tooltips and highlights:
```typescript
await recorder.hover('[data-testid="stat-card"]', 800);
```

### 5. Clean Navigation
Start and end at logical points:
```typescript
// Good: Return to starting position
await recorder.scroll(400, 2000);
await recorder.scroll(-400, 2000); // Back to top

// Bad: Leave page scrolled halfway
```

## 🎨 GIF Conversion

To create GIFs instead of videos, use the screenshot-based approach:

```typescript
// Capture frames
for (let i = 0; i < 60; i++) {
  await recorder.captureScreenshot(`frame-${i.toString().padStart(3, '0')}`);
  await recorder.wait(33); // ~30fps
}

// Convert to GIF
await recorder.convertToGIF('my-demo');
```

## 🔧 Troubleshooting

### Puppeteer Not Launching
Install system dependencies:
```bash
# On Linux/Replit
apt-get install -y chromium-browser
```

### Selector Not Found
1. Check element exists with `data-testid`
2. Add wait time before interaction
3. Use browser DevTools to verify selector

### Recording Quality Issues
Adjust FPS and quality settings:
```typescript
const recorder = await createRecorder({
  fps: 60,      // Higher FPS for smoother video
  quality: 90,  // Higher quality
});
```

## 📊 Demo Checklist

Before recording production demos:

- [ ] App is running and accessible
- [ ] Test data is populated (contacts, deals, etc.)
- [ ] All features are working correctly
- [ ] Animations are smooth
- [ ] No console errors
- [ ] All `data-testid` attributes are in place
- [ ] Output directory has enough space

## 🚀 Production Usage

### 1. Start Your App
```bash
npm run dev
```

### 2. Run Demo Generator
```bash
npm run tsx scripts/demos/generate-all.ts
```

### 3. Check Output
```bash
ls -lh demos/output/
```

### 4. Use Demos
- Upload to marketing site
- Share on social media
- Include in documentation
- Add to presentations

## 📝 Notes

- Demos record at full screen resolution (1920x1080 by default)
- MP4 files are high quality and can be large (10-50MB)
- GIF conversion can take time for long recordings
- All recordings are saved locally (not committed to git)

---

**Created**: November 2025  
**SmartCRM** · Smart Solutions for Your Business
