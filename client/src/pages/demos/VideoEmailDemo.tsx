import { DemoBanner } from '@/components/ui/DemoBanner';
import { Video, Play, Send, Eye, TrendingUp } from 'lucide-react';

export default function VideoEmailDemo() {
  const videos = [
    { id: 1, title: 'Product Demo for Acme Corp', views: 12, sent: '2 days ago', thumbnail: 'AC' },
    { id: 2, title: 'Proposal Walkthrough - TechStart', views: 8, sent: '1 week ago', thumbnail: 'TS' },
    { id: 3, title: 'Follow-up Video for Global Solutions', views: 5, sent: '3 days ago', thumbnail: 'GS' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Video Email" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Video Email Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Video className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">47</p>
            <p className="text-gray-600">Videos Sent</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Eye className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">324</p>
            <p className="text-gray-600">Total Views</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">68%</p>
            <p className="text-gray-600">View Rate</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Send className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">89%</p>
            <p className="text-gray-600">Delivery Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Video Library</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center">
              <Video className="w-4 h-4 mr-2" />
              Record New Video
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map(video => (
              <div key={video.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-40 flex items-center justify-center relative">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-900">
                    {video.thumbnail}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-80" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{video.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center"><Eye className="w-4 h-4 mr-1" />{video.views} views</span>
                    <span>{video.sent}</span>
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
