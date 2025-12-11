import { DemoBanner } from '@/components/ui/DemoBanner';
import { Phone, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';

export default function PhoneSystemDemo() {
  const callLogs = [
    { id: 1, contact: 'Sarah Johnson', type: 'outgoing', duration: '12:34', time: '10:30 AM', status: 'completed' },
    { id: 2, contact: 'Michael Chen', type: 'incoming', duration: '8:15', time: '2:15 PM', status: 'completed' },
    { id: 3, contact: 'Emily Rodriguez', type: 'missed', duration: '0:00', time: '4:45 PM', status: 'missed' },
    { id: 4, contact: 'David Park', type: 'outgoing', duration: '25:12', time: 'Yesterday', status: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Phone System" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Phone System Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <PhoneOutgoing className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">234</p>
            <p className="text-gray-600">Outgoing Calls</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <PhoneIncoming className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">189</p>
            <p className="text-gray-600">Incoming Calls</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <PhoneMissed className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-gray-600">Missed Calls</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Clock className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">42.5h</p>
            <p className="text-gray-600">Talk Time</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
          <div className="space-y-4">
            {callLogs.map(call => (
              <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  {call.type === 'outgoing' && <PhoneOutgoing className="w-5 h-5 text-green-600" />}
                  {call.type === 'incoming' && <PhoneIncoming className="w-5 h-5 text-blue-600" />}
                  {call.type === 'missed' && <PhoneMissed className="w-5 h-5 text-red-600" />}
                  <div>
                    <p className="font-semibold">{call.contact}</p>
                    <p className="text-sm text-gray-600">Duration: {call.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{call.time}</p>
                  <button className="text-blue-600 text-sm hover:underline">Call Back</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
