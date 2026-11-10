import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const ContactDetail = lazy(() => import('../pages/ContactDetail'));
const CompaniesPage = lazy(() => import('../pages/record/CompaniesPage'));
const CompanyRecord = lazy(() => import('../pages/record/CompanyRecord'));
const DealRecord = lazy(() => import('../pages/record/DealRecord'));

/**
 * Record routes to be spread into the app's <Routes> (wrap each element in the app's
 * ProtectedRoute/Suspense as it does for other pages). `/contacts/:id` renders ContactDetail,
 * which now hosts the tabbed record shell. Static `/contacts/duplicates` still outranks `:id`.
 */
export const recordRoutes = (
  <>
    <Route path="/contacts/:id" element={<ContactDetail />} />
    <Route path="/companies" element={<CompaniesPage />} />
    <Route path="/companies/:id" element={<CompanyRecord />} />
    <Route path="/deals/:id" element={<DealRecord />} />
  </>
);
