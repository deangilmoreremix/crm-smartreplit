# Remote Module Navigation Examples

Your remote contacts module can now control the parent CRM navigation! Here are simple examples:

## JavaScript Examples for Your Remote Module

### 1. Add a "Back to Dashboard" Button

```html
<button onclick="navigateToDashboard()">
  ← Back to Dashboard
</button>
```

### 2. Navigation Menu

```html
<nav>
  <button onclick="navigateTo('/')">Dashboard</button>
  <button onclick="navigateTo('/deals')">Deals</button>
  <button onclick="navigateTo('/tasks')">Tasks</button>
  <button onclick="navigateTo('/calendar')">Calendar</button>
</nav>
```

### 3. Dynamic Navigation

```javascript
// Navigate to different sections
function goToSection(section) {
  navigateTo(`/${section}`);
}

// Go back in browser history
function goBack() {
  navigateBack();
}

// Quick dashboard access
function returnHome() {
  navigateToDashboard();
}
```

### 4. Simple Integration in Your UI

Add this to any page in your remote contacts module:

```html
<div style="position: fixed; top: 10px; left: 10px; z-index: 1000;">
  <button onclick="navigateToDashboard()" 
          style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
    ← CRM Dashboard
  </button>
</div>
```

## Available Navigation Functions

Once the bridge is loaded, these functions are available globally:

- `navigateToDashboard()` - Go to main dashboard
- `navigateTo('/route')` - Navigate to any CRM route
- `navigateBack()` - Browser back button functionality

## Available CRM Routes

- `/` - Dashboard
- `/contacts` - Contacts (current page)
- `/deals` - Deals management
- `/tasks` - Task management  
- `/calendar` - Calendar view

The bridge automatically handles the navigation and provides console feedback for debugging.