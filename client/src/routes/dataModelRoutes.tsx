import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { FeatureKey } from '../types/entitlements';

const DataModelPage = lazy(() => import('../pages/settings/DataModelPage'));
const ObjectDetailPage = lazy(() => import('../pages/settings/ObjectDetailPage'));
const RolesPage = lazy(() => import('../pages/settings/RolesPage'));
const TeamPage = lazy(() => import('../pages/settings/TeamPage'));
const GenericRecordsPage = lazy(() => import('../pages/GenericRecordsPage'));

/** Mount inside <Routes> (wrapped by Suspense and the app's ProtectedRoute as needed). */
export const dataModelRoutes = (
  <>
    <Route
      path="/settings/data-model"
      element={
        <ProtectedRoute>
          <Navbar />
          <DataModelPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/data-model/:objectId"
      element={
        <ProtectedRoute>
          <Navbar />
          <ObjectDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/roles"
      element={
        <ProtectedRoute>
          <Navbar />
          <RolesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/team"
      element={
        <ProtectedRoute>
          <Navbar />
          <TeamPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/o/:objectName"
      element={
        <ProtectedRoute>
          <Navbar />
          <GenericRecordsPage />
        </ProtectedRoute>
      }
    />
  </>
);
