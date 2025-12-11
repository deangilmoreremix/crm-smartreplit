import { DemoBanner } from '@/components/ui/DemoBanner';
import { Mail, Phone, MessageSquare, Calendar, Send, User, Clock, CheckCircle } from 'lucide-react';

export default function CommunicationDemo() {
  const communications = [
    { id: 1, type: 'email', contact: 'Sarah Johnson', subject: 'Follow up on proposal', time: '10 mins ago', status: 'sent' },
    { id: 2, type: 'call', contact: 'Michael Chen', subject: 'Discovery call completed', time: '2 hours ago', status: 'completed' },
    { id: 3, type: 'sms', contact: 'Emily Rodriguez', subject: 'Meeting reminder sent', time: '5 hours ago', status: 'delivered' },
    { id: 4, type: 'email', contact: 'David Park', subject: 'Contract terms discussion', time: '1 day ago', status: 'read' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Communication Hub" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Communication Hub Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Mail className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">127</p>
            <p className="text-gray-600">Emails Sent</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Phone className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">45</p>
            <p className="text-gray-600">Calls Made</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">89</p>
            <p className="text-gray-600">Messages</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <CheckCircle className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">92%</p>
            <p className="text-gray-600">Response Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Communications</h2>
          <div className="space-y-4">
            {communications.map(comm => (
              <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  {comm.type === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                  {comm.type === 'call' && <Phone className="w-5 h-5 text-green-600" />}
                  {comm.type === 'sms' && <MessageSquare className="w-5 h-5 text-purple-600" />}
                  <div>
                    <p className="font-semibold">{comm.contact}</p>
                    <p className="text-sm text-gray-600">{comm.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{comm.time}</p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{comm.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
