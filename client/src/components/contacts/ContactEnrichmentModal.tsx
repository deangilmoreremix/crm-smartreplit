import React, { useState } from 'react';
import { X, Zap, Loader2, CheckCircle, AlertCircle, User, Mail, Camera, Globe } from 'lucide-react';
import { Contact } from '../../types/contact';
import { aiEnrichmentService, ContactEnrichmentData } from '../../services/aiEnrichmentService';
import { useContactStore } from '../../hooks/useContactStore';

interface ContactEnrichmentModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
}

type EnrichmentType = 'email' | 'name' | 'multimodal' | 'social';

interface EnrichmentOption {
  type: EnrichmentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

const ContactEnrichmentModal: React.FC<ContactEnrichmentModalProps> = ({
  contact,
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<EnrichmentType>('email');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<ContactEnrichmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedFields, setAppliedFields] = useState<string[]>([]);

  const { updateContact } = useContactStore();

  const enrichmentOptions: EnrichmentOption[] = [
    {
      type: 'email',
      label: 'Email Enrichment',
      description: 'Enrich contact using email address with social profiles and company data',
      icon: <Mail className="h-5 w-5" />,
      available: !!contact.email,
    },
    {
      type: 'name',
      label: 'Name & Company',
      description: 'Find contact information using name and company',
      icon: <User className="h-5 w-5" />,
      available: !!(contact.firstName || contact.lastName) && !!contact.company,
    },
    {
      type: 'multimodal',
      label: 'AI Image Analysis',
      description: 'Analyze contact photo for personality insights and professional traits',
      icon: <Camera className="h-5 w-5" />,
      available: !!contact.avatar || !!contact.avatarSrc,
    },
    {
      type: 'social',
      label: 'Social Research',
      description: 'Comprehensive social media research and personality analysis',
      icon: <Globe className="h-5 w-5" />,
      available: true,
    },
  ];

  const handleEnrich = async () => {
    if (!selectedType) return;

    setIsEnriching(true);
    setError(null);
    setEnrichmentResult(null);
    setAppliedFields([]);

    try {
      let result: ContactEnrichmentData;

      switch (selectedType) {
        case 'email':
          result = await aiEnrichmentService.enrichContactByEmail(contact.email);
          break;
        case 'name':
          result = await aiEnrichmentService.enrichContactByName(
            contact.firstName || '',
            contact.lastName || '',
            contact.company
          );
          break;
        case 'multimodal':
          const imageUrl = contact.avatarSrc || contact.avatar || '';
          if (!imageUrl) throw new Error('No image available for analysis');
          result = await aiEnrichmentService.enrichContactMultimodal(contact, imageUrl);
          break;
        case 'social':
          result = await aiEnrichmentService.enrichContactWithSocialResearch(contact, {
            includePersonalityAnalysis: true,
            includeEngagementMetrics: true,
          });
          break;
        default:
          throw new Error('Invalid enrichment type');
      }

      setEnrichmentResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleApplyChanges = () => {
    if (!enrichmentResult) return;

    const updates: Partial<Contact> = {};
    const applied: string[] = [];

    // Apply available fields
    if (enrichmentResult.firstName && !contact.firstName) {
      updates.firstName = enrichmentResult.firstName;
      applied.push('First Name');
    }
    if (enrichmentResult.lastName && !contact.lastName) {
      updates.lastName = enrichmentResult.lastName;
      applied.push('Last Name');
    }
    if (enrichmentResult.phone && !contact.phone) {
      updates.phone = enrichmentResult.phone;
      applied.push('Phone');
    }
    if (enrichmentResult.title && !contact.title) {
      updates.title = enrichmentResult.title;
      updates.position = enrichmentResult.title;
      applied.push('Title');
    }
    if (enrichmentResult.company && !contact.company) {
      updates.company = enrichmentResult.company;
      applied.push('Company');
    }
    if (enrichmentResult.industry && !contact.industry) {
      updates.industry = enrichmentResult.industry;
      applied.push('Industry');
    }
    if (enrichmentResult.location) {
      const locationStr = [
        enrichmentResult.location.city,
        enrichmentResult.location.state,
        enrichmentResult.location.country,
      ]
        .filter(Boolean)
        .join(', ');
      if (locationStr && !contact.location) {
        updates.location = locationStr;
        applied.push('Location');
      }
    }
    if (enrichmentResult.socialProfiles) {
      updates.socialProfiles = {
        ...contact.socialProfiles,
        ...enrichmentResult.socialProfiles,
      };
      applied.push('Social Profiles');
    }
    if (enrichmentResult.avatar && !contact.avatar) {
      updates.avatar = enrichmentResult.avatar;
      updates.avatarSrc = enrichmentResult.avatar;
      applied.push('Avatar');
    }
    if (enrichmentResult.bio && !contact.notes) {
      updates.notes = enrichmentResult.bio;
      applied.push('Bio/Notes');
    }

    if (Object.keys(updates).length > 0) {
      updateContact(contact.id, updates);
      setAppliedFields(applied);
    }
  };

  const resetModal = () => {
    setSelectedType('email');
    setIsEnriching(false);
    setEnrichmentResult(null);
    setError(null);
    setAppliedFields([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Enrich Contact: {contact.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enrichment Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select Enrichment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrichmentOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  disabled={!option.available}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedType === option.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${!option.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-0.5 ${selectedType === option.type ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{option.label}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                      {!option.available && (
                        <p className="text-xs text-red-500 mt-1">Not available for this contact</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Enrich Button */}
          <div className="flex justify-center">
            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Enrich Contact</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Enrichment Results */}
          {enrichmentResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    Enrichment Complete
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {enrichmentResult.firstName && (
                    <div>
                      <strong>First Name:</strong> {enrichmentResult.firstName}
                    </div>
                  )}
                  {enrichmentResult.lastName && (
                    <div>
                      <strong>Last Name:</strong> {enrichmentResult.lastName}
                    </div>
                  )}
                  {enrichmentResult.phone && (
                    <div>
                      <strong>Phone:</strong> {enrichmentResult.phone}
                    </div>
                  )}
                  {enrichmentResult.title && (
                    <div>
                      <strong>Title:</strong> {enrichmentResult.title}
                    </div>
                  )}
                  {enrichmentResult.company && (
                    <div>
                      <strong>Company:</strong> {enrichmentResult.company}
                    </div>
                  )}
                  {enrichmentResult.industry && (
                    <div>
                      <strong>Industry:</strong> {enrichmentResult.industry}
                    </div>
                  )}
                  {enrichmentResult.location && (
                    <div>
                      <strong>Location:</strong>{' '}
                      {[
                        enrichmentResult.location.city,
                        enrichmentResult.location.state,
                        enrichmentResult.location.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                  {enrichmentResult.socialProfiles && (
                    <div>
                      <strong>Social Profiles:</strong>
                      <div className="ml-4 mt-1 space-y-1">
                        {enrichmentResult.socialProfiles.linkedin && (
                          <div>LinkedIn: {enrichmentResult.socialProfiles.linkedin}</div>
                        )}
                        {enrichmentResult.socialProfiles.twitter && (
                          <div>Twitter: {enrichmentResult.socialProfiles.twitter}</div>
                        )}
                        {enrichmentResult.socialProfiles.website && (
                          <div>Website: {enrichmentResult.socialProfiles.website}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {enrichmentResult.bio && (
                    <div>
                      <strong>Bio:</strong> {enrichmentResult.bio}
                    </div>
                  )}
                  {enrichmentResult.confidence && (
                    <div>
                      <strong>Confidence:</strong> {enrichmentResult.confidence}%
                    </div>
                  )}
                </div>
              </div>

              {/* Apply Changes Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleApplyChanges}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Apply Changes</span>
                </button>
              </div>

              {/* Applied Fields Feedback */}
              {appliedFields.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                      Changes Applied Successfully
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Updated fields: {appliedFields.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactEnrichmentModal;
