import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Brain,
  TrendingUp,
  Tag,
  Plus,
  Trash2,
  Clock,
  RefreshCw // Added for random avatar
} from 'lucide-react';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../hooks/useContactStore';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../ui/Avatar'; // Added import
import { getRandomAvatar, getInitials } from '../../utils/avatars'; // Added import
import { Switch } from '../ui/switch'; // Added import

interface ProfessionalContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  mode: 'view' | 'edit' | 'create';
}

const ProfessionalContactModal: React.FC<ProfessionalContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  mode
}) => {
  const { addContact, updateContact, analyzeContact, enrichContact } = useContactStore();

  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    title: '',
    industry: '',
    status: 'lead',
    interestLevel: 'medium',
    source: '',
    tags: [],
    notes: '',
    socialProfiles: {},
    customFields: {},
    location: '',
    preferredContact: 'email',
    avatarSrc: '', // Initialize avatarSrc
    isFavorite: false // Initialize isFavorite
  });

  const [newTag, setNewTag] = useState('');
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact && mode !== 'create') {
      setFormData({
        ...contact,
        socialProfiles: contact.socialProfiles || {},
        customFields: contact.customFields || {},
        tags: contact.tags || [],
        avatarSrc: contact.avatarSrc || contact.avatar || '', // Ensure avatarSrc is set
        isFavorite: contact.isFavorite || false // Ensure isFavorite is set
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        title: '',
        industry: '',
        status: 'lead',
        interestLevel: 'medium',
        source: '',
        tags: [],
        notes: '',
        socialProfiles: {},
        customFields: {},
        location: '',
        preferredContact: 'email',
        avatarSrc: getRandomAvatar(), // Default to a random avatar for new contacts
        isFavorite: false
      });
    }
  }, [contact, mode]);

  const handleSave = async () => {
    try {
      // Generate full name from first and last name
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.name || '';
      
      const contactData = {
        name: fullName,
        firstName: formData.firstName || fullName.split(' ')[0] || '',
        lastName: formData.lastName || fullName.split(' ').slice(1).join(' ') || '',
        email: formData.email || '',
        phone: formData.phone || '',
        company: formData.company || '',
        position: formData.position || '',
        title: formData.title || '',
        industry: formData.industry || '',
        status: formData.status || 'lead',
        interestLevel: formData.interestLevel || 'medium',
        source: formData.source || '',
        tags: formData.tags || [],
        notes: formData.notes || '',
        socialProfiles: formData.socialProfiles || {},
        customFields: formData.customFields || {},
        location: formData.location || '',
        preferredContact: formData.preferredContact || 'email',
        avatarSrc: formData.avatarSrc || formData.avatar || '', // Include avatarSrc
        isFavorite: formData.isFavorite || false // Include isFavorite
      };

      if (mode === 'create') {
        addContact(contactData);
      } else if (contact) {
        updateContact(contact.id, contactData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!contact) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeContact(contact.id);
    } catch (error) {
      console.error('Failed to analyze contact:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEnrich = async () => {
    if (!contact) return;
    
    setIsEnriching(true);
    try {
      await enrichContact(contact.id);
    } catch (error) {
      console.error('Failed to enrich contact:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addCustomField = () => {
    if (newCustomField.key.trim() && newCustomField.value.trim()) {
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [newCustomField.key]: newCustomField.value
        }
      }));
      setNewCustomField({ key: '', value: '' });
    }
  };

  const removeCustomField = (key: string) => {
    setFormData(prev => {
      const { [key]: removed, ...rest } = prev.customFields || {};
      return { ...prev, customFields: rest };
    });
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'Add New Contact' : mode === 'edit' ? 'Edit Contact' : 'Contact Details';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {contact && mode === 'view' && (
                <p className="text-sm text-gray-600">
                  Created {contact.createdAt ? formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true }) : 'N/A'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {contact && mode === 'view' && (
              <>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <Brain size={16} className="mr-1" />
                  {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
                </button>
                <button
                  onClick={handleEnrich}
                  disabled={isEnriching}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <TrendingUp size={16} className="mr-1" />
                  {isEnriching ? 'Enriching...' : 'Enrich Data'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Avatar Management */}
                  <div className="col-span-full mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar
                    </label>
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={formData.avatarSrc || formData.avatar}
                        alt={formData.name || getInitials(formData.firstName || 'NN')}
                        size="lg"
                        fallback={getInitials(formData.firstName || 'NN')}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.avatarSrc || formData.avatar || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, avatarSrc: e.target.value, avatar: e.target.value }))}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="Enter avatar URL"
                        />
                        {!isReadOnly && (
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, avatarSrc: getRandomAvatar(), avatar: getRandomAvatar() }))}
                            className="mt-2 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                          >
                            <RefreshCw size={14} className="inline mr-1" />
                            Random Avatar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* End Avatar Management */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industry || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Add notes about this contact..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status || 'lead'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="churned">Churned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Level
                    </label>
                    <select
                      value={formData.interestLevel || 'medium'}
                      onChange={(e) => setFormData(prev => ({ ...prev, interestLevel: e.target.value as any }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="hot">Hot</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="cold">Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <input
                      type="text"
                      value={formData.source || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      disabled={isReadOnly}
                      placeholder="e.g., LinkedIn, Website, Referral"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  {/* isFavorite Toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Mark as Favorite
                    </label>
                    <Switch
                      checked={formData.isFavorite || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFavorite: checked }))}
                      disabled={isReadOnly}
                    />
                  </div>
                  {/* End isFavorite Toggle */}
                </div>
              </div>

              {/* AI Score */}
              {contact && (contact.aiScore || contact.score) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contact Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(contact.aiScore || contact.score)}`}>
                      {contact.aiScore || contact.score}/100
                    </span>
                  </div>
                  {contact.lastContact && (
                    <div className="mt-3 flex items-center text-sm text-gray-600">
                      <Clock size={14} className="mr-1" />
                      Last contact: {formatDistanceToNow(new Date(contact.lastContact), { addSuffix: true })}
                    </div>
                  )}
                </div>
              )}

              {/* Social Profiles */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Social Profiles</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.socialProfiles?.linkedin || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialProfiles: { ...prev.socialProfiles, linkedin: e.target.value }
                      }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={formData.socialProfiles?.twitter || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialProfiles: { ...prev.socialProfiles, twitter: e.target.value }
                      }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.socialProfiles?.website || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialProfiles: { ...prev.socialProfiles, website: e.target.value }
                      }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div className="space-y-3">
                  {!isReadOnly && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Add tag..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <Tag size={12} className="mr-1" />
                        {tag}
                        {!isReadOnly && (
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
                <div className="space-y-3">
                  {!isReadOnly && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newCustomField.key}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                        placeholder="Field name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newCustomField.value}
                          onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Field value..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addCustomField}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {Object.entries(formData.customFields || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{key}</div>
                          <div className="text-sm text-gray-600">{value}</div>
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => removeCustomField(key)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Save size={16} className="inline mr-1" />
              {mode === 'create' ? 'Create Contact' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalContactModal;
