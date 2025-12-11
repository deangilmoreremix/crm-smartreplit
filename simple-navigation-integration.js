/**
 * Super Simple Navigation Integration
 * Just copy this small code snippet to each remote app
 */

// Simple navigation functions that just send messages to parent
function navigateToDashboard() {
  window.parent.postMessage({ 
    type: 'NAVIGATE', 
    route: '/dashboard' 
  }, '*');
}

function navigateToContacts() {
  window.parent.postMessage({ 
    type: 'NAVIGATE', 
    route: '/contacts' 
  }, '*');
}

function navigateToDeals() {
  window.parent.postMessage({ 
    type: 'NAVIGATE', 
    route: '/deals' 
  }, '*');
}

function navigateToTasks() {
  window.parent.postMessage({ 
    type: 'NAVIGATE', 
    route: '/tasks' 
  }, '*');
}

function navigateToCalendar() {
  window.parent.postMessage({ 
    type: 'NAVIGATE', 
    route: '/calendar' 
  }, '*');
}

// Add navigation buttons to your app
function addSimpleNavigation() {
  const navHTML = `
    <div style="
      padding: 10px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      display: flex; 
      gap: 10px; 
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <span style="font-weight: 600; margin-right: 10px;">🏠 CRM Navigation:</span>
      <button onclick="navigateToDashboard()" style="
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 6px 12px; 
        border-radius: 20px; 
        cursor: pointer; 
        font-size: 12px;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Dashboard</button>
      
      <button onclick="navigateToContacts()" style="
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 6px 12px; 
        border-radius: 20px; 
        cursor: pointer; 
        font-size: 12px;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Contacts</button>
      
      <button onclick="navigateToDeals()" style="
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 6px 12px; 
        border-radius: 20px; 
        cursor: pointer; 
        font-size: 12px;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Deals</button>
      
      <button onclick="navigateToTasks()" style="
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 6px 12px; 
        border-radius: 20px; 
        cursor: pointer; 
        font-size: 12px;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Tasks</button>
      
      <button onclick="navigateToCalendar()" style="
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 6px 12px; 
        border-radius: 20px; 
        cursor: pointer; 
        font-size: 12px;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Calendar</button>
    </div>
  `;
  
  // Add to top of the page
  document.body.insertAdjacentHTML('afterbegin', navHTML);
  
  console.log('✅ Simple CRM navigation added');
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addSimpleNavigation);
} else {
  addSimpleNavigation();
}

/**
 * USAGE:
 * 
 * 1. Copy this entire file content
 * 2. Paste it into a <script> tag in each remote app's HTML
 * 3. Or save as a .js file and include it: <script src="simple-navigation.js"></script>
 * 
 * That's it! No complex setup needed.
 */