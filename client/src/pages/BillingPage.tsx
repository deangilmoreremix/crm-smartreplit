import React from 'react';
import { BillingDashboard } from '../components/BillingDashboard';

const BillingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <BillingDashboard />
    </div>
  );
};

export default BillingPage;