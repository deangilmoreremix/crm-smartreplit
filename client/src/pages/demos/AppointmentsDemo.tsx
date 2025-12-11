import { DemoBanner } from '@/components/ui/DemoBanner';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';

export default function AppointmentsDemo() {
  const appointments = [
    { id: 1, title: 'Sales Demo - Acme Corp', client: 'Sarah Johnson', time: '10:00 AM', duration: '1 hour', status: 'confirmed' },
    { id: 2, title: 'Follow-up Call - TechStart', client: 'Michael Chen', time: '2:00 PM', duration: '30 mins', status: 'confirmed' },
    { id: 3, title: 'Discovery Meeting - Global Solutions', client: 'Emily Rodriguez', time: '4:00 PM', duration: '45 mins', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Appointments" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Appointments Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-gray-600">Today</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">8</p>
            <p className="text-gray-600">Confirmed</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Clock className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">6.5h</p>
            <p className="text-gray-600">Scheduled</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Users className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">24</p>
            <p className="text-gray-600">This Week</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Schedule New
            </button>
          </div>
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.id} className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">{apt.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {apt.client}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {apt.time}
                      </span>
                      <span>{apt.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {apt.status}
                    </span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
