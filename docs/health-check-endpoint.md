
# Health Check Endpoint for Remote Contact Apps

To work seamlessly with the auto-loading system, your remote contact applications should expose a health check endpoint.

## Implementation

Add this to your remote app:

```javascript
// In your Express server or Vite dev server
app.get('/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    app: 'contacts-app',
    version: '1.0.0',
    features: ['module-federation', 'auto-sync']
  });
});
```

## For Static Deployments (Netlify/Vercel)

Create a `public/health-check` file:

```json
{
  "status": "ok",
  "app": "contacts-app", 
  "version": "1.0.0",
  "features": ["module-federation", "auto-sync"]
}
```

This allows the auto-loading system to quickly verify your app is available before attempting to load the full module.
