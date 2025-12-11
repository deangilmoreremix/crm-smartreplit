import { DemoBanner } from '@/components/ui/DemoBanner';
import { Calendar, Clock, Users, Video, MapPin } from 'lucide-react';

export default function CalendarDemo() {
  const appointments = [
    { id: 1, title: 'Sales Demo - Acme Corp', time: '10:00 AM', duration: '1 hour', type: 'video', attendees: 3 },
    { id: 2, title: 'Follow-up Call - TechStart', time: '2:00 PM', duration: '30 mins', type: 'phone', attendees: 2 },
    { id: 3, title: 'Team Standup', time: '4:00 PM', duration: '15 mins', type: 'video', attendees: 8 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="AI Calendar" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Calendar Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-gray-600">Today's Meetings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Clock className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">6.5h</p>
            <p className="text-gray-600">Scheduled Time</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">24</p>
            <p className="text-gray-600">Participants</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {apt.type === 'video' ? <Video className="w-5 h-5 text-blue-600" /> : <MapPin className="w-5 h-5 text-green-600" />}
                  <div>
                    <p className="font-semibold">{apt.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{apt.time}</span>
                      <span>{apt.duration}</span>
                      <span className="flex items-center"><Users className="w-3 h-3 mr-1" />{apt.attendees} attendees</span>
                    </div>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
