// src/pages/Contacts.tsx (formerly ContactsEnhanced.tsx)

import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import {
  Plus,
  Search,
  Brain,
  Grid3X3,
  List,
  ChevronDown,
  Users,
  Sliders,
  MessageSquare,
  Calendar,
  Phone,
  Zap
} from 'lucide-react';
import { useContactStore } from '../hooks/useContactStore';
// REMOVE THIS LINE: import { ContactsModal } from '../components/modals/ContactsModal';
import { AIEnhancedContactCard } from '../components/contacts/AIEnhancedContactCard';
import AdvancedContactFilter from '../components/contacts/AdvancedContactFilter';
import ProfessionalContactModal from '../components/contacts/ProfessionalContactModal';
import EmailComposer from '../components/communications/EmailComposer';
import CommunicationHub from '../components/communications/CommunicationHub';
import ContactAutomation from '../components/communications/ContactAutomation';
import CallLogging from '../components/communications/CallLogging';
import MeetingScheduler from '../components/communications/MeetingScheduler';
import { Contact } from '../types/contact';
import { Button } from '../components/ui/button';

interface FilterCriteria {
  status: string[];
  interestLevel: string[];
  industry: string[];
  tags: string[];
  scoreRange: { min: number; max: number };
  location: string[];
  source: string[];
  isFavorite?: boolean;
  hasCustomFields?: boolean;
  lastContactDays?: number;
}

