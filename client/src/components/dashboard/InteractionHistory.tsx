import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useDealStore } from '../../store/dealStore';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, ArrowRight } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

const InteractionHistory: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();
  const { deals } = useDealStore();
  const navigate = useNavigate();

  // Real deals, most recently updated first
  const stageStyle = (stage: string) => {
    switch (stage) {
      case 'closed-won':
        return { bgColor: 'bg-teal-500', textColor: 'text-white' };
      case 'negotiation':
        return { bgColor: 'bg-blue-500', textColor: 'text-white' };
      case 'proposal':
        return { bgColor: 'bg-yellow-400', textColor: 'text-black' };
      default:
        return { bgColor: 'bg-gray-300', textColor: 'text-black' };
    }
  };

  const interactions = Object.values(deals)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)
    .map((deal) => ({
      id: deal.id,
      type: deal.title,
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(deal.value),
      date: new Date(deal.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      ...stageStyle(String(deal.stage)),
      participantIds: [deal.contactId],
    }));

  const handleInteractionClick = (dealId: string) => {
    navigate(`/deals/${dealId}`);
  };

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Interaction History
        </h2>
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button
            className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {interactions.length === 0 && (
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No deals yet. Deal activity will appear here.
        </p>
      )}

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
              <button
                className={`p-1.5 rounded-lg transition-colors ${
                  interaction.textColor === 'text-white' ? 'hover:bg-white/20' : 'hover:bg-black/10'
                }`}
              >
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
                    <span className="text-xs font-semibold text-white">
                      +{interaction.participantIds.length - 3}
                    </span>
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
