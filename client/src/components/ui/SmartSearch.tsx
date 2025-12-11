import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'ai';
  category?: string;
  icon?: React.ReactNode;
}

interface SmartSearchProps {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  filters?: string[];
  aiPowered?: boolean;
  onSearch: (query: string, filters?: string[]) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  placeholder = "Search...",
  suggestions = [],
  recentSearches = [],
  filters = [],
  aiPowered = true,
  onSearch,
  onSuggestionClick,
  className
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery, selectedFilters);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
    onSuggestionClick?.(suggestion);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Combine and deduplicate suggestions
  const allSuggestions = [
    ...recentSearches.map(text => ({ 
      id: `recent-${text}`, 
      text, 
      type: 'recent' as const,
      icon: <Clock className="w-4 h-4" />
    })),
    ...suggestions
  ];

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className={cn(
        "flex items-center rounded-lg border transition-all duration-200",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
        "hover:shadow-md focus-within:shadow-lg",
        isExpanded ? "shadow-lg" : "shadow-sm",
        showSuggestions && "rounded-b-none border-b-transparent"
      )}>
        {/* Search Icon */}
        <div className="pl-4 pr-2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsExpanded(true);
            setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className={cn(
            "flex-1 py-3 px-2 bg-transparent border-0 outline-none",
            "text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
          )}
        />

        {/* AI Indicator */}
        {aiPowered && query && (
          <div className="px-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
        )}

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearQuery}
            className="p-1 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* Filter Toggle */}
        {filters.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "p-2 mr-2 rounded-md transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedFilters.length > 0 && "bg-blue-50 dark:bg-blue-950/20 text-blue-600"
            )}
          >
            <Filter className="w-4 h-4" />
            {selectedFilters.length > 0 && (
              <span className="ml-1 text-xs font-medium">
                {selectedFilters.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filters */}
      {isExpanded && filters.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-x border-b rounded-b-lg shadow-lg z-10">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    selectedFilters.includes(filter)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && allSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-x border-b rounded-b-lg shadow-lg max-h-80 overflow-y-auto z-20">
          <div className="py-2">
            {allSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center space-x-3"
              >
                <div className="text-gray-400">
                  {suggestion.icon}
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-gray-100 font-medium">
                    {suggestion.text}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.category}
                    </div>
                  )}
                </div>
                {suggestion.type === 'ai' && (
                  <Sparkles className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;