# Remote Pipeline Integration Setup

## Step 1: Add the Bridge Script to Your Pipeline App

Add the `remote-pipeline-integration.js` file to your pipeline app at `https://cheery-syrniki-b5b6ca.netlify.app`.

### Option A: Include as Script Tag
```html
<!-- Add this script tag to your index.html -->
<script src="./remote-pipeline-integration.js"></script>
```

### Option B: Include Inline
Copy the entire contents of `remote-pipeline-integration.js` and paste it in a `<script>` tag in your HTML.

### Option C: Import as Module
```javascript
// If your app uses modules, import the bridge
import './remote-pipeline-integration.js';
```

## Step 2: Update Your CRM Domain

In the `remote-pipeline-integration.js` file, update the `allowedOrigins` array with your actual CRM domain:

```javascript
const allowedOrigins = [
  'https://your-actual-crm-domain.replit.dev', // Replace with your CRM URL
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
```

## Step 3: Connect Your Pipeline Events

### When a deal is updated in your pipeline:
```javascript
// Example: User drags a deal or edits deal details
function onDealUpdate(dealData) {
  window.crmBridge.onDealUpdated(dealData);
}
```

### When a deal is created:
```javascript
// Example: User clicks "Add Deal" button
function onDealCreate(newDeal) {
  window.crmBridge.onDealCreated(newDeal);
}
```

### When a deal is moved between stages:
```javascript
// Example: Drag and drop between columns
function onDealMove(dealId, fromStage, toStage, position) {
  window.crmBridge.onDealMoved(dealId, fromStage, toStage, position);
}
```

### When a deal is deleted:
```javascript
// Example: User clicks delete button
function onDealDelete(dealId) {
  window.crmBridge.onDealDeleted(dealId);
}
```

## Step 4: Receive CRM Data

The bridge automatically receives deal data from your CRM. You can access it through:

```javascript
// Listen for data updates
window.addEventListener('crmDataUpdated', (event) => {
  const { deals, stages } = event.detail;
  
  // Update your pipeline UI
  updatePipelineDisplay(deals, stages);
});

// Or access directly
console.log('Current deals:', window.crmBridge.deals);
console.log('Pipeline stages:', window.crmBridge.stages);
```

## Step 5: Custom Integration Functions

Create these functions in your pipeline app to handle CRM data:

```javascript
// Update your pipeline display when CRM sends new data
function updatePipelineDisplay(deals, stages) {
  // Your pipeline UI update logic here
  deals.forEach(deal => {
    updateDealCard(deal);
  });
}

// Update a specific deal card in your UI
function updateDealCard(deal) {
  const element = document.querySelector(`[data-deal-id="${deal.id}"]`);
  if (element) {
    element.querySelector('.deal-title').textContent = deal.title;
    element.querySelector('.deal-value').textContent = formatCurrency(deal.value);
    // Update other fields as needed
  }
}

// Format currency consistently
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
```

## Step 6: Navigation Integration (Optional)

Allow your pipeline to navigate the CRM:

```javascript
// Add buttons or links to navigate back to CRM
function goToDashboard() {
  window.crmBridge.navigateToCRM('/dashboard');
}

function goToContacts() {
  window.crmBridge.navigateToCRM('/contacts');
}

function goToAnalytics() {
  window.crmBridge.navigateToCRM('/analytics');
}
```

## Testing the Integration

1. **Check Console**: Open browser dev tools and look for bridge messages
2. **Test Data Flow**: Create/update deals in CRM and verify they appear in pipeline
3. **Test Reverse Flow**: Update deals in pipeline and verify they sync to CRM
4. **Connection Status**: The CRM should show "Connected" status indicator

## Troubleshooting

### Connection Issues
- Verify the script is loaded correctly
- Check allowed origins match your CRM domain
- Look for CORS errors in browser console

### Data Not Syncing
- Check console for message logs
- Verify event handlers are properly connected
- Ensure deal data format matches expected structure

### UI Not Updating
- Make sure `updatePipelineUI()` calls your actual update functions
- Check that `crmDataUpdated` event listener is properly set up
- Verify DOM selectors match your HTML structure

## Example Complete Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>Pipeline Management</title>
</head>
<body>
  <div id="pipeline-container">
    <!-- Your pipeline UI here -->
  </div>

  <script src="./remote-pipeline-integration.js"></script>
  <script>
    // Your pipeline app code
    window.addEventListener('crmDataUpdated', (event) => {
      const { deals } = event.detail;
      renderPipeline(deals);
    });

    function renderPipeline(deals) {
      const container = document.getElementById('pipeline-container');
      // Render your pipeline with CRM deals
    }

    // Connect your events to CRM bridge
    function handleDealDrop(dealId, newStage) {
      window.crmBridge.onDealMoved(dealId, oldStage, newStage);
    }
  </script>
</body>
</html>
```

This integration provides full bidirectional synchronization between your CRM and pipeline app!