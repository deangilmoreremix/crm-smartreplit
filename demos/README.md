# SmartCRM Demo Video Generation

This directory contains Playwright scripts for generating comprehensive demo videos showcasing SmartCRM's features.

## Architecture Overview

SmartCRM uses a hybrid architecture:
- **Main App Routes**: Load within the primary React application (`/dashboard`, `/contacts`, `/pipeline`, etc.)
- **Full-Frame Iframe Routes**: Remote applications that completely replace the viewport (`/smartcrm-closer`, `/funnelcraft-ai`, `/content-ai`)

## Prerequisites

1. **SmartCRM Running**: Start the application with `npm run dev`
2. **Playwright Browsers**: Install with `npx playwright install --with-deps chromium`
3. **OpenAI API Key**: Configure for AI features
4. **Remote Apps**: Ensure iframe-based remote applications are accessible

## Demo Scripts

### Individual Demos

| Script | Description | Route Type |
|--------|-------------|------------|
| `01-overview.spec.ts` | Main navigation and feature overview | Main App |
| `02-contacts-ai-lead-scoring.spec.ts` | Contact management with AI enrichment | Main App |
| `03-pipeline-deal-intelligence.spec.ts` | Deal pipeline and AI analysis | Main App |
| `04-openclaw-control.spec.ts` | Natural language CRM control | Main App |
| `05-ai-tools.spec.ts` | AI tools suite (60+ features) | Main App |
| `06-communication-hub.spec.ts` | Communication tools and automation | Main App |
| `07-analytics.spec.ts` | Analytics and business intelligence | Main App |
| `08-white-label.spec.ts` | White label and agency features | Main App |
| `09-tasks.spec.ts` | Task management and prioritization | Main App |
| `10-remote-apps.spec.ts` | Remote iframe applications | Full-Frame Iframe |

### Running Demos

```bash
# Run individual demos
npm run demo:overview
npm run demo:contacts
npm run demo:pipeline
npm run demo:openclaw
npm run demo:ai-tools
npm run demo:communication
npm run demo:analytics
npm run demo:white-label
npm run demo:tasks
npm run demo:remote-apps

# Run all demos sequentially
npm run demo:all
```

### Video Output

- **Location**: `demo-videos/` directory
- **Format**: WebM (high quality, optimized size)
- **Resolution**: 1440x900
- **Naming**: Based on test file names with timestamps

## Configuration

### Environment Variables

```bash
# Override default SmartCRM URL
SMARTCRM_URL=https://your-demo-server.com npm run demo:all
```

### Customizing Demos

- **Timing**: Adjust `pause()` calls in `helpers.ts` for faster/slower demos
- **Selectors**: Update locators in individual scripts if UI changes
- **Content**: Modify sample data in helper functions
- **Titles**: Change overlay text in demo scripts

## Helper Functions

Located in `helpers.ts`:

- `openSmartCRM()` - Navigate to app and wait for load
- `clickNav()` - Robust navigation with fallbacks
- `demoTitle()` - Overlay titles on screen
- `highlightText()` - Highlight UI elements
- `waitForIframeLoad()` - Handle iframe loading
- `handleIframeDemo()` - Specialized iframe demo logic
- `createSampleContact()` / `createSampleDeal()` - Generate demo data

## Troubleshooting

### Common Issues

1. **Iframe Loading**: Remote apps may have CORS restrictions
2. **Authentication**: Scripts may need login handling
3. **Timing**: AI responses may require longer waits
4. **Selectors**: UI changes may break element targeting

### Debugging

```bash
# Run with headed browser to see interactions
npm run demo:overview

# Generate traces for debugging
# (traces are automatically enabled in config)

# View generated videos
ls -la demo-videos/
```

## Development

### Adding New Demos

1. Create new spec file: `demos/smartcrm/11-new-feature.spec.ts`
2. Add helper functions to `helpers.ts` if needed
3. Add npm script to `package.json`
4. Test individually before adding to suite

### Updating Existing Demos

1. Test current functionality
2. Update selectors if UI changed
3. Adjust timing as needed
4. Verify video output quality

## Architecture Notes

### Main App Demos
- Interact directly with SmartCRM React components
- Use standard Playwright page interactions
- Can access and manipulate DOM elements

### Iframe Demos
- Remote apps load in full-frame iframes
- Limited interaction due to cross-origin policies
- Focus on demonstrating app loading and basic presence
- May require special handling for remote app features

## Output Quality

- **Resolution**: 1440x900 for professional presentation
- **Frame Rate**: Playwright default (smooth playback)
- **Compression**: WebM format balances quality and file size
- **Duration**: 2-5 minutes per demo depending on feature complexity

## Maintenance

- Regularly test all demos after UI updates
- Update remote app URLs if they change
- Refresh sample data to reflect current features
- Monitor video file sizes and compression settings