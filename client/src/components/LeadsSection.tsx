import React from 'react';
import { useContactStore } from '../store/contactStore';
import { useNavigate } from 'react-router-dom';
import ContactCard from './ContactCard';
import { Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Contact } from '../types/contact';

interface LeadsSectionProps {
  onContactClick?: (contact: Contact) => void;
}

const LeadsSection: React.FC<LeadsSectionProps> = ({ onContactClick }) => {
  const { contacts } = useContactStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // Get first 4 contacts as new leads, preferring hot leads
  const newLeads = Object.values(contacts)
    .filter(contact => contact.interestLevel === 'hot' || contact.status === 'hot')
    .slice(0, 4);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>New Leads</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{newLeads.length} active leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {newLeads.filter(lead => lead.interestLevel === 'hot' || lead.status === 'hot').length} hot
          </span>
          <button 
            onClick={() => navigate('/contacts/new')}
            className={`px-4 py-2 ${isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-200'} border rounded-lg hover:${isDark ? 'bg-green-500/30' : 'bg-green-200'} transition-colors flex items-center`}
          >
            <Plus size={16} className="mr-1" />
            Add Lead
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {newLeads.map((lead) => (
          <ContactCard 
            key={lead.id} 
            contact={lead} 
            onContactClick={onContactClick}
          />
        ))}
      </div>
    </div>
  );
};

export default LeadsSection;