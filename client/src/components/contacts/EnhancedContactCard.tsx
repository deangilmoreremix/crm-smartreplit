import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Star, // Added Star import
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  MessageSquare,
  Video,
  LinkedinIcon,
  TwitterIcon,
  Globe,
  Brain,
  TrendingUp,
  Target,
  Clock,
  Tag,
  ExternalLink,
  Search
} from 'lucide-react';
import { gpt5SocialResearchService } from '../../services/gpt5SocialResearchService';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../store/contactStore'; // Added useContactStore import
import { formatDistanceToNow } from 'date-fns';

interface EnhancedContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onView?: (contact: Contact) => void;
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (contactId: string) => void;
}

const EnhancedContactCard: React.FC<EnhancedContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  isSelected = false,
  onSelect
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  
  const { analyzeContact, enrichContact, updateContact } = useContactStore(); // Destructure updateContact

  // Get AI score color and label
  const getScoreColor = (score?: number) => {
    if (!score) return { color: 'text-gray-400', bg: 'bg-gray-100', label: 'No Score' };
    if (score >= 80) return { color: 'text-green-700', bg: 'bg-green-100', label: 'High' };
    if (score >= 60) return { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Medium' };
    return { color: 'text-red-700', bg: 'bg-red-100', label: 'Low' };
  };

  // Get interest level color
  const getInterestColor = (level?: string) => {
    switch (level) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cold': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'customer': return 'bg-green-100 text-green-800 border-green-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lead': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'churned': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAnalyze = async () => {
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
    setIsEnriching(true);
    try {
      await enrichContact(contact.id);
    } catch (error) {
      console.error('Failed to enrich contact:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleToggleFavorite = () => {
    updateContact(contact.id, { isFavorite: !contact.isFavorite });
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
      console.log('Social research completed:', research);
    } catch (error) {
      console.error('Social research failed:', error);
    } finally {
      setIsLoadingSocial(false);
    }
  };

  const handleVideoCall = () => {
    // Assuming initiateCall is available in the context or passed as prop
    // For now, just log it
    console.log('Initiating video call with:', contact.name);
  };

  const scoreInfo = getScoreColor(contact.aiScore || contact.score);

  return (
    <div className={`
      relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 
      transition-all duration-200 hover:shadow-md hover:border-gray-300
      ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}
    `}>
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-4 left-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(contact.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      )}

      {/* Favorite & Actions */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <button
          onClick={handleToggleFavorite}
          className={`p-1 rounded-full transition-colors ${
            contact.isFavorite 
              ? 'text-yellow-500 hover:text-yellow-600' 
              : 'text-gray-400 hover:text-yellow-500'
          }`}
        >
          <Star size={16} fill={contact.isFavorite ? 'currentColor' : 'none'} />
        </button>

        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  {onView && (
                    <button
                      onClick={() => {
                        onView(contact);
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Eye size={14} className="mr-2" />
                      View Details
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(contact);
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit size={14} className="mr-2" />
                      Edit Contact
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleAnalyze();
                      setShowDropdown(false);
                    }}
                    disabled={isAnalyzing}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Brain size={14} className="mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
                  </button>
                  <button
                    onClick={() => {
                      handleEnrich();
                      setShowDropdown(false);
                    }}
                    disabled={isEnriching}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <TrendingUp size={14} className="mr-2" />
                    {isEnriching ? 'Enriching...' : 'Enrich Data'}
                  </button>
                  <button
                    onClick={() => {
                      handleSocialResearch();
                      setShowDropdown(false);
                    }}
                    disabled={isLoadingSocial}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Search size={14} className="mr-2" />
                    {isLoadingSocial ? 'Researching...' : 'Social Research'}
                  </button>
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          onDelete(contact.id);
                          setShowDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar & Basic Info */}
      <div className="flex items-start space-x-4 mb-4" style={{ marginTop: onSelect ? '1.5rem' : '0' }}>
        <div className="flex-shrink-0">
          {/* Use contact.avatarSrc or contact.avatar */}
          {contact.avatarSrc || contact.avatar ? (
            <img
              src={contact.avatarSrc || contact.avatar}
              alt={contact.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {contact.name}
          </h3>
          {contact.position && contact.company && (
            <p className="text-sm text-gray-600 truncate flex items-center">
              <Building2 size={12} className="mr-1 flex-shrink-0" />
              {contact.position} at {contact.company}
            </p>
          )}
          {contact.industry && (
            <p className="text-xs text-gray-500 mt-1">{contact.industry}</p>
          )}
        </div>
      </div>

      {/* AI Score & Status Badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {(contact.aiScore || contact.score) && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${scoreInfo.bg} ${scoreInfo.color} flex items-center`}>
              <Target size={10} className="mr-1" />
              {contact.aiScore || contact.score} ({scoreInfo.label})
            </div>
          )}
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}>
            {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
          </div>

          {contact.interestLevel && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterestColor(contact.interestLevel)}`}>
              {contact.interestLevel === 'medium' ? 'warm' : contact.interestLevel}
            </div>
          )}
        </div>
      </div>

      {/* Contact Methods */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail size={14} className="mr-2 text-gray-400" />
          <span className="truncate">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone size={14} className="mr-2 text-gray-400" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
              >
                <Tag size={8} className="mr-1" />
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                +{contact.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Social Profiles */}
      {contact.socialProfiles && Object.keys(contact.socialProfiles).length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            {contact.socialProfiles.linkedin && (
              <a
                href={contact.socialProfiles.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <LinkedinIcon size={16} />
              </a>
            )}
            {contact.socialProfiles.twitter && (
              <a
                href={contact.socialProfiles.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-500 transition-colors"
              >
                <TwitterIcon size={16} />
              </a>
            )}
            {contact.socialProfiles.website && (
              <a
                href={contact.socialProfiles.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-700 transition-colors"
              >
                <Globe size={16} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Last Contact */}
      {(contact.lastContact || contact.lastConnected) && (
        <div className="mb-4 text-xs text-gray-500 flex items-center">
          <Clock size={12} className="mr-1" />
          Last contact: {
            contact.lastContact 
              ? formatDistanceToNow(new Date(contact.lastContact), { addSuffix: true })
              : contact.lastConnected
          }
        </div>
      )}

      {/* Custom Fields Preview */}
      {contact.customFields && Object.keys(contact.customFields).length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Key Info:</div>
          <div className="space-y-1">
            {Object.entries(contact.customFields).slice(0, 2).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-gray-600">{key}:</span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Mail size={14} className="mr-1" />
          Email
        </button>
        
        {contact.phone && (
          <button
            onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Phone size={14} className="mr-1" />
            Call
          </button>
        )}
        
        <button
          onClick={handleVideoCall}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Video size={14} className="mr-1" />
          Video
        </button>
      </div>

      {/* Click-outside handler for dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default EnhancedContactCard;

