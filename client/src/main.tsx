import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Basic browser polyfills
if (typeof global === 'undefined') {
  (window as unknown as { global: typeof globalThis }).global = globalThis;
}

if (typeof process === 'undefined') {
  (window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
}

// Polyfill for Buffer
(window as unknown as { Buffer?: unknown }).Buffer =
  (window as unknown as { Buffer?: unknown }).Buffer || undefined;

// Comprehensive module polyfill for CommonJS compatibility
if (typeof window !== 'undefined' && !(window as any).module) {
  (window as any).module = { exports: {} };
  (window as any).exports = (window as any).module.exports;
}

// Production error handler - log errors but don't suppress them
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
