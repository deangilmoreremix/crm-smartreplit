import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Star,
  ExternalLink,
  Eye,
  Edit,
  MoreHorizontal,
  User,
  Calendar,
  Activity
} from 'lucide-react';

const ContactsDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [animateContacts, setAnimateContacts] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateContacts(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const demoContacts = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@acmecorp.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corporation',
      position: 'VP of Sales',
      location: 'New York, NY',
      status: 'hot',
      lastContact: '2 days ago',
      dealValue: '$15,000',
      avatar: 'SJ',
      rating: 5,
      tags: ['Enterprise', 'Decision Maker'],
      notes: 'Very interested in our premium package. Follow up on contract terms.'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'mchen@techstart.io',
      phone: '+1 (555) 987-6543',
      company: 'TechStart Inc',
      position: 'CEO',
      location: 'San Francisco, CA',
      status: 'warm',
      lastContact: '5 days ago',
      dealValue: '$8,500',
      avatar: 'MC',
      rating: 4,
      tags: ['Startup', 'Tech'],
      notes: 'Interested in our basic plan. Needs demo of advanced features.'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@globalsolutions.com',
      phone: '+1 (555) 456-7890',
      company: 'Global Solutions Ltd',
      position: 'Marketing Director',
      location: 'Chicago, IL',
      status: 'cold',
      lastContact: '2 weeks ago',
      dealValue: '$12,000',
      avatar: 'ER',
      rating: 3,
      tags: ['Marketing', 'Large Company'],
      notes: 'Initial interest shown. Waiting for budget approval next quarter.'
    },
    {
      id: 4,
      name: 'David Park',
      email: 'dpark@innovatetech.com',
      phone: '+1 (555) 321-0987',
      company: 'InnovateTech',
      position: 'CTO',
      location: 'Austin, TX',
      status: 'hot',
      lastContact: 'Yesterday',
      dealValue: '$22,000',
      avatar: 'DP',
      rating: 5,
      tags: ['Technical', 'High Value'],
      notes: 'Ready to move forward. Reviewing final proposal this week.'
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      email: 'lisa@smartbiz.com',
      phone: '+1 (555) 654-3210',
      company: 'SmartBiz Solutions',
      position: 'Operations Manager',
      location: 'Denver, CO',
      status: 'warm',
      lastContact: '1 week ago',
      dealValue: '$6,800',
      avatar: 'LT',
      rating: 4,
      tags: ['Operations', 'Mid-Market'],
      notes: 'Comparing with competitors. Emphasized our unique AI features.'
    }
  ];

  const filteredContacts = demoContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || contact.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ContactCard = ({ contact, index }: { contact: any; index: number }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-500 hover:shadow-lg cursor-pointer border-l-4 ${
        contact.status === 'hot' ? 'border-red-400' :
        contact.status === 'warm' ? 'border-yellow-400' :
        'border-blue-400'
      } ${animateContacts ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onClick={() => setSelectedContact(selectedContact === contact.id ? null : contact.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {contact.avatar}
          </div>
          <div className="flex-grow">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                {contact.status}
              </span>
            </div>
            <p className="text-gray-600 mb-1">{contact.position}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Building className="w-4 h-4" />
                <span>{contact.company}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{contact.location}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-green-600 mb-1">{contact.dealValue}</div>
          <div className="flex items-center space-x-1">
            {[...Array(contact.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
        </div>
      </div>

      {selectedContact === contact.id && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{contact.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{contact.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Last contact: {contact.lastContact}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag: string, tagIndex: number) => (
                  <span key={tagIndex} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Notes:</strong> {contact.notes}
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Demo Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts Demo</h1>
            <p className="text-gray-600 mt-2">Smart contact management with AI-powered insights</p>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ✓ Interactive Demo
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Contacts</option>
              <option value="hot">Hot Leads</option>
              <option value="warm">Warm Leads</option>
              <option value="cold">Cold Leads</option>
            </select>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{demoContacts.length}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="text-2xl font-bold text-red-600">{demoContacts.filter(c => c.status === 'hot').length}</p>
            </div>
            <Activity className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${demoContacts.reduce((sum, c) => sum + parseInt(c.dealValue.replace(/[^0-9]/g, '')), 0).toLocaleString()}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-600">
                {(demoContacts.reduce((sum, c) => sum + c.rating, 0) / demoContacts.length).toFixed(1)}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="space-y-6">
        {filteredContacts.map((contact, index) => (
          <ContactCard key={contact.id} contact={contact} index={index} />
        ))}
      </div>

      {/* Demo CTA */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to Organize Your Contacts?</h3>
            <p className="opacity-90">Import, manage, and engage with your contacts using AI-powered insights</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center">
              Start Free Trial
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Import Contacts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsDemo;