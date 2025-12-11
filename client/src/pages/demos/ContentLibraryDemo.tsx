import { DemoBanner } from '@/components/ui/DemoBanner';
import { FileText, Image, Video, Download, Eye } from 'lucide-react';

export default function ContentLibraryDemo() {
  const content = [
    { id: 1, name: 'Product Brochure Q1 2024', type: 'document', size: '2.4 MB', downloads: 45 },
    { id: 2, name: 'Demo Video - Enterprise Plan', type: 'video', size: '125 MB', downloads: 89 },
    { id: 3, name: 'Marketing Banner Set', type: 'image', size: '8.7 MB', downloads: 23 },
    { id: 4, name: 'Sales Presentation Template', type: 'document', size: '4.1 MB', downloads: 67 },
    { id: 5, name: 'Customer Success Stories', type: 'document', size: '1.8 MB', downloads: 34 },
    { id: 6, name: 'Product Screenshots Collection', type: 'image', size: '12.3 MB', downloads: 56 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Content Library" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Content Library Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">234</p>
            <p className="text-gray-600">Total Files</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Download className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">1.2k</p>
            <p className="text-gray-600">Downloads</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Eye className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">3.4k</p>
            <p className="text-gray-600">Views</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Video className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">2.8 GB</p>
            <p className="text-gray-600">Storage Used</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Content Files</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Upload Content
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map(item => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  {item.type === 'document' && <FileText className="w-8 h-8 text-blue-600" />}
                  {item.type === 'video' && <Video className="w-8 h-8 text-purple-600" />}
                  {item.type === 'image' && <Image className="w-8 h-8 text-green-600" />}
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-600">{item.size}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {item.downloads}
                  </span>
                  <button className="text-blue-600 hover:underline">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
