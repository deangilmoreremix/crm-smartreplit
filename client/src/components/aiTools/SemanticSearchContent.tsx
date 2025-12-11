import React, { useState, useEffect } from 'react';
import { useOpenAIEmbeddings } from '../../services/openaiEmbeddingsService';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import AIToolContent from '../shared/AIToolContent';
import { Search, Database, RefreshCw, ChevronRight } from 'lucide-react';
import { Contact, Deal } from '../../types';

const SemanticSearchContent: React.FC = () => {
  const embeddings = useOpenAIEmbeddings();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    contacts: { contact: Contact, score: number }[];
    deals: { deal: Deal, score: number }[];
  } | null>(null);
  const [isEmbeddingCreated, setIsEmbeddingCreated] = useState(false);
  const [contactEmbeddings, setContactEmbeddings] = useState<{ contactId: string, embedding: number[] }[]>([]);
  const [dealEmbeddings, setDealEmbeddings] = useState<{ dealId: string, embedding: number[] }[]>([]);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'contacts' | 'deals'>('all');
  
  // Initialize embeddings
  useEffect(() => {
    if (!isEmbeddingCreated && !isGeneratingEmbeddings) {
      generateEmbeddings();
    }
  }, [isEmbeddingCreated, isGeneratingEmbeddings]);
  
  const generateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    setError(null);
    
    try {
      // Generate embeddings for contacts
      const contactsArray = Object.values(contacts);
      const contactEmbs = await embeddings.createContactEmbeddings(contactsArray);
      setContactEmbeddings(contactEmbs);
      
      // Generate embeddings for deals
      const dealsArray = Object.values(deals);
      const dealEmbs = await embeddings.createDealEmbeddings(dealsArray);
      setDealEmbeddings(dealEmbs);
      
      setIsEmbeddingCreated(true);
    } catch (err) {
      console.error('Error generating embeddings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery) {
      setError('Please enter a search query');
      return;
    }
    
    if (!isEmbeddingCreated) {
      setError('Embeddings are not yet generated. Please wait and try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results: {
        contacts: { contact: Contact, score: number }[];
        deals: { deal: Deal, score: number }[];
      } = {
        contacts: [],
        deals: []
      };
      
      // Search contacts if selected
      if (searchType === 'all' || searchType === 'contacts') {
        const contactsById = Object.values(contacts).reduce((acc, contact) => {
          acc[contact.id] = contact;
          return acc;
        }, {} as Record<string, Contact>);
        
        const contactResults = await embeddings.searchContacts(searchQuery, contactEmbeddings, contactsById);
        results.contacts = contactResults;
      }
      
      // Search deals if selected
      if (searchType === 'all' || searchType === 'deals') {
        const dealsById = Object.values(deals).reduce((acc, deal) => {
          acc[deal.id] = deal;
          return acc;
        }, {} as Record<string, Deal>);
        
        const dealResults = await embeddings.searchDeals(searchQuery, dealEmbeddings, dealsById);
        results.deals = dealResults;
      }
      
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Search className="text-blue-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-blue-800">Semantic Search</h3>
            <p className="text-sm text-blue-700 mt-1">
              Search your contacts, deals, and content using natural language and semantic understanding.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={null}
        loadingMessage="Searching..."
        resultTitle="Search Results"
      >
        {isGeneratingEmbeddings ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg">
            <RefreshCw size={32} className="mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-700 font-medium">Generating embeddings...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment as we prepare the search database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search using natural language (e.g., 'customers with budget concerns')"
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!isEmbeddingCreated}
                />
              </div>
              
              <div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'all' | 'contacts' | 'deals')}
                  className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="deals">Deals Only</option>
                </select>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={!isEmbeddingCreated || isLoading || !searchQuery.trim()}
                className={`px-4 py-2 rounded-md text-white font-medium flex items-center whitespace-nowrap ${
                  !isEmbeddingCreated || isLoading || !searchQuery.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
            
            {/* Search info */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">
                <Database size={14} className="inline mr-1" />
                <span>
                  {isEmbeddingCreated ? (
                    `${Object.keys(contacts).length + Object.keys(deals).length} indexed items (${Object.keys(contacts).length} contacts, ${Object.keys(deals).length} deals)`
                  ) : (
                    'Preparing search database...'
                  )}
                </span>
              </div>
              
              <div>
                <button 
                  onClick={generateEmbeddings} 
                  className="text-blue-600 hover:text-blue-800"
                  disabled={isGeneratingEmbeddings}
                >
                  {isGeneratingEmbeddings ? 'Generating...' : 'Refresh Index'}
                </button>
              </div>
            </div>
          </div>
        )}
                
        {/* Search Results */}
        {searchResults && !isLoading && (
          <div className="mt-6">
            {/* Contacts Results */}
            {searchResults.contacts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contacts</h3>
                <div className="divide-y divide-gray-200">
                  {searchResults.contacts.map(({contact, score}) => (
                    <div key={contact.id} className="py-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium text-blue-600">{contact.name}</h4>
                          <p className="text-sm text-gray-500">{contact.position} at {contact.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Match: {Math.round(score * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {contact.status}
                          </div>
                        </div>
                      </div>
                      
                      {contact.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          {contact.notes}
                        </div>
                      )}
                      
                      <div className="mt-2 flex justify-end">
                        <a href={`/contacts/${contact.id}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                          View Contact <ChevronRight size={14} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Deals Results */}
            {searchResults.deals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Deals</h3>
                <div className="divide-y divide-gray-200">
                  {searchResults.deals.map(({deal, score}) => (
                    <div key={deal.id} className="py-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium text-purple-600">{deal.title}</h4>
                          <p className="text-sm text-gray-500">{deal.company} - ${deal.value.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Match: {Math.round(score * 100)}%
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 capitalize">
                            {deal.stage}
                          </div>
                        </div>
                      </div>
                      
                      {deal.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          {deal.notes}
                        </div>
                      )}
                      
                      <div className="mt-2 flex justify-end">
                        <a href={`/pipeline`} className="text-purple-600 hover:text-purple-800 text-sm flex items-center">
                          View Deal <ChevronRight size={14} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {searchResults.contacts.length === 0 && searchResults.deals.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <Search size={32} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 font-medium">No results found</p>
                <p className="text-gray-500 text-sm mt-2">Try a different search query or expand your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </AIToolContent>
    </div>
  );
};

export default SemanticSearchContent;