import React from 'react';
import { Plus, UserPlus, Calendar, Mail, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { Deal } from '../../types/deal';
import { useAITools } from '../../components/AIToolsProvider';
import { useVideoCall } from '../../contexts/VideoCallContext';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

const QuickActions = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { openTool } = useAITools();
  const { initiateCall } = useVideoCall();
  const navigate = useNavigate();
  
  // Get active deals
  const activeDeals = deals.filter((deal: Deal) =>
    deal.stage.id !== 'closed-won' && deal.stage.id !== 'closed-lost'
  );

  // Get deals with contacts for avatar display
  const dealsWithContacts = activeDeals
    .map((deal: Deal) => ({
      ...deal,
      contact: contacts[deal.contactId]
    }))
    .filter((deal) => deal.contact); // Only include deals with valid contacts
  
  // Get contacts for the contact button
  const activeContacts = Object.values(contacts);

  // Render avatar stack for buttons
  const renderAvatarStack = (items: any[], maxVisible: number = 3) => {
    const visibleItems = items.slice(0, maxVisible);
    const remainingCount = Math.max(0, items.length - maxVisible);
    
    return (
      <div className="flex items-center mt-3">
        <div className="flex -space-x-2">
          {visibleItems.map((item, index) => {
            // If the item is a deal with contact property, use the contact
            // Otherwise assume it's a contact directly
            const contact = 'contact' in item ? item.contact : item;
            
            return (
              <div key={index} className="relative" style={{ zIndex: maxVisible - index }}>
                <Avatar
                  src={contact.avatar}
                  alt={contact.name}
                  size="sm"
                  fallback={getInitials(contact.name)}
className="shadow-sm"
                />
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              +{remainingCount}
            </div>
          )}
        </div>
        <span className="text-white/90 text-sm font-medium ml-2">
          {items.length} {items === dealsWithContacts ? 'deals' : 'contacts'}
        </span>
      </div>
    );
  };

  const handleActionClick = (action: string) => {
    switch(action) {
      case 'newDeal':
        // Navigate to pipeline page where user can create deals
        navigate('/pipeline');
        break;
      case 'addContact':
        // Navigate to contacts page where user can create contacts
        navigate('/contacts');
        break;
      case 'scheduleMeeting':
        // Open meeting scheduler
        openTool('meeting-agenda');
        break;
      case 'sendEmail':
        // Open email composer
        openTool('email-composer');
        break;
      case 'videoCall':
        // Start video call interface
        // For quick action, we'll open the video call interface
        // In a real app, you might show a contact picker first
        const dummyRecipient = {
          id: 'demo',
          name: 'Demo Call',
          email: 'demo@example.com'
        };
        initiateCall(dummyRecipient, 'video');
        break;
      default:
        // Action not implemented yet
        break;
    }
  };

  const actions = [
    {
      title: 'New Deal',
      description: 'Create a new deal',
      icon: Plus,
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'hover:from-green-600 hover:to-emerald-600',
      action: 'newDeal',
      data: dealsWithContacts
    },
    {
      title: 'Add Contact',
      description: 'Add new contact',
      icon: UserPlus,
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600',
      action: 'addContact',
      data: activeContacts
    },
    {
      title: 'Schedule Meeting',
      description: 'Book a meeting',
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
      action: 'scheduleMeeting'
    },
    {
      title: 'Send Email',
      description: 'Compose email',
      icon: Mail,
      color: 'from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600',
      action: 'sendEmail'
    },
    {
      title: 'Video Call',
      description: 'Start video call',
      icon: Video,
      color: 'from-indigo-500 to-purple-500',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-600',
      action: 'videoCall'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.action)}
            className={`bg-gradient-to-r ${action.color} ${action.hoverColor} rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{action.title}</h3>
                <p className="text-sm text-white/80">{action.description}</p>
              </div>
            </div>
            
            {/* Render avatar stack if data is available */}
            {'data' in action && action.data && action.data.length > 0 && renderAvatarStack(action.data)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;