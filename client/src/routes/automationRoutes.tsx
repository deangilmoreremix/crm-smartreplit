import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';

const WebhooksPage = lazy(() => import('../pages/automation/WebhooksPage'));
const ApiKeysPage = lazy(() => import('../pages/automation/ApiKeysPage'));
const ApiDocsPage = lazy(() => import('../pages/automation/ApiDocsPage'));

/**
 * Route fragment: spread inside <Routes> in App.tsx as `{automationRoutes}`.
 * Note /settings/api-keys (OpenAI keys) is a different page; public REST keys live at /settings/api-keys-public.
 */
export const automationRoutes = (
  <>
    <Route
      path="/settings/webhooks"
      element={
        <ProtectedRoute>
          <Navbar />
          <WebhooksPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/api-keys-public"
      element={
        <ProtectedRoute>
          <Navbar />
          <ApiKeysPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/api-docs"
      element={
        <ProtectedRoute>
          <Navbar />
          <ApiDocsPage />
        </ProtectedRoute>
      }
    />
  </>
);
