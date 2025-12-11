
// Automatic Iframe Overlap Fix Script
// This script can be injected into remote apps to prevent navbar overlap

(function() {
  'use strict';
  
  // Check if we're running inside an iframe
  const isInIframe = window !== window.top;
  
  if (!isInIframe) {
    return; // Not in iframe, no need to fix
  }
  
  // Listen for messages from parent window
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ADD_TOP_PADDING') {
      const padding = event.data.padding || '80px';
      addTopPadding(padding);
    }
  });
  
  // Function to add top padding
  function addTopPadding(padding) {
    // Method 1: Add padding to body
    if (document.body) {
      document.body.style.paddingTop = padding;
      document.body.style.boxSizing = 'border-box';
      document.body.style.marginTop = '0px';
    }
    
    // Method 2: Create and inject CSS
    const style = document.createElement('style');
    style.textContent = `
      body {
        padding-top: ${padding} !important;
        box-sizing: border-box !important;
      }
      
      .navbar-overlap-fix {
        height: ${padding};
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        z-index: -1;
        background: transparent;
      }
      
      /* Common app containers that might need fixing */
      .app-container,
      .main-content,
      .page-content,
      #root > div:first-child,
      .app > div:first-child {
        margin-top: ${padding} !important;
      }
    `;
    
    if (document.head) {
      document.head.appendChild(style);
    } else {
      // If head doesn't exist yet, wait for it
      document.addEventListener('DOMContentLoaded', function() {
        if (document.head) {
          document.head.appendChild(style);
        }
      });
    }
    
    // Method 3: Create a spacer div
    const spacer = document.createElement('div');
    spacer.className = 'navbar-overlap-fix';
    spacer.setAttribute('data-navbar-spacer', 'true');
    
    if (document.body) {
      document.body.insertBefore(spacer, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        if (document.body) {
          document.body.insertBefore(spacer, document.body.firstChild);
        }
      });
    }
    
    console.log('Navbar overlap fix applied with padding:', padding);
  }
  
  // Auto-detect and apply fix if we detect we're in a problematic iframe
  function autoDetectAndFix() {
    // Check various indicators that we might have an overlap issue
    const indicators = [
      // Check if parent has specific classes or IDs
      window.parent !== window,
      // Check URL patterns that suggest this is an embedded app
      window.location.href.includes('netlify.app'),
      window.location.href.includes('.bolt.host'),
      // Check if there are common navbar classes in parent
      true // For now, always apply
    ];
    
    if (indicators.some(Boolean)) {
      // Apply default 120px padding to ensure proper clearance
      addTopPadding('120px');
    }
  }
  
  // Run auto-detection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoDetectAndFix);
  } else {
    autoDetectAndFix();
  }
  
  // Also run after a short delay to catch dynamic content
  setTimeout(autoDetectAndFix, 1000);
  
})();
