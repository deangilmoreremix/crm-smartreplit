import React from 'react';
import PageLayout from '../components/PageLayout';
import RevenueSharingDashboard from '@/components/RevenueSharingDashboard';

export default function RevenueSharingPage() {
  return (
    <div className="h-full overflow-y-auto">
      <RevenueSharingDashboard />
    </div>
  );
}