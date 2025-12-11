import React from 'react';

const Invoicing = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Invoicing</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Invoice Management</h2>
          <p className="text-gray-600">Create, send, and track invoices to your clients and customers.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Create Invoice</h3>
            <p className="text-sm text-gray-500">Generate professional invoices with your branding.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Payment Tracking</h3>
            <p className="text-sm text-gray-500">Track payment status and send automated reminders.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Recurring Invoices</h3>
            <p className="text-sm text-gray-500">Set up automated billing cycles for repeat clients.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Payment Options</h3>
            <p className="text-sm text-gray-500">Offer multiple payment methods to your clients.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;