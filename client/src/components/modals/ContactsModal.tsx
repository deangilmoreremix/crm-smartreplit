import React, { useState, useEffect, useMemo } from 'react';
import { AvatarWithStatus } from '../ui/AvatarWithStatus';
import { ModernButton } from '../ui/ModernButton';
import { ContactDetailView } from './ContactDetailView';
import { ImportContactsModal } from './ImportContactsModal';
import { NewContactModal } from './NewContactModal';
import { useContactStore } from '../../hooks/useContactStore';
import { Contact } from '../../types/contact';
import { AIEnhancedContactCard } from '../contacts/AIEnhancedContactCard';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import Fuse from 'fuse.js';
import { 
  X, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit,
  Plus,
  Users,
  ChevronDown,
  Brain,
  Download,
  Upload,
  Zap,
  CheckCheck,
  Grid3X3,
  List,
  ArrowUp,
  ArrowDown,
  Settings,
  Target,
  BarChart3,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Mail,
  Share2,
  Layers // Import Layers icon
} from 'lucide-react';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const interestColors = {
  hot: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  cold: 'bg-gray-400'
};

const interestLabels = {
  hot: 'Hot Client',
  medium: 'Medium Interest',
  low: 'Low Interest',
  cold: 'Non Interest'
};

const sourceColors: { [key: string]: string } = {
  'LinkedIn': 'bg-blue-600',
  'Facebook': 'bg-blue-500',
  'Email': 'bg-green-500',
  'Website': 'bg-purple-500',
  'Referral': 'bg-orange-500',
  'Typeform': 'bg-pink-500',
  'Cold Call': 'bg-gray-600'
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Hot Client', value: 'hot' },
  { label: 'Medium Interest', value: 'medium' },
  { label: 'Low Interest', value: 'low' },
  { label: 'Non Interest', value: 'cold' }
];

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Lead', value: 'lead' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Customer', value: 'customer' },
  { label: 'Churned', value: 'churned' }
];

