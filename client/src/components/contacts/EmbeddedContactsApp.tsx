import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Users, 
  Brain,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Star,
  Mail,
  Phone,
  Building2,
  Tag,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Video,
  Calendar
} from 'lucide-react';
import { useContactStore } from '../../hooks/useContactStore';
import { Contact } from '../../types/contact';
import EnhancedContactCard from './EnhancedContactCard';
import ProfessionalContactModal from './ProfessionalContactModal';
import AdvancedContactFilter from './AdvancedContactFilter';

interface EmbeddedContactsAppProps {
  onContactSelect?: (contact: Contact) => void;
  onContactCreate?: (contact: Contact) => void;
  onContactUpdate?: (contact: Contact) => void;
  onContactDelete?: (contactId: string) => void;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  compactMode?: boolean;
}

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

const EmbeddedContactsApp: React.FC<EmbeddedContactsAppProps> = ({
  onContactSelect,
  onContactCreate,
  onContactUpdate,
  onContactDelete,
  className = '',
  maxHeight = '80vh',
  showHeader = true,
  compactMode = false
}) => {
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
    addContact,
    updateContact,
    deleteContact,
    analyzeContact,
    enrichContact
  } = useContactStore();

  // Local state for embedded app
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState<Contact | null>(null);
  const [contactModalMode, setContactModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'score' | 'lastContact'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>({
    status: [],
    interestLevel: [],
    industry: [],
    tags: [],
    scoreRange: { min: 0, max: 100 },
    location: [],
    source: [],
    isFavorite: undefined,
    hasCustomFields: undefined,
    lastContactDays: undefined
  });

  // Initialize contacts on mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Convert contacts object to array and apply filtering/sorting
  const contactsArray = useMemo(() => {
    let contactList = Array.isArray(contacts) ? contacts : Object.values(contacts || {});
    
    // Apply search filter
    if (searchTerm) {
      contactList = searchContacts(searchTerm);
    }

    // Apply advanced filters
    contactList = contactList.filter(contact => {
      // Status filter
      if (activeFilters.status.length > 0 && !activeFilters.status.includes(contact.status)) {
        return false;
      }
      
      // Interest level filter
      if (activeFilters.interestLevel.length > 0 && 
          contact.interestLevel && 
          !activeFilters.interestLevel.includes(contact.interestLevel)) {
        return false;
      }
      
      // Industry filter
      if (activeFilters.industry.length > 0 && 
          contact.industry && 
          !activeFilters.industry.includes(contact.industry)) {
        return false;
      }
      
      // Tags filter
      if (activeFilters.tags.length > 0 && contact.tags) {
        const hasMatchingTag = activeFilters.tags.some(tag => 
          contact.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }
      
      // Score range filter
      if (contact.aiScore !== undefined) {
        const score = contact.aiScore || 0;
        if (score < activeFilters.scoreRange.min || score > activeFilters.scoreRange.max) {
          return false;
        }
      }
      
      // Favorite filter
      if (activeFilters.isFavorite !== undefined && 
          contact.isFavorite !== activeFilters.isFavorite) {
        return false;
      }

      return true;
    });

    // Apply sorting
    contactList.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = a.name || `${a.firstName} ${a.lastName}`;
          valueB = b.name || `${b.firstName} ${b.lastName}`;
          break;
        case 'company':
          valueA = a.company || '';
          valueB = b.company || '';
          break;
        case 'score':
          valueA = a.aiScore || 0;
          valueB = b.aiScore || 0;
          break;
        case 'lastContact':
          valueA = a.lastContact ? new Date(a.lastContact).getTime() : 0;
          valueB = b.lastContact ? new Date(b.lastContact).getTime() : 0;
          break;
        default:
          valueA = a.name || `${a.firstName} ${a.lastName}`;
          valueB = b.name || `${b.firstName} ${b.lastName}`;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      return sortOrder === 'asc' 
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });

    return contactList;
  }, [contacts, searchTerm, searchContacts, activeFilters, sortBy, sortOrder]);

  // Handle contact actions
  const handleContactView = (contact: Contact) => {
    setSelectedContactForModal(contact);
    setContactModalMode('view');
    onContactSelect?.(contact);
  };

  const handleContactEdit = (contact: Contact) => {
    setSelectedContactForModal(contact);
    setContactModalMode('edit');
  };

  const handleContactDelete = async (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact(contactId);
      onContactDelete?.(contactId);
    }
  };

  const handleContactCreate = () => {
    setSelectedContactForModal(null);
    setContactModalMode('create');
  };

  const handleModalClose = () => {
    setSelectedContactForModal(null);
    setContactModalMode('view');
  };

  const handleContactSave = (contactData: any) => {
    if (contactModalMode === 'create') {
      const newContact = addContact(contactData);
      onContactCreate?.(newContact);
    } else if (contactModalMode === 'edit' && selectedContactForModal) {
      updateContact(selectedContactForModal.id, contactData);
      onContactUpdate?.({ ...selectedContactForModal, ...contactData });
    }
    handleModalClose();
  };

  const handleAnalyzeContact = async (contactId: string) => {
    await analyzeContact(contactId);
  };

  const handleEnrichContact = async (contactId: string) => {
    await enrichContact(contactId);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Contacts</h2>
                <p className="text-blue-100 text-sm">
                  {contactsArray.length} contacts • {selectedContacts.length} selected
                </p>
              </div>
            </div>
            <button
              onClick={handleContactCreate}
              className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showAdvancedFilter
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filter */}
        {showAdvancedFilter && (
          <div className="mt-4">
            <AdvancedContactFilter
              isOpen={showAdvancedFilter}
              onClose={() => setShowAdvancedFilter(false)}
              onApplyFilters={setActiveFilters}
              onClearFilters={() => setActiveFilters({
                status: [],
                interestLevel: [],
                industry: [],
                tags: [],
                scoreRange: { min: 0, max: 100 },
                location: [],
                source: [],
                isFavorite: undefined,
                hasCustomFields: undefined,
                lastContactDays: undefined
              })}
              contacts={contactsArray}
              currentFilters={activeFilters}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="overflow-auto" style={{ maxHeight }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            <p>Error loading contacts: {error}</p>
          </div>
        ) : contactsArray.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p>No contacts found</p>
            <button
              onClick={handleContactCreate}
              className="mt-4 flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Contact</span>
            </button>
          </div>
        ) : (
          <div className="p-4">
            {viewMode === 'grid' ? (
              <div className={`grid gap-4 ${compactMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {contactsArray.map((contact) => (
                  <EnhancedContactCard
                    key={contact.id}
                    contact={contact}
                    onView={handleContactView}
                    onEdit={handleContactEdit}
                    onDelete={handleContactDelete}
                    isSelected={selectedContacts.includes(contact.id)}
                    onSelect={toggleContactSelection}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {contactsArray.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleContactView(contact)}
                  >
                    <img
                      src={contact.avatarSrc || contact.avatar}
                      alt={contact.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {contact.name || `${contact.firstName} ${contact.lastName}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {contact.company} • {contact.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {contact.aiScore && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          contact.aiScore >= 80 ? 'bg-green-100 text-green-800' :
                          contact.aiScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {contact.aiScore}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactEdit(contact);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <ProfessionalContactModal
        isOpen={contactModalMode === 'create' || !!selectedContactForModal}
        onClose={handleModalClose}
        contact={selectedContactForModal || undefined}
        mode={contactModalMode}
      />
    </div>
  );
};

export default EmbeddedContactsApp;