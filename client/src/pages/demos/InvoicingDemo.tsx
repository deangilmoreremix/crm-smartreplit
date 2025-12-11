import { DemoBanner } from '@/components/ui/DemoBanner';
import { Receipt, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function InvoicingDemo() {
  const invoices = [
    { id: 'INV-001', client: 'Acme Corporation', amount: 15000, status: 'paid', date: '2024-01-15' },
    { id: 'INV-002', client: 'TechStart Inc', amount: 8500, status: 'pending', date: '2024-01-20' },
    { id: 'INV-003', client: 'Global Solutions', amount: 12000, status: 'overdue', date: '2023-12-28' },
    { id: 'INV-004', client: 'InnovateTech', amount: 22000, status: 'paid', date: '2024-01-18' },
  ];

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Invoicing System" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Invoicing Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">${(totalPaid + totalPending + totalOverdue).toLocaleString()}</p>
            <p className="text-gray-600">Total Invoiced</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
            <p className="text-gray-600">Paid</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
            <p className="text-gray-600">Pending</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-2xl font-bold">${totalOverdue.toLocaleString()}</p>
            <p className="text-gray-600">Overdue</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Invoices</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Create Invoice
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Invoice ID</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">{invoice.id}</td>
                    <td className="p-3">{invoice.client}</td>
                    <td className="p-3 font-semibold">${invoice.amount.toLocaleString()}</td>
                    <td className="p-3">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
