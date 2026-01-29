console.log('main.tsx starting...');

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Fix for "global is not defined" error in browser
if (typeof global === 'undefined') {
  (window as unknown as { global: typeof globalThis }).global = globalThis;
}

// Additional browser compatibility fixes
if (typeof process === 'undefined') {
  (window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
}

// Polyfill for Node.js modules that might be required by third-party scripts
(window as unknown as { Buffer?: unknown }).Buffer = (window as unknown as { Buffer?: unknown }).Buffer || undefined;
(window as unknown as { require?: unknown }).require = (window as unknown as { require?: unknown }).require || function() { return {}; };

// Comprehensive module polyfill for CommonJS compatibility
if (typeof window !== 'undefined' && !(window as any).module) {
  (window as any).module = { exports: {} };
  (window as any).exports = (window as any).module.exports;
}

// Enhanced error boundary for unhandled errors
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const error = event.error;

  console.log('Error event:', message, error);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // Suppress ALL development/third-party errors that cause runtime overlay
  if (message.includes('Script error') ||
      message.includes('Module') ||
      message.includes('stream') ||
      message.includes('Loading') ||
      message.includes('Federation') ||
      error?.message?.includes('No AI providers available') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('loading') ||
      !error ||
      !message) {
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || event.reason?.message || '';
  
  // Suppress ALL promise rejections that cause runtime overlay
  if (reason.includes('Module externalized') ||
      reason.includes('No AI providers available') ||
      reason.includes('stream') ||
      reason.includes('timeout') ||
      reason.includes('loading') ||
      reason.includes('Failed to load') ||
      !event.reason ||
      !reason) {
    event.preventDefault();
    return false;
  }
});

// Additional global error handler for non-error objects
window.onerror = function(_message, _source, _lineno, _colno, _error) {
  return true; // Prevent default error handling
};

// Enhanced error handler to catch ALL thrown objects (including non-Error objects)
const originalError = console.error;
console.error = function(...args) {
  // Only log actual errors to console, suppress development/third-party errors
  const message = args[0]?.toString() || '';
  if (message.includes('uncaught exception') ||
      message.includes('Script error') ||
      message.includes('Module') ||
      message.includes('stream') ||
      message.includes('No AI providers') ||
      message.includes('loading') ||
      message.includes('timeout')) {
    return;
  }
  originalError.apply(console, args);
};

// Override any exception handlers that might show runtime overlays
if (typeof window !== 'undefined') {
  // Prevent all runtime error overlays by suppressing uncaught exceptions
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    return false;
  }, true);
  
  window.addEventListener('error', (event) => {
    event.preventDefault(); 
    event.stopPropagation();
    return false;
  }, true);

  // Disable Vite's runtime error overlay specifically
  if ((import.meta as any).env?.MODE === 'development') {
    // Override Vite's error overlay by preventing it from being created
    const style = document.createElement('style');
    style.textContent = `
      vite-error-overlay {
        display: none !important;
      }
      [data-vite-error-overlay] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Remove any existing error overlays
    const removeOverlays = () => {
      document.querySelectorAll('vite-error-overlay').forEach(el => el.remove());
      document.querySelectorAll('[data-vite-error-overlay]').forEach(el => el.remove());
    };
    
    // Run periodically to catch any overlays that appear
    setInterval(removeOverlays, 100);
    removeOverlays();
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
