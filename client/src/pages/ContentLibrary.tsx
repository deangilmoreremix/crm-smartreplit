import React, { useState, useEffect } from 'react';
import { FileText, Video, Headphones, Trash2, Plus, Search, Filter, RefreshCw, X, Music } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'podcast' | 'audiobook' | 'video' | 'voice_over';
  url: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

const ContentLibrary: React.FC = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // New content item form
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<'podcast' | 'audiobook' | 'video' | 'voice_over'>('podcast');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock data for demo
  useEffect(() => {
    const mockData: ContentItem[] = [
      {
        id: '1',
        title: 'Sales Mastery Podcast Episode 1',
        type: 'podcast',
        url: 'https://example.com/podcast1.mp3',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'The Art of Closing Deals',
        type: 'audiobook',
        url: 'https://example.com/audiobook1.mp3',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Product Demo Video',
        type: 'video',
        url: 'https://example.com/video1.mp4',
        created_at: new Date().toISOString(),
      },
    ];
    setContentItems(mockData);
  }, []);
  
  const loadContentItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would fetch from an API
      // For now, we're using the mock data from useEffect
    } catch (err) {
      console.error("Error loading content items:", err);
      setError('Failed to load content library');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        title: newItemTitle,
        type: newItemType,
        url: newItemUrl,
        created_at: new Date().toISOString(),
      };
      
      setContentItems([...contentItems, newItem]);
      
      // Reset form and close
      setNewItemTitle('');
      setNewItemType('podcast');
      setNewItemUrl('');
      setShowAddForm(false);
      
    } catch (err) {
      console.error("Error adding content item:", err);
      setError('Failed to add content item');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setIsDeleting(id);
    try {
      setContentItems(contentItems.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting content item:", err);
      setError('Failed to delete content item');
    } finally {
      setIsDeleting(null);
    }
  };
  
  // Filter content items
  const filteredItems = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'podcast':
        return <Headphones className="h-5 w-5 text-purple-500" />;
      case 'audiobook':
        return <Music className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'voice_over':
        return <Headphones className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-1">Manage your media content and voice profiles</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Add Content
          </button>
        </div>
      </header>
      
      {/* Search and Filter */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input 
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="podcast">Podcasts</option>
              <option value="audiobook">Audiobooks</option>
              <option value="video">Videos</option>
              <option value="voice_over">Voice Overs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Add Content Form */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Content</h2>
            <button 
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleAddContent} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter content title"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="podcast">Podcast</option>
                <option value="audiobook">Audiobook</option>
                <option value="video">Video</option>
                <option value="voice_over">Voice Over</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                id="url"
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://example.com/content.mp3"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Content'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading content...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'No content matches your search criteria' 
              : 'Start building your content library by adding your first item'
            }
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={18} className="mr-1" />
            Add Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{item.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isDeleting === item.id}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                >
                  {isDeleting === item.id ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
              
              <div className="space-y-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm break-all"
                >
                  {item.url}
                </a>
                {item.created_at && (
                  <p className="text-xs text-gray-500">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentLibrary;