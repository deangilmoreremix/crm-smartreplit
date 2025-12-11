# SmartCRM Screenshot Automation System

This system uses Playwright to automatically capture high-quality screenshots of your SmartCRM application for marketing materials and sales demos.

## 🎯 What It Does

- **Automated Screenshots**: Captures screenshots across multiple viewports (desktop, tablet, mobile)
- **Theme Support**: Handles both light and dark themes
- **Component Targeting**: Captures specific UI components using data-testid attributes
- **Remote Apps**: Includes screenshots of your remote applications (OTO1, OTO2, OTO3, OTO4)
- **Organized Output**: Saves screenshots in structured folders by viewport and theme

## 📁 Files Location

- `scripts/screenshots/screenshot.runner.ts` - Main automation script
- `scripts/screenshots/test-screenshot.ts` - Simple test script to verify Playwright works
- `scripts/screenshots/shots.targets.json` - Configuration file defining what to capture (if needed)
- `screenshots/` - Output directory (created automatically)

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install --save-dev @playwright/test ts-node typescript
npx playwright install
sudo npx playwright install-deps  # May require sudo
```

### 2. Run Test (Verify Everything Works)
```bash
npx tsx scripts/screenshots/test-screenshot.ts
```
This will create `screenshots/test-screenshot.png` to verify Playwright is working.

### 3. Run Full Screenshot Suite
```bash
npx tsx scripts/screenshots/screenshot.runner.ts
```

## 📋 Configuration

### Viewports
- **Desktop**: 1440x900
- **Tablet**: 834x1112
- **Mobile**: 390x844

### Themes
- Light mode
- Dark mode

### Pages Captured
- **FE_Dashboard**: Main dashboard with KPI cards, recent activity, tasks funnel
- **FE_Contacts**: Contacts list, contact cards, AI insights panel
- **FE_Pipeline**: Pipeline board, deal cards, pipeline stats
- **FE_Calendar**: Calendar views (month, kanban, list)
- **OTO1_AIAgencySuite**: Remote AI Agency Suite app
- **OTO1_ProductResearch**: Remote Product Research app
- **OTO1_InsightsAI_Dashboard**: Remote AI Analytics Dashboard
- **OTO2_AIBoost_Upsell**: AI Boost Unlimited upsell page
- **OTO3_CommunicationSuite**: Communication tools (video email, SMS, VoIP, invoicing, forms)
- **OTO4_SalesMaximizer_Remote**: Remote Sales Maximizer app
- **OTO4_ReferralMaximizer_Remote**: Remote Referral Maximizer app
- **OTO4_ContentAI_Remote**: Remote Content AI app
- **OTO4_BusinessIntel_InApp**: Business Intelligence page

## 📁 Output Structure

```
screenshots/
├── desktop__light/
│   ├── FE_Dashboard__dashboard-full__desktop__light.png
│   ├── FE_Contacts__contacts-list__desktop__light.png
│   └── ...
├── desktop__dark/
├── tablet__light/
├── mobile__dark/
└── ...
```

## 🎨 Component Targeting

The system uses `data-testid` attributes to capture specific components. Add these to your React components for better targeting:

```tsx
// Dashboard components
<div data-testid="kpi-cards">...</div>
<div data-testid="recent-activity">...</div>
<div data-testid="tasks-and-funnel">...</div>

// Contact components
<div data-testid="contacts-list">...</div>
<article data-testid="contact-card">...</article>
<section data-testid="ai-insights-panel">...</section>

// Pipeline components
<section data-testid="kanban-board">...</section>
<article data-testid="deal-card">...</article>
<div data-testid="pipeline-stats">...</div>

// Calendar components
<div data-testid="calendar-month">...</div>
<div data-testid="calendar-kanban">...</div>
<div data-testid="calendar-list">...</div>

// Communication components
<div data-testid="video-email">...</div>
<div data-testid="sms-center">...</div>
<div data-testid="voip-dialer">...</div>
<div data-testid="invoicing">...</div>
<div data-testid="forms-surveys">...</div>
```

## ⚙️ Customization

### Adding New Pages
Edit `shots.targets.json` and add to the `pages` array:

```json
{
  "name": "NewPage",
  "url": "https://your-app.com/new-page",
  "shots": [
    { "label": "full-page", "fullPage": true },
    { "label": "specific-component", "selector": "[data-testid='component']" }
  ]
}
```

### Authentication
If you need login automation, update the `auth` section in `shots.targets.json`:

```json
"auth": {
  "enabled": true,
  "loginUrl": "https://your-app.com/login",
  "usernameSelector": "#email",
  "passwordSelector": "#password",
  "submitSelector": "button[type='submit']",
  "username": "your-username",
  "password": "your-password"
}
```

### Custom Viewports
Add new viewports in the `viewports` section:

```json
"viewports": {
  "custom": { "width": 1920, "height": 1080 }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   ```bash
   # Install system dependencies
   sudo npx playwright install-deps
   ```

2. **TypeScript Errors**
   ```bash
   # Use ts-node with proper config
   npx ts-node --esm screenshot.runner.ts
   ```

3. **Element Not Found**
   - Add `data-testid` attributes to components
   - Increase `defaultWait` in config
   - Add `waitFor` to specific shots

4. **Authentication Issues**
   - Verify login selectors are correct
   - Check if CAPTCHA or 2FA blocks automation
   - Consider using session cookies instead

## 📊 Performance Notes

- **First Run**: May take 2-3 minutes to download browsers
- **Full Suite**: ~5-10 minutes depending on page load times
- **Storage**: ~50-200MB per complete run (all viewports/themes)
- **Parallel**: Can be optimized to run viewports in parallel

## 🎯 Use Cases

- **Marketing Materials**: Professional screenshots for websites, presentations
- **Sales Demos**: Consistent visuals for client presentations
- **Documentation**: UI screenshots for technical docs
- **Quality Assurance**: Visual regression testing
- **Social Media**: High-quality images for marketing campaigns

## 📞 Support

If you encounter issues:
1. Run the test script first: `node test-screenshot.cjs`
2. Check browser console for errors
3. Verify URLs in `shots.targets.json` are accessible
4. Add `data-testid` attributes for better component targeting

---

**Ready to capture your marketing screenshots!** 🚀

Run: `npx ts-node screenshot.runner.ts`