const ContactsEnhanced: React.FC = () => {
  const {
    contacts,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    searchContacts,
    selectedContacts,
    toggleContactSelection,
    selectAllContacts,
    clearSelection,
    fetchContacts,
    deleteContact,
    analyzeContact,
    enrichContact
  } = useContactStore();

  // REMOVE THIS LINE: const [showContactsModal, setShowContactsModal] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'contacts' | 'communication' | 'automation' | 'calls' | 'meetings'>('contacts');
  const [selectedContactForModal, setSelectedContactForModal] = useState<Contact | null>(null);
  const [contactModalMode, setContactModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'score' | 'lastContact'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria>({
    status: [],
    interestLevel: [],
    industry: [],
    tags: [],
    scoreRange: { min: 0, max: 100 },
    location: [],
    source: []
  });

  const contactsArray = Object.values(contacts);

  // Initialize store
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Apply search and advanced filters - optimized memoization
  const filteredContacts = useMemo(() => {
    let filtered = contactsArray;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = searchContacts(searchTerm);
    }

    // Apply advanced filters
    if (currentFilters.status.length > 0) {
      filtered = filtered.filter(contact => currentFilters.status.includes(contact.status));
    }

    if (currentFilters.interestLevel.length > 0) {
      filtered = filtered.filter(contact =>
        contact.interestLevel && currentFilters.interestLevel.includes(contact.interestLevel)
      );
    }

    if (currentFilters.industry.length > 0) {
      filtered = filtered.filter(contact =>
        contact.industry && currentFilters.industry.includes(contact.industry)
      );
    }

    if (currentFilters.tags.length > 0) {
      filtered = filtered.filter(contact =>
        contact.tags && contact.tags.some(tag => currentFilters.tags.includes(tag))
      );
    }

    if (currentFilters.source.length > 0) {
      filtered = filtered.filter(contact => {
        const contactSources = (contact.sources || [contact.source])
          .filter((source): source is string => typeof source === 'string');
        return contactSources.some(source => currentFilters.source.includes(source));
      });
    }

    // Score range filter
    filtered = filtered.filter(contact => {
      const score = contact.aiScore || contact.score || 0;
      return score >= currentFilters.scoreRange.min && score <= currentFilters.scoreRange.max;
    });

    // Favorites filter
    if (currentFilters.isFavorite) {
      filtered = filtered.filter(contact => contact.isFavorite);
    }

    // Custom fields filter
    if (currentFilters.hasCustomFields) {
      filtered = filtered.filter(contact =>
        contact.customFields && Object.keys(contact.customFields).length > 0
      );
    }

    // Last contact days filter
    if (currentFilters.lastContactDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - currentFilters.lastContactDays);
      filtered = filtered.filter(contact =>
        contact.lastContact && new Date(contact.lastContact) >= cutoffDate
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'lastContact') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (sortBy === 'score') {
        aVal = a.aiScore || a.score || 0;
        bVal = b.aiScore || b.score || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [contactsArray, searchTerm, searchContacts, currentFilters, sortBy, sortOrder]);

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    try {
      const promises = selectedContacts.length > 0
        ? selectedContacts.map(id => analyzeContact(id))
        : filteredContacts.slice(0, 10).map(contact => analyzeContact(contact.id));

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to analyze contacts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEnrichSelected = () => {
    if (selectedContacts.length === 0) return;

    if (confirm(`Enrich ${selectedContacts.length} contacts?`)) {
      selectedContacts.forEach(id => enrichContact(id));
      clearSelection();
    }
  };

  const handleDeleteSelected = () => {
    if (selectedContacts.length === 0) return;

    if (confirm(`Delete ${selectedContacts.length} contacts? This action cannot be undone.`)) {
      selectedContacts.forEach(id => deleteContact(id));
      clearSelection();
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContactForModal(contact);
    setContactModalMode('view');
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContactForModal(contact);
    setContactModalMode('edit');
  };

  // UPDATED: also reset mode so create-mode can close
  const handleCloseContactModal = () => {
    setSelectedContactForModal(null);
    setContactModalMode('view'); // <-- important
  };

  const handleApplyFilters = (filters: FilterCriteria) => {
    setCurrentFilters(filters);
  };

  const handleClearFilters = () => {
    setCurrentFilters({
      status: [],
      interestLevel: [],
      industry: [],
      tags: [],
      scoreRange: { min: 0, max: 100 },
      location: [],
      source: []
    });
  };

  const hasActiveFilters = () => {
    return currentFilters.status.length > 0 ||
           currentFilters.interestLevel.length > 0 ||
           currentFilters.industry.length > 0 ||
           currentFilters.tags.length > 0 ||
           currentFilters.source.length > 0 ||
           currentFilters.isFavorite ||
           currentFilters.hasCustomFields ||
           currentFilters.lastContactDays ||
           currentFilters.scoreRange.min > 0 ||
           currentFilters.scoreRange.max < 100;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Enhanced Contacts"
      description="AI-powered contact management with advanced filtering and insights"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing}
            variant="secondary"
          >
            <Brain size={18} className="mr-1" />
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
          <Button
            onClick={() => {
              setSelectedContactForModal(null);
              setContactModalMode('create');
            }}
          >
            <Plus size={18} className="mr-1" />
            Add Contact
          </Button>
        </div>
      }
    >

      {/* Stats Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredContacts.length}</span> contacts
              {filteredContacts.length !== contactsArray.length && (
                <span className="text-gray-500 ml-1">of {contactsArray.length}</span>
              )}
            </div>
            {selectedContacts.length > 0 && (
              <div className="text-sm text-blue-600">
                <span className="font-semibold">{selectedContacts.length}</span> selected
              </div>
            )}
          </div>

          {selectedContacts.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEnrichSelected}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                Enrich Selected
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 lg:mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Advanced Filter */}
            <button
              onClick={() => setShowAdvancedFilter(true)}
              className={`inline-flex items-center px-3 py-2 border rounded-md transition-colors ${
                hasActiveFilters()
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Sliders size={16} className="mr-1" />
              Filters
              {hasActiveFilters() && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  •
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="company-asc">Company A-Z</option>
                <option value="company-desc">Company Z-A</option>
                <option value="score-desc">Score High-Low</option>
                <option value="score-asc">Score Low-High</option>
                <option value="lastContact-desc">Recent Contact</option>
                <option value="lastContact-asc">Oldest Contact</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600 border-r border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border-r border-gray-300'
                }`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={16} />
              </button>
            </div>

            {/* Select All */}
            <button
              onClick={() => selectAllContacts(filteredContacts)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Users size={16} className="mr-1" />
              {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users size={18} />
                <span>Contacts</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('communication')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'communication'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare size={18} />
                <span>Communication Hub</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('automation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'automation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap size={18} />
                <span>Automation</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'calls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Phone size={18} />
                <span>Call Logging</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('meetings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'meetings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={18} />
                <span>Meeting Scheduler</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'contacts' && (
        <>
          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900">Loading contacts...</h3>
              <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your contacts</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-red-400 flex items-center justify-center">
                ⚠️
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading contacts</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => fetchContacts()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Contacts Grid/List */}
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || hasActiveFilters()
                      ? 'Try adjusting your search or filters'
                      : 'Get started by adding your first contact'
                    }
                  </p>
                  {(!searchTerm && !hasActiveFilters()) && (
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setSelectedContactForModal(null);
                          setContactModalMode('create');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Add Contact
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }>
                  {filteredContacts.map((contact) => (
                    <AIEnhancedContactCard
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedContacts.includes(contact.id)}
                      onSelect={toggleContactSelection}
                      onEdit={handleEditContact}
                      onDelete={(id) => {
                        if (confirm('Delete this contact? This action cannot be undone.')) {
                          deleteContact(id);
                        }
                      }}
                      onView={handleViewContact}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-6">
          <EmailComposer />
          <CommunicationHub />
        </div>
      )}

      {activeTab === 'automation' && <ContactAutomation />}

      {activeTab === 'calls' && <CallLogging />}

      {activeTab === 'meetings' && <MeetingScheduler />}

      {/* Modals */}
      <AdvancedContactFilter
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        contacts={contactsArray}
        currentFilters={currentFilters}
      />

      {/* UPDATED: open when creating OR when a contact is selected */}
      <ProfessionalContactModal
        isOpen={contactModalMode === 'create' || !!selectedContactForModal}
        onClose={handleCloseContactModal}
        contact={selectedContactForModal || undefined}
        mode={contactModalMode}
      />
    </PageLayout>
  );
};

export default ContactsEnhanced;
