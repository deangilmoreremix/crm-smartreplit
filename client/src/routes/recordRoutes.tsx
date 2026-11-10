import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { FeatureKey } from '../types/entitlements';

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
    <Route
      path="/contacts/:id"
      element={
        <ProtectedRoute featureKey={FeatureKey.CONTACTS}>
          <Navbar />
          <ContactDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/companies"
      element={
        <ProtectedRoute featureKey={FeatureKey.CONTACTS}>
          <Navbar />
          <CompaniesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/companies/:id"
      element={
        <ProtectedRoute featureKey={FeatureKey.CONTACTS}>
          <Navbar />
          <CompanyRecord />
        </ProtectedRoute>
      }
    />
    <Route
      path="/deals/:id"
      element={
        <ProtectedRoute featureKey={FeatureKey.PIPELINE}>
          <Navbar />
          <DealRecord />
        </ProtectedRoute>
      }
    />
  </>
);
