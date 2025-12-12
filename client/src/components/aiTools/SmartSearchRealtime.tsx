import React, { useState, useEffect, useRef } from 'react';
import { useGemini } from '../../services/geminiService';
import { useOpenAIEmbeddings } from '../../services/openaiEmbeddingsService';
import { Search, FileText, User, Briefcase, Clock, ArrowRight, RefreshCw, X, Sparkles, Filter, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, Deal } from '../../types';

// Sample data for testing
const sampleContacts: Contact[] = []; // TODO: Replace with real CRM data


const sampleDeals: Deal[] = []; // TODO: Replace with real CRM data


interface SearchResult {
  type: 'contact' | 'deal';
  item: Contact | Deal;
  score: number;
}

interface SmartSearchRealtimeProps {
  onSearchResult?: (results: SearchResult[]) => void;
}

const SmartSearchRealtime: React.FC<SmartSearchRealtimeProps> = ({ onSearchResult }) => {
  const gemini = useGemini();
  const embeddings = useOpenAIEmbeddings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    type: 'all' | 'contacts' | 'deals';
  }>({
    type: 'all'
  });
  const [embedData, setEmbedData] = useState<{
    ready: boolean;
    contactEmbeddings: { contactId: string; embedding: number[] }[];
    dealEmbeddings: { dealId: string; embedding: number[] }[];
    error?: string;
    quotaExceeded?: boolean;
    apiUnavailable?: boolean;
  }>({
    ready: false,
    contactEmbeddings: [],
    dealEmbeddings: []
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to check if error is quota related
  const isQuotaError = (error: any): boolean => {
    const errorMessage = error?.message || '';
    const errorStatus = error?.status;
    
    return (
      errorStatus === 429 ||
      errorMessage.includes('429') ||
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('exceeded') ||
      errorMessage.toLowerCase().includes('billing')
    );
  };
  
  // Helper function to check if error is API key related
  const isAPIKeyError = (error: any): boolean => {
    const errorMessage = error?.message || '';
    const errorStatus = error?.status;
    
    return (
      errorStatus === 401 ||
      errorMessage.includes('401') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('api key') ||
      errorMessage.toLowerCase().includes('invalid key')
    );
  };
  
  // Initialize embeddings on first load
  useEffect(() => {
    const initializeEmbeddings = async () => {
      try {
        // Generate embeddings for contacts and deals
        const contactEmbs = await embeddings.createContactEmbeddings(sampleContacts);
        const dealEmbs = await embeddings.createDealEmbeddings(sampleDeals);
        
        setEmbedData({
          ready: true,
          contactEmbeddings: contactEmbs,
          dealEmbeddings: dealEmbs
        });
      } catch (error: any) {
        // Check the type of error and handle gracefully
        const isQuota = isQuotaError(error);
        const isAPIKey = isAPIKeyError(error);
        
        // Only log non-quota errors to console to avoid cluttering with expected quota errors
        if (!isQuota && !isAPIKey) {
          console.error('Error initializing embeddings:', error);
        }
        
        setEmbedData({
          ready: false,
          contactEmbeddings: [],
          dealEmbeddings: [],
          error: error.message || 'Failed to initialize embeddings',
          quotaExceeded: isQuota,
          apiUnavailable: isAPIKey
        });
      }
    };
    
    // Use a slight delay to prevent immediate error logging on component mount
    const timeoutId = setTimeout(() => {
      initializeEmbeddings();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Generate search suggestions based on input
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        generateSearchSuggestions(searchQuery);
      }, 300);
    } else {
      setShowSearchSuggestions(false);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);
  
  // Generate search suggestions
  const generateSearchSuggestions = async (query: string) => {
    try {
      // In a real implementation, call Gemini API
      // For analysis, generate simple suggestions
      const baseSuggestions = [
        `${query} in technology companies`,
        `high priority ${query}`,
        `${query} with budget over $50k`,
        `recently contacted ${query}`,
        `${query} closing this month`
      ];
      
      // Filter to 3 most relevant suggestions
      setSearchSuggestions(baseSuggestions.slice(0, 3));
      setShowSearchSuggestions(true);
    } catch (error) {
      // Silently handle suggestion generation errors
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };
  
  // Perform basic keyword search as fallback
  const performBasicSearch = (query: string) => {
    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search contacts
    if (filters.type === 'all' || filters.type === 'contacts') {
      sampleContacts.forEach(contact => {
        const searchableText = `${contact.name} ${contact.email} ${contact.company} ${contact.position} ${contact.notes} ${contact.industry} ${contact.location}`.toLowerCase();
        if (searchableText.includes(searchTerm)) {
          results.push({
            type: 'contact',
            item: contact,
            score: 0.8 // Default score for keyword matching
          });
        }
      });
    }
    
    // Search deals
    if (filters.type === 'all' || filters.type === 'deals') {
      sampleDeals.forEach(deal => {
        const searchableText = `${deal.title} ${deal.company} ${deal.contact} ${deal.stage} ${deal.priority}`.toLowerCase();
        if (searchableText.includes(searchTerm)) {
          results.push({
            type: 'deal',
            item: deal,
            score: 0.8 // Default score for keyword matching
          });
        }
      });
    }
    
    return results.slice(0, 5);
  };
  
  // Perform the semantic search
  const performSemanticSearch = async (query: string) => {
    if (query.trim().length === 0) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      let results: SearchResult[] = [];
      
      // If embeddings are ready, use semantic search
      if (embedData.ready) {
        // Create an embedding for the search query
        const queryEmbedding = await embeddings.createEmbedding(query);
        
        // Search contacts if not filtered out
        if (filters.type === 'all' || filters.type === 'contacts') {
          const contactsById = sampleContacts.reduce((acc, contact) => {
            acc[contact.id] = contact;
            return acc;
          }, {} as Record<string, Contact>);
          
          const contactResults = await embeddings.searchContacts(query, embedData.contactEmbeddings, contactsById);
          
          results.push(...contactResults.map(result => ({
            type: 'contact',
            item: result.contact,
            score: result.score
          })));
        }
        
        // Search deals if not filtered out
        if (filters.type === 'all' || filters.type === 'deals') {
          const dealsById = sampleDeals.reduce((acc, deal) => {
            acc[deal.id] = deal;
            return acc;
          }, {} as Record<string, Deal>);
          
          const dealResults = await embeddings.searchDeals(query, embedData.dealEmbeddings, dealsById);
          
          results.push(...dealResults.map(result => ({
            type: 'deal',
            item: result.deal,
            score: result.score
          })));
        }
        
        // Sort by similarity score
        results = results.sort((a, b) => b.score - a.score).slice(0, 5);
      } else {
        // Fallback to basic keyword search
        results = performBasicSearch(query);
      }
      
      setSearchResults(results);
      
      if (onSearchResult) {
        onSearchResult(results);
      }
      
      setShowSearchSuggestions(false);
    } catch (error: any) {
      // Handle search errors gracefully
      if (!isQuotaError(error) && !isAPIKeyError(error)) {
        console.error('Error performing search:', error);
      }
      
      // Always fallback to basic search on error
      const fallbackResults = performBasicSearch(query);
      setSearchResults(fallbackResults);
      
      if (onSearchResult) {
        onSearchResult(fallbackResults);
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectSearchSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
    performSemanticSearch(suggestion);
  };
  
  // Handle search on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSemanticSearch(searchQuery);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-lg font-semibold flex items-center">
          <Search size={20} className="text-blue-600 mr-2" />
          Smart Search
          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {embedData.ready ? 'AI-Powered' : 'Basic Search'}
          </span>
        </h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Show API quota error message if applicable */}
        {embedData.quotaExceeded && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  OpenAI API Quota Exceeded
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  The smart search feature requires OpenAI embeddings but your API quota has been exceeded. 
                  The search will use basic keyword matching as a fallback.
                </p>
                <div className="flex items-center text-xs text-amber-600">
                  <ExternalLink size={12} className="mr-1" />
                  <a 
                    href="https://platform.openai.com/account/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-800"
                  >
                    Check your OpenAI billing and usage
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show API key error message if applicable */}
        {embedData.apiUnavailable && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  OpenAI API Key Required
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  The smart search feature requires a valid OpenAI API key. Please check your API configuration.
                  Using basic keyword search instead.
                </p>
                <div className="flex items-center text-xs text-red-600">
                  <ExternalLink size={12} className="mr-1" />
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-red-800"
                  >
                    Manage your OpenAI API keys
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show general error message for other API errors */}
        {embedData.error && !embedData.quotaExceeded && !embedData.apiUnavailable && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Smart Search Unavailable
                </h4>
                <p className="text-sm text-red-700">
                  Unable to initialize AI-powered search. Using basic keyword search instead.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={embedData.ready ? 
              "Search using natural language (e.g., 'high priority deals closing this month')" :
              "Search contacts and deals using keywords"
            }
            className="block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-3 flex items-center"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Search suggestions dropdown */}
        <AnimatePresence>
          {showSearchSuggestions && searchSuggestions.length > 0 && embedData.ready && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              style={{ width: searchInputRef.current?.offsetWidth }}
            >
              <div className="p-2">
                {searchSuggestions.map((suggestion, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => selectSearchSuggestion(suggestion)}
                    className="flex items-center p-2 hover:bg-blue-50 rounded-md cursor-pointer"
                  >
                    <Sparkles size={14} className="text-blue-500 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters({...filters, type: 'all'})}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filters.type === 'all' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilters({...filters, type: 'contacts'})}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                filters.type === 'contacts' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <User size={14} className="mr-1" />
              Contacts
            </button>
            <button
              onClick={() => setFilters({...filters, type: 'deals'})}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                filters.type === 'deals' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Briefcase size={14} className="mr-1" />
              Deals
            </button>
          </div>
          
          <button
            onClick={() => performSemanticSearch(searchQuery)}
            disabled={!searchQuery.trim() || isSearching}
            className={`flex items-center px-4 py-2 rounded-md ${
              !searchQuery.trim() || isSearching
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSearching ? (
              <RefreshCw size={18} className="animate-spin mr-1" />
            ) : (
              <Search size={18} className="mr-1" />
            )}
            Search
          </button>
        </div>
      
        {/* Search metadata */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center text-xs text-gray-500">
            {embedData.ready ? (
              <>
                <CheckCircle size={14} className="text-blue-500 mr-1.5" />
                <span>
                  AI semantic search ready ({sampleContacts.length} contacts, {sampleDeals.length} deals)
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={14} className="text-amber-500 mr-1.5" />
                <span>
                  Basic keyword search active ({sampleContacts.length} contacts, {sampleDeals.length} deals)
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Search results */}
        <div className="mt-6">
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-12"
              >
                <RefreshCw size={32} className="text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">
                  {embedData.ready ? 'Searching with AI...' : 'Searching...'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isSearching && searchResults.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                {embedData.ready ? (
                  <Sparkles size={16} className="text-blue-500 mr-2" />
                ) : (
                  <Search size={16} className="text-gray-500 mr-2" />
                )}
                {searchResults.length} Results for "{searchQuery}"
                {!embedData.ready && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    Keyword Search
                  </span>
                )}
              </h4>
              
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <motion.div
                    key={`${result.type}-${result.item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    {result.type === 'contact' ? (
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center">
                            <User size={16} className="text-blue-600 mr-2" />
                            <h3 className="font-medium text-blue-600">
                              {(result.item as Contact).name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500">
                            {(result.item as Contact).position} at {(result.item as Contact).company}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium">
                            {embedData.ready ? `Match: ${Math.round(result.score * 100)}%` : 'Keyword Match'}
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
                            {(result.item as Contact).status}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center">
                            <Briefcase size={16} className="text-purple-600 mr-2" />
                            <h3 className="font-medium text-purple-600">
                              {(result.item as Deal).title}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500">
                            {(result.item as Deal).company} - ${(result.item as Deal).value.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium">
                            {embedData.ready ? `Match: ${Math.round(result.score * 100)}%` : 'Keyword Match'}
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 capitalize">
                            {(result.item as Deal).stage}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {result.type === 'contact' && (result.item as Contact).notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                        {(result.item as Contact).notes}
                      </div>
                    )}
                    
                    {result.type === 'deal' && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock size={14} className="mr-1" />
                        Due: {formatDate((result.item as Deal).dueDate)}
                        <span className={`ml-2 px-2 py-0.5 rounded-full ${
                          (result.item as Deal).priority === 'high' ? 'bg-red-100 text-red-800' :
                          (result.item as Deal).priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {(result.item as Deal).priority} priority
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-2 flex justify-end">
                      <button className="text-blue-600 hover:text-blue-800 text-xs flex items-center">
                        View Details <ArrowRight size={12} className="ml-1" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
              <p className="text-gray-500 text-sm">
                Try using different keywords or filters
              </p>
            </div>
          )}
          
          {!isSearching && !searchQuery && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {embedData.ready ? 'Smart Semantic Search' : 'Keyword Search'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {embedData.ready ? 
                  'Use natural language to find exactly what you need across all your CRM data.' :
                  'Search through your contacts and deals using keywords.'
                }
              </p>
              <div className="max-w-md mx-auto">
                <div className="text-sm text-left">Try searching for:</div>
                <ul className="text-left text-sm text-gray-700 space-y-2 mt-2">
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-blue-500 mr-2" />
                    {embedData.ready ? 'Deals with high priority closing this month' : 'John Doe or Acme Inc'}
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-blue-500 mr-2" />
                    {embedData.ready ? 'Contacts in the technology industry with budget concerns' : 'CTO or Technology'}
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-blue-500 mr-2" />
                    {embedData.ready ? 'Deals over $50,000 in the negotiation stage' : 'Enterprise or $75000'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartSearchRealtime;