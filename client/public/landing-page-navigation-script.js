
<script>
/**
 * Smart CRM Navigation Integration Script
 * Add this script to your landing page at https://cerulean-crepe-9470cc.netlify.app
 * This will ensure all login/signup buttons route to the new Smart CRM app
 */

(function() {
  console.log('Smart CRM Navigation Script Loaded');
  
  let crmUrl = '';
  let routeMapping = {};

  // Listen for setup messages from parent CRM
  window.addEventListener('message', function(event) {
    if (event.data.type === 'SETUP_CRM_NAVIGATION') {
      crmUrl = event.data.crmUrl;
      routeMapping = event.data.routes;
      console.log('CRM Navigation setup received:', crmUrl);
      setupNavigation();
    }
  });

  function setupNavigation() {
    // Override all link clicks
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a, button');
      if (!link) return;

      const text = link.textContent.trim();
      const href = link.href;
      
      console.log('Click detected:', text, href);

      // Check if this is a navigation button/link
      const route = findRoute(text, href);
      if (route) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Navigating to CRM:', route);
        
        // Navigate parent window to the CRM route
        if (window.parent !== window) {
          window.parent.location.href = crmUrl + route;
        } else {
          window.location.href = crmUrl + route;
        }
      }
    });

    // Override form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.tagName === 'FORM') {
        // If this looks like a signup/login form
        const action = form.action || '';
        if (action.includes('signup') || action.includes('login') || action.includes('auth')) {
          e.preventDefault();
          
          // Route to appropriate CRM page
          const route = action.includes('signup') ? '/signup' : '/signin';
          console.log('Form navigation to CRM:', route);
          
          if (window.parent !== window) {
            window.parent.location.href = crmUrl + route;
          } else {
            window.location.href = crmUrl + route;
          }
        }
      }
    });
  }

  function findRoute(text, href) {
    // Check text mapping first
    for (const [key, route] of Object.entries(routeMapping)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return route;
      }
    }

    // Check href patterns
    if (href) {
      if (href.includes('signup') || href.includes('register')) return '/signup';
      if (href.includes('login') || href.includes('signin')) return '/signin';
      if (href.includes('dashboard') || href.includes('app')) return '/dashboard';
    }

    // Check common button text patterns
    const textLower = text.toLowerCase();
    if (textLower.includes('get started') || textLower.includes('sign up') || 
        textLower.includes('register') || textLower.includes('try now') || 
        textLower.includes('start free')) {
      return '/signup';
    }
    
    if (textLower.includes('log in') || textLower.includes('sign in') || 
        textLower.includes('login') || textLower.includes('signin')) {
      return '/signin';
    }

    return null;
  }

  // Initialize immediately if we're in an iframe
  if (window.parent !== window) {
    console.log('Running in iframe, requesting navigation setup');
    window.parent.postMessage({
      type: 'REQUEST_NAVIGATION_SETUP'
    }, '*');
  }
})();
</script>