export const ContactsModal: React.FC<ContactsModalProps> = ({ isOpen, onClose }) => {
  const { contacts, isLoading, updateContact, addContact, analyzeContact, enrichContact } = useContactStore();

  // UI State
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bulkActionDropdown, setBulkActionDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'score' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [analysisProgress, setAnalysisProgress] = useState<{current: number, total: number} | null>(null);
  const [aiResults, setAiResults] = useState<{success: number, failed: number} | null>(null);
  const [analyzingContactIds, setAnalyzingContactIds] = useState<string[]>([]);

  // Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);

  const contactsArray = Object.values(contacts);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(contactsArray, {
      keys: ['name', 'company', 'position', 'title', 'email', 'industry'],
      threshold: 0.3,
    });
  }, [contactsArray]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.keyCode === 27) {
        if (selectedContact) {
          setSelectedContact(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, selectedContact, onClose]);

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    let filtered = contactsArray;

    // Apply search filter
    if (searchTerm.trim()) {
      const results = fuse.search(searchTerm);
      filtered = results.map(result => result.item);
    }

    // Apply interest filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.interestLevel === activeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'score') {
        aVal = a.aiScore || a.score || 0;
        bVal = b.aiScore || b.score || 0;
      } else if (sortBy === 'updated') {
        aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
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

    return filtered;
  }, [contactsArray, fuse, searchTerm, activeFilter, statusFilter, sortBy, sortOrder]);

  // Handle bulk AI analysis
  const handleBulkAnalysis = async () => {
    const contactsToAnalyze = selectedContacts.length > 0 
      ? selectedContacts.map(id => contacts[id]).filter(Boolean)
      : filteredContacts.slice(0, 10);

    if (contactsToAnalyze.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: contactsToAnalyze.length });
    setAnalyzingContactIds(contactsToAnalyze.map(c => c.id));

    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < contactsToAnalyze.length; i++) {
        const contact = contactsToAnalyze[i];
        setAnalysisProgress({ current: i + 1, total: contactsToAnalyze.length });

        try {
          await analyzeContact(contact.id);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error(`Failed to analyze contact ${contact.name}:`, error);
        }
      }

      setAiResults({ success: successCount, failed: failedCount });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
      setAnalyzingContactIds([]);
      setSelectedContacts([]);
    }
  };

  // Toggle contact selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Select all filtered contacts
  const selectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  // Export contacts
  const handleExport = () => {
    const contactsToExport = selectedContacts.length > 0 
      ? selectedContacts.map(id => contacts[id]).filter(Boolean)
      : filteredContacts;

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Company,Position,Industry,Status,Interest Level,Score\n"
      + contactsToExport.map(contact => 
          `"${contact.name}","${contact.email}","${contact.company || ''}","${contact.position || ''}","${contact.industry || ''}","${contact.status}","${contact.interestLevel || ''}","${contact.aiScore || contact.score || 0}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contacts_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Smart Contacts</h2>
              <p className="text-sm text-gray-600">
                {filteredContacts.length} of {contactsArray.length} contacts
                {selectedContacts.length > 0 && ` • ${selectedContacts.length} selected`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DarkModeToggle />
            <ModernButton 
              onClick={onClose}
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </ModernButton>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search contacts by name, company, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              {/* Interest Filter */}
              <div className="relative">
                <ModernButton
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Filter className="w-4 h-4" />
                  <span>{filterOptions.find(f => f.value === activeFilter)?.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </ModernButton>

                {isFilterDropdownOpen && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setActiveFilter(option.value);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          activeFilter === option.value ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <ModernButton
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <span>{statusOptions.find(s => s.value === statusFilter)?.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </ModernButton>

                {isStatusDropdownOpen && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          statusFilter === option.value ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="score">Score</option>
                  <option value="updated">Updated</option>
                </select>
                <ModernButton
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </ModernButton>
              </div>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <ModernButton
                  onClick={() => setViewMode('card')}
                  variant={viewMode === 'card' ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none border-r-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </ModernButton>
                <ModernButton
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </ModernButton>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ModernButton
                onClick={selectAllContacts}
                variant="outline"
                size="sm"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
              </ModernButton>

              {selectedContacts.length > 0 && (
                <div className="relative">
                  <ModernButton
                    onClick={() => setBulkActionDropdown(!bulkActionDropdown)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Bulk Actions</span>
                    <ChevronDown className="w-4 h-4" />
                  </ModernButton>

                  {bulkActionDropdown && (
                    <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => {
                          handleBulkAnalysis();
                          setBulkActionDropdown(false);
                        }}
                        disabled={isAnalyzing}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 first:rounded-t-lg"
                      >
                        <Brain className="w-4 h-4" />
                        <span>AI Analysis</span>
                      </button>
                      <button
                        onClick={() => {
                          handleExport();
                          setBulkActionDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 last:rounded-b-lg"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Selected</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <ModernButton
                onClick={() => setIsImportModalOpen(true)}
                variant="outline"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-1" />
                Import
              </ModernButton>

              <ModernButton
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </ModernButton>

              <ModernButton
                onClick={() => setIsNewContactModalOpen(true)}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </ModernButton>
            </div>
          </div>
        </div>

        {/* AI Analysis Progress */}
        {(isAnalyzing || analysisProgress) && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    AI Analysis in Progress
                  </p>
                  {analysisProgress && (
                    <p className="text-xs text-blue-700">
                      Processing {analysisProgress.current} of {analysisProgress.total} contacts
                    </p>
                  )}
                </div>
              </div>
              {analysisProgress && (
                <div className="w-32 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Results */}
        {aiResults && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Analysis Complete
                  </p>
                  <p className="text-xs text-green-700">
                    {aiResults.success} contacts analyzed successfully
                    {aiResults.failed > 0 && `, ${aiResults.failed} failed`}
                  </p>
                </div>
              </div>
              <ModernButton
                onClick={() => setAiResults(null)}
                variant="ghost"
                size="sm"
                className="text-green-600"
              >
                <X className="w-4 h-4" />
              </ModernButton>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Loading contacts...</p>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || activeFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No contacts match your filters'
                    : 'No contacts yet'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || activeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first contact'
                  }
                </p>
                <ModernButton
                  onClick={() => setIsNewContactModalOpen(true)}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </ModernButton>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredContacts.map((contact) => (
                    <AIEnhancedContactCard
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedContacts.includes(contact.id)}
                      onSelect={() => toggleContactSelection(contact.id)}
                      onClick={() => setSelectedContact(contact)}
                      onAnalyze={async (contact) => {
                        try {
                          await analyzeContact(contact.id);
                          return true;
                        } catch {
                          return false;
                        }
                      }}
                      isAnalyzing={analyzingContactIds.includes(contact.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedContacts.length === filteredContacts.length}
                            onChange={selectAllContacts}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Interest</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => toggleContactSelection(contact.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <AvatarWithStatus 
                                src={contact.avatarSrc || contact.avatar} 
                                name={contact.name}
                                size="sm"
                                className="flex-shrink-0"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{contact.name}</p>
                                <p className="text-sm text-gray-600">{contact.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{contact.company}</p>
                              <p className="text-sm text-gray-600">{contact.position}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {contact.interestLevel && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${interestColors[contact.interestLevel as keyof typeof interestColors]}`}>
                                {interestLabels[contact.interestLevel as keyof typeof interestLabels]}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{contact.aiScore || contact.score || 0}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                (contact.aiScore || contact.score || 0) >= 80 ? 'bg-green-500' :
                                (contact.aiScore || contact.score || 0) >= 60 ? 'bg-blue-500' :
                                (contact.aiScore || contact.score || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ModernButton
                              onClick={() => setSelectedContact(contact)}
                              variant="ghost"
                              size="sm"
                            >
                              <Info className="w-4 h-4" />
                            </ModernButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Detail Modal */}
        {selectedContact && (
          <ContactDetailView
            contact={selectedContact}
            isOpen={!!selectedContact}
            onClose={() => setSelectedContact(null)}
            onUpdate={async (id, updates) => {
              updateContact(id, updates);
              setSelectedContact({ ...selectedContact, ...updates });
              return { ...selectedContact, ...updates };
            }}
          />
        )}

        {/* Import Modal */}
        <ImportContactsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(importedContacts) => {
            importedContacts.forEach(contact => {
              addContact(contact);
            });
            setIsImportModalOpen(false);
          }}
        />

        {/* New Contact Modal */}
        <NewContactModal
          isOpen={isNewContactModalOpen}
          onClose={() => setIsNewContactModalOpen(false)}
          onSave={(newContact) => {
            addContact(newContact);
            setIsNewContactModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};