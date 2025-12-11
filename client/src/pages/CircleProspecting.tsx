import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Users, Building, Phone, Mail, Globe, Plus, Target, ArrowRight, RefreshCw } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';

interface Business {
  id: string;
  name: string;
  industry: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  employees?: string;
  revenue?: string;
  distance?: number;
  prospectingScore?: number;
  lastContact?: Date;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

interface ProspectingCircle {
  id: string;
  name: string;
  centerAddress: string;
  radius: number; // in miles
  industries: string[];
  filters: {
    minEmployees?: number;
    maxEmployees?: number;
    minRevenue?: number;
    maxRevenue?: number;
  };
  businesses: Business[];
  createdAt: Date;
  lastUpdated: Date;
}

const CircleProspecting: React.FC = () => {
  const [circles, setCircles] = useState<ProspectingCircle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<ProspectingCircle | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    centerAddress: '',
    radius: 5,
    industries: [] as string[],
    minEmployees: '',
    maxEmployees: '',
    minRevenue: '',
    maxRevenue: ''
  });
  
  const industryOptions = [
    'Technology',
    'Healthcare',
    'Finance',
    'Real Estate',
    'Manufacturing',
    'Retail',
    'Professional Services',
    'Construction',
    'Education',
    'Hospitality',
    'Transportation',
    'Other'
  ];
  
  // Mock data initialization
  useEffect(() => {
    const mockCircles: ProspectingCircle[] = [
      {
        id: '1',
        name: 'Downtown Tech Corridor',
        centerAddress: '123 Main St, San Francisco, CA',
        radius: 3,
        industries: ['Technology', 'Professional Services'],
        filters: {
          minEmployees: 10,
          maxEmployees: 500
        },
        businesses: [
          {
            id: '1',
            name: 'TechStart Solutions',
            industry: 'Technology',
            address: '456 Tech Ave, San Francisco, CA',
            phone: '+1-555-0123',
            email: 'info@techstart.com',
            website: 'https://techstart.com',
            employees: '50-100',
            revenue: '$5M-$10M',
            distance: 0.8,
            prospectingScore: 85,
            status: 'new'
          },
          {
            id: '2',
            name: 'Innovation Labs Inc',
            industry: 'Technology',
            address: '789 Innovation Blvd, San Francisco, CA',
            phone: '+1-555-0456',
            email: 'contact@innovlabs.com',
            website: 'https://innovlabs.com',
            employees: '25-50',
            revenue: '$2M-$5M',
            distance: 1.2,
            prospectingScore: 78,
            lastContact: new Date(Date.now() - 86400000), // yesterday
            status: 'contacted'
          },
          {
            id: '3',
            name: 'Digital Strategy Group',
            industry: 'Professional Services',
            address: '321 Business Way, San Francisco, CA',
            phone: '+1-555-0789',
            email: 'hello@digitalstrategy.com',
            employees: '10-25',
            revenue: '$1M-$2M',
            distance: 2.1,
            prospectingScore: 72,
            status: 'qualified'
          }
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: '2',
        name: 'Financial District',
        centerAddress: '100 Wall St, San Francisco, CA',
        radius: 2,
        industries: ['Finance', 'Professional Services'],
        filters: {
          minEmployees: 50,
          minRevenue: 5000000
        },
        businesses: [
          {
            id: '4',
            name: 'Capital Investment Partners',
            industry: 'Finance',
            address: '200 Financial Plaza, San Francisco, CA',
            phone: '+1-555-1234',
            email: 'partnerships@capitalinvest.com',
            website: 'https://capitalinvest.com',
            employees: '100-250',
            revenue: '$25M+',
            distance: 0.5,
            prospectingScore: 92,
            status: 'converted'
          }
        ],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    setCircles(mockCircles);
    if (mockCircles.length > 0) {
      setSelectedCircle(mockCircles[0]);
    }
  }, []);
  
  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const newCircle: ProspectingCircle = {
        id: Date.now().toString(),
        name: formData.name,
        centerAddress: formData.centerAddress,
        radius: formData.radius,
        industries: formData.industries,
        filters: {
          minEmployees: formData.minEmployees ? parseInt(formData.minEmployees) : undefined,
          maxEmployees: formData.maxEmployees ? parseInt(formData.maxEmployees) : undefined,
          minRevenue: formData.minRevenue ? parseInt(formData.minRevenue) : undefined,
          maxRevenue: formData.maxRevenue ? parseInt(formData.maxRevenue) : undefined
        },
        businesses: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      setCircles([...circles, newCircle]);
      setSelectedCircle(newCircle);
      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        name: '',
        centerAddress: '',
        radius: 5,
        industries: [],
        minEmployees: '',
        maxEmployees: '',
        minRevenue: '',
        maxRevenue: ''
      });
      
      // Simulate searching for businesses
      searchBusinesses(newCircle.id);
    } catch (err) {
      setError('Failed to create prospecting circle');
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchBusinesses = async (circleId: string) => {
    setIsSearching(true);
    
    try {
      // Simulate API call to find businesses
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockBusinesses: Business[] = [
        {
          id: `${Date.now()}-1`,
          name: 'Local Business Solutions',
          industry: formData.industries[0] || 'Professional Services',
          address: `${formData.centerAddress} Area`,
          phone: '+1-555-9999',
          email: 'info@localbiz.com',
          employees: '10-25',
          revenue: '$1M-$5M',
          distance: Math.random() * formData.radius,
          prospectingScore: Math.floor(Math.random() * 30) + 70,
          status: 'new'
        }
      ];
      
      setCircles(circles.map(circle => 
        circle.id === circleId 
          ? { ...circle, businesses: mockBusinesses, lastUpdated: new Date() }
          : circle
      ));
      
      if (selectedCircle?.id === circleId) {
        setSelectedCircle(prev => prev ? { ...prev, businesses: mockBusinesses } : null);
      }
    } catch (err) {
      setError('Failed to search for businesses');
    } finally {
      setIsSearching(false);
    }
  };
  
  const updateBusinessStatus = async (businessId: string, newStatus: Business['status']) => {
    if (!selectedCircle) return;
    
    const updatedBusinesses = selectedCircle.businesses.map(biz =>
      biz.id === businessId 
        ? { ...biz, status: newStatus, lastContact: new Date() }
        : biz
    );
    
    const updatedCircle = { ...selectedCircle, businesses: updatedBusinesses };
    setSelectedCircle(updatedCircle);
    setCircles(circles.map(circle => 
      circle.id === selectedCircle.id ? updatedCircle : circle
    ));
  };
  
  const getStatusColor = (status: Business['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Circle Prospecting</h1>
          <p className="text-gray-600 mt-1">Geographic prospecting to find local businesses</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            New Circle
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Prospecting Circles</h2>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {circles.length === 0 ? (
                <div className="p-6 text-center">
                  <Target size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No circles created yet</p>
                </div>
              ) : (
                circles.map((circle) => (
                  <div
                    key={circle.id}
                    onClick={() => setSelectedCircle(circle)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedCircle?.id === circle.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{circle.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {circle.businesses.length} businesses
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center mb-1">
                        <MapPin size={12} className="mr-1" />
                        {circle.radius}mi radius
                      </div>
                      <div className="flex items-center">
                        <Building size={12} className="mr-1" />
                        {circle.industries.join(', ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Circle Details and Businesses */}
        <div className="lg:col-span-2">
          {selectedCircle ? (
            <div className="space-y-6">
              {/* Circle Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{selectedCircle.name}</h2>
                  <button
                    onClick={() => searchBusinesses(selectedCircle.id)}
                    disabled={isSearching}
                    className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw size={14} className="animate-spin mr-1" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={14} className="mr-1" />
                        Refresh Search
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin size={16} className="mr-2" />
                      <span>{selectedCircle.centerAddress}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Target size={16} className="mr-2" />
                      <span>{selectedCircle.radius} mile radius</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building size={16} className="mr-2" />
                      <span>{selectedCircle.industries.join(', ')}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users size={16} className="mr-2" />
                      <span>
                        {selectedCircle.filters.minEmployees && `${selectedCircle.filters.minEmployees}+`}
                        {selectedCircle.filters.minEmployees && selectedCircle.filters.maxEmployees && '-'}
                        {selectedCircle.filters.maxEmployees && `${selectedCircle.filters.maxEmployees}`}
                        {(selectedCircle.filters.minEmployees || selectedCircle.filters.maxEmployees) && ' employees'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Businesses List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Found Businesses ({selectedCircle.businesses.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Filter size={16} className="text-gray-400" />
                      <select className="text-sm border rounded px-2 py-1">
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {selectedCircle.businesses.length === 0 ? (
                    <div className="p-8 text-center">
                      {isSearching ? (
                        <>
                          <RefreshCw className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-4" />
                          <p className="text-gray-500">Searching for businesses...</p>
                        </>
                      ) : (
                        <>
                          <Search size={48} className="mx-auto text-gray-300 mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h4>
                          <p className="text-gray-500 mb-4">Try adjusting your search criteria or refresh the search</p>
                          <button
                            onClick={() => searchBusinesses(selectedCircle.id)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Search size={16} className="mr-1" />
                            Search Businesses
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    selectedCircle.businesses.map((business) => (
                      <div key={business.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{business.name}</h4>
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(business.status)}`}>
                                {business.status}
                              </span>
                              {business.prospectingScore && (
                                <span className={`text-sm font-medium ${getScoreColor(business.prospectingScore)}`}>
                                  {business.prospectingScore}% match
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1 mb-3">
                              <div className="flex items-center">
                                <Building size={14} className="mr-2" />
                                <span>{business.industry}</span>
                                {business.employees && (
                                  <span className="ml-4">👥 {business.employees} employees</span>
                                )}
                                {business.revenue && (
                                  <span className="ml-4">💰 {business.revenue}</span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <MapPin size={14} className="mr-2" />
                                <span>{business.address}</span>
                                {business.distance && (
                                  <span className="ml-4">{business.distance.toFixed(1)} miles away</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              {business.phone && (
                                <a
                                  href={`tel:${business.phone}`}
                                  className="flex items-center text-blue-600 hover:text-blue-700"
                                >
                                  <Phone size={14} className="mr-1" />
                                  {business.phone}
                                </a>
                              )}
                              {business.email && (
                                <a
                                  href={`mailto:${business.email}`}
                                  className="flex items-center text-blue-600 hover:text-blue-700"
                                >
                                  <Mail size={14} className="mr-1" />
                                  Email
                                </a>
                              )}
                              {business.website && (
                                <a
                                  href={business.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-600 hover:text-blue-700"
                                >
                                  <Globe size={14} className="mr-1" />
                                  Website
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4 flex flex-col space-y-2">
                            {business.status === 'new' && (
                              <button
                                onClick={() => updateBusinessStatus(business.id, 'contacted')}
                                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                              >
                                Mark Contacted
                              </button>
                            )}
                            {business.status === 'contacted' && (
                              <button
                                onClick={() => updateBusinessStatus(business.id, 'qualified')}
                                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                              >
                                Mark Qualified
                              </button>
                            )}
                            {business.status === 'qualified' && (
                              <button
                                onClick={() => updateBusinessStatus(business.id, 'converted')}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Mark Converted
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Target size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Circle Selected</h3>
              <p className="text-gray-500 mb-4">
                Select a prospecting circle from the list or create a new one to get started
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Create Your First Circle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Circle Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Create Prospecting Circle</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateCircle} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Circle Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Downtown Tech District"
                />
              </div>
              
              <div>
                <label htmlFor="centerAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Center Address *
                </label>
                <input
                  type="text"
                  id="centerAddress"
                  value={formData.centerAddress}
                  onChange={(e) => setFormData({...formData, centerAddress: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., 123 Main St, San Francisco, CA"
                />
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Radius (miles)
                </label>
                <input
                  type="number"
                  id="radius"
                  value={formData.radius}
                  onChange={(e) => setFormData({...formData, radius: parseInt(e.target.value) || 5})}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Industries
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {industryOptions.map((industry) => (
                    <label key={industry} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.industries.includes(industry)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              industries: [...formData.industries, industry]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              industries: formData.industries.filter(i => i !== industry)
                            });
                          }
                        }}
                        className="rounded border-gray-300 mr-2"
                      />
                      <span className="text-sm">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minEmployees" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Employees
                  </label>
                  <input
                    type="number"
                    id="minEmployees"
                    value={formData.minEmployees}
                    onChange={(e) => setFormData({...formData, minEmployees: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 10"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxEmployees" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Employees
                  </label>
                  <input
                    type="number"
                    id="maxEmployees"
                    value={formData.maxEmployees}
                    onChange={(e) => setFormData({...formData, maxEmployees: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Circle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CircleProspecting;