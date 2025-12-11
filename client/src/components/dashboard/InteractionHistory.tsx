import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, ArrowRight } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

const InteractionHistory: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();
  const navigate = useNavigate();
  
  // Updated interactions with contactIds instead of direct participant arrays
  const interactions = [
    {
      id: 1,
      type: 'Royal Package Opportunity',
      value: '11,250$',
      date: 'Oct 12',
      status: 'active',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      participantIds: ['1', '2', '3'] // Contact IDs from the contact store
    },
    {
      id: 2,
      type: 'Third Deal Most Useful',
      value: '21,300$',
      date: 'Oct 9',
      status: 'success',
      bgColor: 'bg-teal-500',
      textColor: 'text-white',
      participantIds: ['2', '3', '1', '4']
    },
    {
      id: 3,
      type: 'Absolute Success Deal',
      value: '2,100$',
      date: 'Oct 12',
      status: 'pending',
      bgColor: 'bg-black',
      textColor: 'text-white',
      participantIds: ['5', '2', '3']
    },
    {
      id: 4,
      type: 'Royal Package Opportunity',
      value: '4,160$',
      date: 'Oct 11',
      status: 'warning',
      bgColor: 'bg-yellow-400',
      textColor: 'text-black',
      participantIds: ['1', '2']
    },
    {
      id: 5,
      type: 'Adaptive Business Services',
      value: '3,140$',
      date: 'Oct 7',
      status: 'success',
      bgColor: 'bg-gray-300',
      textColor: 'text-black',
      participantIds: ['3', '5']
    },
    {
      id: 6,
      type: 'Second deal Common Service',
      value: '12,350$',
      date: 'Oct 5',
      status: 'active',
      bgColor: 'bg-gray-300',
      textColor: 'text-black',
      participantIds: ['1', '2', '3']
    }
  ];

  const handleInteractionClick = (interactionId: number) => {
    // Navigate to the detailed view of the interaction
    console.log(`Opening interaction ${interactionId}`);
    navigate(`/interactions/${interactionId}`);
  };

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Interaction History</h2>
        <div className="flex items-center space-x-2">
          <button className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interactions.map((interaction) => (
          <div 
            onClick={() => handleInteractionClick(interaction.id)}
            key={interaction.id} 
            className={`
              ${interaction.bgColor} ${interaction.textColor} 
              rounded-2xl p-5 hover:scale-105 transition-all duration-300 cursor-pointer
              shadow-lg hover:shadow-xl
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">{interaction.date}</span>
              <button className={`p-1.5 rounded-lg transition-colors ${
                interaction.textColor === 'text-white' ? 'hover:bg-white/20' : 'hover:bg-black/10'
              }`}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3 leading-tight">{interaction.type}</h3>
              <p className="text-2xl font-bold">{interaction.value}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {interaction.participantIds.slice(0, 3).map((participantId, i) => {
                  const contact = contacts[participantId];
                  return contact ? (
                    <div key={i} className="relative">
                      <Avatar
                        src={contact.avatar}
                        alt={contact.name}
                        size="sm"
                        fallback={getInitials(contact.name)}
                        className="border-3 border-white object-cover shadow-lg ring-2 ring-white/50"
                      />
                    </div>
                  ) : null;
                })}
                {interaction.participantIds.length > 3 && (
                  <div className="w-8 h-8 rounded-full border-3 border-white bg-gray-400 flex items-center justify-center shadow-lg ring-2 ring-white/50">
                    <span className="text-xs font-semibold text-white">+{interaction.participantIds.length - 3}</span>
                  </div>
                )}
              </div>
              <ArrowRight className="w-5 h-5 opacity-70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractionHistory;