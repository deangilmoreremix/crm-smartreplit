import React, { useState } from 'react';
import { 
  X, 
  Edit, 
  Save, 
  DollarSign, 
  Calendar, 
  User, 
  Building2,
  Phone,
  Mail,
  Target,
  Clock,
  Activity,
  Paperclip,
  MessageSquare,
  Plus,
  TrendingUp,
  Search, 
  Users, 
  Globe, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Youtube, 
  Github, 
  CheckCircle
} from 'lucide-react';
import { Deal, DealStage } from '../types/deal';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { gpt5SocialResearchService, SocialResearchResult } from '../services/gpt5SocialResearchService';

interface DealDetailsModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (deal: Deal) => void;
}

const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<Deal | null>(deal);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'files'>('overview');
  const [socialResearch, setSocialResearch] = useState<SocialResearchResult | null>(null);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [showSocialTab, setShowSocialTab] = useState(false);

  const { updateDeal, getActivePipeline } = useDealStore();
  const { contacts } = useContactStore();

  // Assume getTheme is available from ThemeContext or similar
  const isDark = false; // Placeholder for theme detection

  const pipeline = getActivePipeline();
  const contact = deal ? contacts[deal.contactId] : null;

  React.useEffect(() => {
    setEditedDeal(deal);
    setIsEditing(false);
    // Reset social research state when a new deal is opened
    setSocialResearch(null);
    setShowSocialTab(false);
  }, [deal]);

  if (!isOpen || !deal || !editedDeal) return null;

  const handleSave = async () => {
    if (editedDeal) {
      await updateDeal(editedDeal.id, editedDeal);
      onSave?.(editedDeal);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedDeal(deal);
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: editedDeal.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: DealStage) => {
    return {
      backgroundColor: stage.color + '20',
      color: stage.color,
      borderColor: stage.color
    };
  };

  const loadSocialResearch = async () => {
    if (!contact) return;

    setIsLoadingSocial(true);
    try {
      const research = await gpt5SocialResearchService.researchContactSocialMedia(
        contact,
        ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub'],
        'comprehensive'
      );
      setSocialResearch(research);
      setShowSocialTab(true);
    } catch (error) {
      console.error('Social research failed:', error);
    } finally {
      setIsLoadingSocial(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {deal.title}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Deal Details
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadSocialResearch}
              disabled={isLoadingSocial}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              <Search size={16} className="mr-1" />
              {isLoadingSocial ? 'Researching...' : 'Social Intel'}
            </button>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                >
                  <Save size={16} className="mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                <Edit size={16} className="mr-1" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        {showSocialTab && (
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => {
                setShowSocialTab(false);
                setActiveTab('overview'); // Ensure overview tab is active when switching back
              }}
              className={`px-4 py-2 text-sm font-medium ${
                !showSocialTab 
                  ? (isDark ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600')
                  : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Deal Info
            </button>
            <button
              onClick={() => {
                setShowSocialTab(true);
                setActiveTab('overview'); // Keep overview active or let it be controlled by showSocialTab
              }}
              className={`px-4 py-2 text-sm font-medium ${
                showSocialTab 
                  ? (isDark ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600')
                  : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Social Intelligence
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {showSocialTab && socialResearch ? (
            // Social Research Content
            <div className="space-y-6">
              {/* Social Profiles */}
              <div>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Social Media Profiles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {socialResearch.profiles.slice(0, 4).map((profile, index) => {
                    const IconComponent = {
                      'LinkedIn': Linkedin,
                      'Twitter': Twitter,
                      'Instagram': Instagram,
                      'YouTube': Youtube,
                      'GitHub': Github
                    }[profile.platform] || Globe;

                    return (
                      <div key={index} className={`p-3 rounded-lg ${
                        isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-3 w-3 text-blue-500" />
                            <span className={`font-medium text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {profile.platform}
                            </span>
                          </div>
                          {profile.verified && <CheckCircle className="h-3 w-3 text-green-500" />}
                        </div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          @{profile.username}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                          profile.confidence > 80 
                            ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800')
                            : (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                        }`}>
                          {profile.confidence}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h4 className={`font-medium text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Communication Style
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {socialResearch.personalityInsights.communicationStyle}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h4 className={`font-medium text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Best Engagement Times
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {socialResearch.engagementMetrics.bestPostingTimes.join(', ')}
                  </p>
                </div>
              </div>

              {/* Action Recommendations */}
              {socialResearch.monitoringRecommendations.length > 0 && (
                <div className={`p-3 rounded-lg ${
                  isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h4 className={`font-medium text-sm mb-2 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                    Recommended Actions
                  </h4>
                  <ul className="space-y-1">
                    {socialResearch.monitoringRecommendations.slice(0, 2).map((recommendation, index) => (
                      <li key={index} className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        • {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            // Original Deal Info Content
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Deal Value & Probability */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deal Value
                      </label>
                      {isEditing ? (
                        <div className="flex items-center">
                          <DollarSign size={16} className="text-gray-400 mr-1" />
                          <input
                            type="number"
                            value={editedDeal.value}
                            onChange={(e) => setEditedDeal({ ...editedDeal, value: Number(e.target.value) })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center text-lg font-semibold text-gray-900">
                          <DollarSign size={16} className="text-green-600 mr-1" />
                          {formatCurrency(deal.value)}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Probability
                      </label>
                      {isEditing ? (
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editedDeal.probability}
                            onChange={(e) => setEditedDeal({ ...editedDeal, probability: Number(e.target.value) })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-500">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <TrendingUp size={16} className="text-blue-600 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">{deal.probability}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedDeal.description || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Deal description..."
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                      {deal.description || 'No description provided'}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {deal.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {isEditing && (
                      <button className="px-3 py-1 border-2 border-dashed border-gray-300 text-gray-500 text-sm rounded-full hover:border-blue-400 hover:text-blue-600">
                        <Plus size={14} className="inline mr-1" />
                        Add Tag
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                {contact && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{contact.name}</span>
                      </div>
                      {contact.company && (
                        <div className="flex items-center space-x-3">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-gray-700">{contact.company}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center space-x-3">
                          <Mail size={16} className="text-gray-400" />
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-700">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone size={16} className="text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-700">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created</p>
                        <p className="text-sm text-gray-600">{deal.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-600">{deal.updatedAt.toLocaleDateString()}</p>
                      </div>
                    </div>

                    {deal.expectedCloseDate && (
                      <div className="flex items-center space-x-3">
                        <Target size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Expected Close</p>
                          <p className="text-sm text-gray-600">{deal.expectedCloseDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {deal.daysInStage && (
                      <div className="flex items-center space-x-3">
                        <Clock size={16} className="text-orange-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Days in Stage</p>
                          <p className="text-sm text-gray-600">{deal.daysInStage} days</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showSocialTab && activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                <button className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
                  <Plus size={16} className="mr-1" />
                  Add Activity
                </button>
              </div>

              <div className="space-y-4">
                {deal.activities.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-500">Start by adding a note, call, or meeting.</p>
                  </div>
                ) : (
                  deal.activities.map((activity, index) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <span className="text-sm text-gray-500">
                          {activity.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-gray-700 mt-1">{activity.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {!showSocialTab && activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                <button className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
                  <Plus size={16} className="mr-1" />
                  Upload File
                </button>
              </div>

              <div className="space-y-3">
                {deal.attachments.length === 0 ? (
                  <div className="text-center py-8">
                    <Paperclip size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files attached</h3>
                    <p className="text-gray-500">Upload contracts, proposals, or other documents.</p>
                  </div>
                ) : (
                  deal.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Paperclip size={16} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-sm text-gray-500">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealDetailsModal;