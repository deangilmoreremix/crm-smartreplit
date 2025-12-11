import React, { useState } from 'react';
import { MoreHorizontal, Mail, MapPin, Building, Star } from 'lucide-react'; // Added Star import
import Avatar from './ui/Avatar';
import CallButton from './CallButton';
import { getInitials } from '../utils/avatars';
import { useTheme } from '../contexts/ThemeContext';
import { Contact } from '../types/contact';
import { useContactStore } from '../hooks/useContactStore';

interface ContactCardProps {
  contact: Contact;
  onContactClick?: (contact: Contact) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onContactClick }) => {
  const { isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { updateContact } = useContactStore(); // Destructure updateContact

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick(contact);
    }
  };

  const getStatusColor = (interestLevel: string) => {
    switch (interestLevel) {
      case 'hot': return isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800';
      case 'warm': 
      case 'medium': return isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-800';
      case 'cold': 
      case 'low': return isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800';
      default: return isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onContactClick
    updateContact(contact.id, { isFavorite: !contact.isFavorite });
  };

  return (
    <div 
      onClick={handleContactClick}
      className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-2xl p-6 hover:${isDark ? 'bg-gray-800/70' : 'bg-gray-50'} transition-all duration-300 group cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-4">
        <Avatar 
          src={contact.avatarSrc || contact.avatar} // Use avatarSrc or avatar
          alt={contact.name}
          size="lg"
          fallback={getInitials(contact.name)}
          status="online"
        />
        <div className="flex items-center space-x-2"> {/* Wrapper for favorite and more buttons */}
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
          <button 
            className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors opacity-0 group-hover:opacity-100 relative`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            
            {menuOpen && (
              <div 
                className={`absolute right-0 mt-1 w-40 ${
                  isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'
                } border rounded-lg shadow-lg z-10 py-1`}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className={`w-full text-left px-3 py-2 text-sm ${
                    isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-700'
                  } flex items-center space-x-2`}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit contact:', contact.id);
                  }}
                >
                  <MapPin size={14} className="text-gray-400" />
                  <span>Edit Contact</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 text-sm ${
                    isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-700'
                  } flex items-center space-x-2`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`mailto:${contact.email}`, '_blank');
                  }}
                >
                  <Mail size={14} className="text-gray-400" />
                  <span>Send Email</span>
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className={`font-medium ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}>
            {contact.name}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{contact.title || contact.position}</p>
          {contact.company && (
            <div className={`flex items-center mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <Building size={12} className="mr-1" />
              {contact.company}
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <span>Source:</span>
          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{contact.source || (contact.sources && contact.sources[0]) || 'Unknown'}</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.interestLevel || contact.status)}`}>
            {contact.interestLevel || contact.status}
          </span>
          {contact.tags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <button className={`p-2 ${isDark ? 'bg-white/10 hover:bg-green-400/20' : 'bg-gray-100 hover:bg-green-100'} rounded-lg transition-colors`}>
            <Mail className={`h-4 w-4 ${isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`} />
          </button>
          
          {/* Video/Audio Call Buttons */}
          <CallButton 
            contact={contact} 
            variant="icon" 
            size="md" 
          />
        </div>
      </div>
    </div>
  );
};

export default ContactCard;

