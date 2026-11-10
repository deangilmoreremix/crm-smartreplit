import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const DataModelPage = lazy(() => import('../pages/settings/DataModelPage'));
const ObjectDetailPage = lazy(() => import('../pages/settings/ObjectDetailPage'));
const RolesPage = lazy(() => import('../pages/settings/RolesPage'));
const TeamPage = lazy(() => import('../pages/settings/TeamPage'));
const GenericRecordsPage = lazy(() => import('../pages/GenericRecordsPage'));

/** Mount inside <Routes> (wrapped by Suspense and the app's ProtectedRoute as needed). */
export const dataModelRoutes = (
  <>
    <Route path="/settings/data-model" element={<DataModelPage />} />
    <Route path="/settings/data-model/:objectId" element={<ObjectDetailPage />} />
    <Route path="/settings/roles" element={<RolesPage />} />
    <Route path="/settings/team" element={<TeamPage />} />
    <Route path="/o/:objectName" element={<GenericRecordsPage />} />
  </>
);
