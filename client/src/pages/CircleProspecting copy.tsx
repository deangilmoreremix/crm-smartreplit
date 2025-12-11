import React, { useState } from 'react';
import * as aiService from '../services/aiService';
import { Target, Search, Download, User, Home, MapPin, CreditCard, Database, Brain } from 'lucide-react';
// import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import { icon } from 'leaflet';

// Fix for default marker icon in Leaflet
// const defaultIcon = icon({
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

interface ProspectData {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  homeValue?: number;
  mortgageAmount?: number;
  lastRefinance?: string;
  income?: string;
  occupation?: string;
  lat: number;
  lng: number;
  score?: number;
}

const CircleProspecting: React.FC = () => {
  // const gemini = useGemini(); // Removed - using new AI service
  const [center, setCenter] = useState<[number, number]>([37.7749, -122.4194]); // San Francisco
  const [radius, setRadius] = useState<number>(1000); // Radius in meters
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  
  // Mock prospect data
  const [prospects, setProspects] = useState<ProspectData[]>([
    {
      id: '1',
      name: 'John Smith',
      address: '123 Market St, San Francisco, CA 94105',
      email: 'john.smith@example.com',
      phone: '(415) 555-1234',
      homeValue: 1250000,
      mortgageAmount: 850000,
      lastRefinance: '2023-05',
      income: '$180,000 - $220,000',
      occupation: 'Software Engineer',
      lat: 37.7749 + 0.003,
      lng: -122.4194 - 0.002,
      score: 85
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      address: '456 Mission St, San Francisco, CA 94105',
      email: 'sarah.j@example.com',
      phone: '(415) 555-5678',
      homeValue: 980000,
      mortgageAmount: 600000,
      lastRefinance: '2021-10',
      income: '$150,000 - $180,000',
      occupation: 'Marketing Director',
      lat: 37.7749 - 0.002,
      lng: -122.4194 + 0.004,
      score: 72
    },
    {
      id: '3',
      name: 'Michael Chen',
      address: '789 Howard St, San Francisco, CA 94103',
      email: 'michael.c@example.com',
      phone: '(415) 555-9012',
      homeValue: 1450000,
      mortgageAmount: 950000,
      lastRefinance: '2022-08',
      income: '$200,000 - $250,000',
      occupation: 'Product Manager',
      lat: 37.7749 + 0.005,
      lng: -122.4194 + 0.003,
      score: 91
    },
    {
      id: '4',
      name: 'Emily Davis',
      address: '321 Folsom St, San Francisco, CA 94105',
      email: 'emily.d@example.com',
      phone: '(415) 555-3456',
      homeValue: 1100000,
      mortgageAmount: 750000,
      lastRefinance: '2022-03',
      income: '$160,000 - $190,000',
      occupation: 'Financial Analyst',
      lat: 37.7749 - 0.004,
      lng: -122.4194 - 0.005,
      score: 68
    },
  ]);
  
  const handleSearch = () => {
    setIsSearching(true);
    
    // In a real app, we would geocode the address here
    // For demo purposes, we'll just simulate a search
    setTimeout(() => {
      // Slightly adjust the map center for demo
      setCenter([37.7749 + Math.random() * 0.01, -122.4194 + Math.random() * 0.01]);
      setIsSearching(false);
    }, 1500);
  };
  
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRadius(parseInt(e.target.value));
  };
  
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    
    try {
      // Generate market trend analysis for the area
      const insight = await aiService.analyzeMarketTrends(
        "Real Estate",
        "San Francisco Bay Area homeowners",
        "next 6 months"
      );
      
      setAiInsight(insight);
    } catch (error) {
      console.error("Failed to generate AI insight:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const prospectsInRadius = prospects.filter(prospect => {
    // In a real app, we would calculate the distance between center and each prospect
    // For demo purposes, we'll assume all prospects are within the radius
    return true;
  });
  
  const getMarkerColor = (score?: number) => {
    if (!score) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 70) return 'blue';
    if (score >= 60) return 'orange';
    return 'red';
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Circle Prospecting</h1>
          <p className="text-gray-600 mt-1">Target prospects by location and generate neighborhood insights</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Search Area</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address or Location
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="address"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Enter address, neighborhood, or zip code"
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isSearching ? (
                      <span className="animate-pulse">Searching...</span>
                    ) : (
                      <>
                        <Search size={16} className="mr-1" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                  Radius: {(radius / 1000).toFixed(1)} km
                </label>
                <input
                  type="range"
                  id="radius"
                  min="200"
                  max="5000"
                  step="100"
                  value={radius}
                  onChange={handleRadiusChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Points to Include:</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="homeowner"
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="homeowner" className="ml-2 block text-sm text-gray-700">
                      Homeowner Status
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="contact"
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="contact" className="ml-2 block text-sm text-gray-700">
                      Contact Information
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="mortgage"
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="mortgage" className="ml-2 block text-sm text-gray-700">
                      Mortgage Data
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="income"
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="income" className="ml-2 block text-sm text-gray-700">
                      Income Range
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain size={16} className="mr-1" />
                      Generate Area Insights
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {aiInsight && (
            <div className="bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-100">
              <div className="flex items-center mb-3">
                <Brain size={18} className="text-blue-600 mr-2" />
                <h3 className="text-md font-semibold text-gray-900">AI Market Insights</h3>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-line">
                {aiInsight}
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{prospectsInRadius.length} Prospects Found</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setViewMode('map')}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm leading-4 font-medium rounded-md focus:outline-none ${
                    viewMode === 'map' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin size={16} className="mr-1" />
                  Map
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm leading-4 font-medium rounded-md focus:outline-none ${
                    viewMode === 'list' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Database size={16} className="mr-1" />
                  List
                </button>
              </div>
            </div>
            
            {viewMode === 'map' && (
              <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Map functionality temporarily disabled</p>
                  <p className="text-sm text-gray-400 mt-1">Switch to list view to see prospects</p>
                </div>
              </div>
            )}
            
            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Home Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mortgage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prospectsInRadius.map(prospect => (
                      <tr key={prospect.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{prospect.name}</div>
                              <div className="text-sm text-gray-500">{prospect.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{prospect.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${prospect.homeValue?.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${prospect.mortgageAmount?.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Last refi: {prospect.lastRefinance}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            getMarkerColor(prospect.score) === 'green' ? 'bg-green-100 text-green-800' :
                            getMarkerColor(prospect.score) === 'blue' ? 'bg-blue-100 text-blue-800' :
                            getMarkerColor(prospect.score) === 'orange' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {prospect.score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-2">Add to Campaign</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <Target size={16} className="mr-1" />
              Add to Campaign
            </button>
            
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download size={16} className="mr-1" />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleProspecting;