import React, { useState } from 'react';
import { 
  X, 
  Calendar,
  Building2,
  Tag,
  Star,
  Target,
  MapPin,
  Sliders
} from 'lucide-react';
import Select from 'react-select';
import { Contact } from '../../types/contact';

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

interface AdvancedContactFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  onClearFilters: () => void;
  contacts: Contact[];
  currentFilters?: FilterCriteria;
}

const AdvancedContactFilter: React.FC<AdvancedContactFilterProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onClearFilters,
  contacts,
  currentFilters
}) => {
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters || {
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

  // Extract unique values from contacts for filter options
  const getUniqueStringValues = (key: 'industry' | 'location') => {
    const values = contacts
      .map(contact => contact[key])
      .filter((value): value is string => typeof value === 'string')
      .filter((value, index, self) => self.indexOf(value) === index);
    return values;
  };

  const getUniqueTags = () => {
    const allTags = contacts
      .flatMap(contact => contact.tags || [])
      .filter((tag, index, self) => self.indexOf(tag) === index);
    return allTags;
  };

  const getUniqueSources = () => {
    const allSources = contacts
      .flatMap(contact => contact.sources || [contact.source].filter(Boolean))
      .filter((source): source is string => typeof source === 'string')
      .filter((source, index, self) => self.indexOf(source) === index);
    return allSources;
  };

  const statusOptions = [
    { value: 'lead', label: 'Lead', color: 'purple' },
    { value: 'prospect', label: 'Prospect', color: 'blue' },
    { value: 'customer', label: 'Customer', color: 'green' },
    { value: 'churned', label: 'Churned', color: 'red' }
  ];

  const interestLevelOptions = [
    { value: 'hot', label: 'Hot', color: 'red' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'low', label: 'Low', color: 'blue' },
    { value: 'cold', label: 'Cold', color: 'gray' }
  ];

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: FilterCriteria = {
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
    };
    setFilters(emptyFilters);
    onClearFilters();
  };

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      borderColor: '#d1d5db',
      '&:hover': { borderColor: '#9ca3af' },
      boxShadow: 'none',
      minHeight: '38px'
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#f3f4f6',
      borderRadius: '6px'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#374151',
      fontSize: '14px'
    })
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Status
              </label>
              <Select
                isMulti
                options={statusOptions}
                value={statusOptions.filter(option => filters.status.includes(option.value))}
                onChange={(selected) => updateFilter('status', selected.map(s => s.value))}
                placeholder="Select statuses..."
                styles={customSelectStyles}
                className="text-sm"
              />
            </div>

            {/* Interest Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Interest Level
              </label>
              <Select
                isMulti
                options={interestLevelOptions}
                value={interestLevelOptions.filter(option => filters.interestLevel.includes(option.value))}
                onChange={(selected) => updateFilter('interestLevel', selected.map(s => s.value))}
                placeholder="Select interest levels..."
                styles={customSelectStyles}
                className="text-sm"
              />
            </div>

            {/* Industry Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                Industry
              </label>
              <Select
                isMulti
                options={getUniqueStringValues('industry').map(industry => ({ value: industry, label: industry }))}
                value={filters.industry.map(industry => ({ value: industry, label: industry }))}
                onChange={(selected) => updateFilter('industry', selected.map(s => s.value))}
                placeholder="Select industries..."
                styles={customSelectStyles}
                className="text-sm"
              />
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Tags
              </label>
              <Select
                isMulti
                options={getUniqueTags().map(tag => ({ value: tag, label: tag }))}
                value={filters.tags.map(tag => ({ value: tag, label: tag }))}
                onChange={(selected) => updateFilter('tags', selected.map(s => s.value))}
                placeholder="Select tags..."
                styles={customSelectStyles}
                className="text-sm"
              />
            </div>

            {/* Score Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                AI Score Range
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.scoreRange.min}
                  onChange={(e) => updateFilter('scoreRange', { ...filters.scoreRange, min: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {filters.scoreRange.min}
                </span>
                <span className="text-sm text-gray-400">to</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.scoreRange.max}
                  onChange={(e) => updateFilter('scoreRange', { ...filters.scoreRange, max: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {filters.scoreRange.max}
                </span>
              </div>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Source
              </label>
              <Select
                isMulti
                options={getUniqueSources().map(source => ({ value: source, label: source }))}
                value={filters.source.map(source => ({ value: source, label: source }))}
                onChange={(selected) => updateFilter('source', selected.map(s => s.value))}
                placeholder="Select sources..."
                styles={customSelectStyles}
                className="text-sm"
              />
            </div>

            {/* Last Contact Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Last Contact (Days Ago)
              </label>
              <select
                value={filters.lastContactDays || ''}
                onChange={(e) => updateFilter('lastContactDays', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Location
              </label>
              <Select
                isMulti
                options={getUniqueStringValues('location').map(location => ({ value: location, label: location }))}
                value={filters.location.map(location => ({ value: location, label: location }))}
                onChange={(selected) => updateFilter('location', selected.map(s => s.value))}
                placeholder="Select locations..."
                styles={customSelectStyles}
                className="text-sm"
              />
            </div>
          </div>

          {/* Boolean Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="favorites"
                checked={filters.isFavorite === true}
                onChange={(e) => updateFilter('isFavorite', e.target.checked ? true : undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="favorites" className="ml-2 text-sm text-gray-700">
                Favorites only
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="customFields"
                checked={filters.hasCustomFields === true}
                onChange={(e) => updateFilter('hasCustomFields', e.target.checked ? true : undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="customFields" className="ml-2 text-sm text-gray-700">
                Has custom fields
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear All
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedContactFilter;
