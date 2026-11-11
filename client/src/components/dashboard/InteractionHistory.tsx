import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useNavigate } from 'react-router-dom';
import { useCommunicationStore } from '../../store/communicationStore';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import SampleBadge from '../SampleBadge';
import { ArrowRight } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

const CARD_COLORS = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-black', text: 'text-white' },
  { bg: 'bg-yellow-400', text: 'text-black' },
  { bg: 'bg-gray-300', text: 'text-black' },
];

interface Interaction {
  id: string | number;
  type: string;
  value: string;
  date: string;
  status: string;
  bgColor: string;
  textColor: string;
  participantIds: string[];
  /** Set for real interactions; clicking opens this contact. Sample cards have none. */
  contactId?: string;
}

const InteractionHistory: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();
  const navigate = useNavigate();
  const { showDemoData } = useDemoDataSafe();
  const logs = useCommunicationStore((s) => s.communicationLogs);

  const realInteractions = [...(logs ?? [])]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)
    .map((log, i) => ({
      id: log.id,
      type: log.subject || `${log.type.replace('_', ' ')} (${log.direction})`,
      value: log.type.replace('_', ' '),
      date: new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: log.status,
      bgColor: CARD_COLORS[i % CARD_COLORS.length].bg,
      textColor: CARD_COLORS[i % CARD_COLORS.length].text,
      participantIds: log.contactId ? [log.contactId] : [],
      contactId: log.contactId,
    }));

  // Sample interactions (shown only while sample data is on and there are no real ones)
  const sampleInteractions = [
    {
      id: 1,
      type: 'Royal Package Opportunity',
      value: '11,250$',
      date: 'Oct 12',
      status: 'active',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      participantIds: ['1', '2', '3'], // Contact IDs from the contact store
    },
    {
      id: 2,
      type: 'Third Deal Most Useful',
      value: '21,300$',
      date: 'Oct 9',
      status: 'success',
      bgColor: 'bg-teal-500',
      textColor: 'text-white',
      participantIds: ['2', '3', '1', '4'],
    },
    {
      id: 3,
      type: 'Absolute Success Deal',
      value: '2,100$',
      date: 'Oct 12',
      status: 'pending',
      bgColor: 'bg-black',
      textColor: 'text-white',
      participantIds: ['5', '2', '3'],
    },
    {
      id: 4,
      type: 'Royal Package Opportunity',
      value: '4,160$',
      date: 'Oct 11',
      status: 'warning',
      bgColor: 'bg-yellow-400',
      textColor: 'text-black',
      participantIds: ['1', '2'],
    },
    {
      id: 5,
      type: 'Adaptive Business Services',
      value: '3,140$',
      date: 'Oct 7',
      status: 'success',
      bgColor: 'bg-gray-300',
      textColor: 'text-black',
      participantIds: ['3', '5'],
    },
    {
      id: 6,
      type: 'Second deal Common Service',
      value: '12,350$',
      date: 'Oct 5',
      status: 'active',
      bgColor: 'bg-gray-300',
      textColor: 'text-black',
      participantIds: ['1', '2', '3'],
    },
  ];

  const isSample = realInteractions.length === 0 && showDemoData;
  const interactions: Interaction[] = realInteractions.length
    ? realInteractions
    : showDemoData
      ? sampleInteractions
      : [];

  const handleInteractionClick = (interaction: Interaction) => {
    if (interaction.contactId) navigate(`/contacts/${interaction.contactId}`);
  };

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Interaction History
          {isSample && <SampleBadge className="ml-2 align-middle" />}
        </h2>
      </div>

      {interactions.length === 0 && (
        <p
          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          data-testid="interactions-empty"
        >
          No interactions yet. Logged calls, emails and meetings will appear here.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interactions.map((interaction) => (
          <div
            onClick={interaction.contactId ? () => handleInteractionClick(interaction) : undefined}
            key={interaction.id}
            className={`
              ${interaction.bgColor} ${interaction.textColor} 
              rounded-2xl p-5 transition-all duration-300 ${interaction.contactId ? 'cursor-pointer hover:scale-105' : ''}
              shadow-lg hover:shadow-xl
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">{interaction.date}</span>
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
