import React, { useState } from 'react';
import { AvatarWithStatus } from '../ui/AvatarWithStatus';
import { ModernButton } from '../ui/ModernButton';
import { Contact } from '../../types/contact';
import { 
  X, 
  Edit, 
  Mail, 
  Phone, 
  Plus, 
  MessageSquare, 
  FileText, 
  Calendar, 
  MoreHorizontal, 
  User, 
  Globe, 
  Clock, 
  Building, 
  Tag, 
  Star, 
  ExternalLink, 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Users, 
  Activity, 
  Settings, 
  Database, 
  Shield, 
  Target, 
  Smartphone, 
  Video, 
  Save, 
  Heart, 
  HeartOff, 
  MapPin, 
  Briefcase, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Search, 
  DollarSign, 
  RefreshCw,
  Sparkles, 
  Camera, 
  Wand2
} from 'lucide-react';
import { gpt5SocialResearchService, SocialResearchResult } from '../../services/gpt5SocialResearchService';

interface ContactDetailViewProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Contact>) => Promise<Contact>;
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

export const ContactDetailView: React.FC<ContactDetailViewProps> = ({ 
  contact, 
  isOpen, 
  onClose, 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact>(contact);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [socialResearch, setSocialResearch] = useState<SocialResearchResult | null>(null);

  const handleSave = async () => {
    if (onUpdate) {
      try {
        await onUpdate(contact.id, editedContact);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update contact:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditedContact(contact);
    setIsEditing(false);
  };

  const handleSocialResearch = async () => {
    setIsLoadingSocial(true);
    try {
      const contactForResearch = {
        ...contact,
        lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date()
      };
      const research = await gpt5SocialResearchService.researchContactSocialMedia(
        contactForResearch,
        ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub'],
        'comprehensive'
      );
      setSocialResearch(research);
      setActiveTab('social'); // Switch to social tab
    } catch (error) {
      console.error('Social research failed:', error);
    } finally {
      setIsLoadingSocial(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <AvatarWithStatus 
              src={contact.avatarSrc || contact.avatar} 
              name={contact.name}
              size="lg"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
              <p className="text-sm text-gray-600">
                {contact.position && contact.company 
                  ? `${contact.position} at ${contact.company}`
                  : contact.email
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ModernButton
              onClick={handleSocialResearch}
              disabled={isLoadingSocial}
              variant="primary"
              size="sm"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoadingSocial ? 'Researching...' : 'Social Research'}
            </ModernButton>
            <ModernButton
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </ModernButton>
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'communications', label: 'Communications', icon: MessageSquare },
              { id: 'insights', label: 'AI Insights', icon: Brain },
              { id: 'social', label: 'Social Media', icon: Globe }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedContact.name}
                        onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedContact.email}
                        onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedContact.phone || ''}
                        onChange={(e) => setEditedContact({...editedContact, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedContact.company || ''}
                        onChange={(e) => setEditedContact({...editedContact, company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.company || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedContact.position || ''}
                        onChange={(e) => setEditedContact({...editedContact, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.position || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedContact.industry || ''}
                        onChange={(e) => setEditedContact({...editedContact, industry: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.industry || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Scoring */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Scoring</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <select
                        value={editedContact.status}
                        onChange={(e) => setEditedContact({...editedContact, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Customer</option>
                        <option value="churned">Churned</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                        {contact.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Level</label>
                    {isEditing ? (
                      <select
                        value={editedContact.interestLevel || ''}
                        onChange={(e) => setEditedContact({...editedContact, interestLevel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select level</option>
                        <option value="hot">Hot</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="cold">Cold</option>
                      </select>
                    ) : (
                      contact.interestLevel && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-white ${interestColors[contact.interestLevel as keyof typeof interestColors]}`}>
                          {interestLabels[contact.interestLevel as keyof typeof interestLabels]}
                        </span>
                      )
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Score</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {contact.aiScore || contact.score || 0}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        (contact.aiScore || contact.score || 0) >= 80 ? 'bg-green-500' :
                        (contact.aiScore || contact.score || 0) >= 60 ? 'bg-blue-500' :
                        (contact.aiScore || contact.score || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                {isEditing ? (
                  <textarea
                    value={editedContact.notes || ''}
                    onChange={(e) => setEditedContact({...editedContact, notes: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes about this contact..."
                  />
                ) : (
                  <p className="text-gray-700">{contact.notes || 'No notes added yet.'}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <ModernButton
                    onClick={handleCancel}
                    variant="outline"
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    onClick={handleSave}
                    variant="primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </ModernButton>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
              <p className="text-gray-600">Contact activity will appear here</p>
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Communications</h3>
              <p className="text-gray-600">Communication history will appear here</p>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights Coming Soon</h3>
              <p className="text-gray-600">AI-powered insights and recommendations will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};