import React from 'react';
import LeadsSection from '../LeadsSection';
import { Contact } from '../../types/contact';

interface NewLeadsSectionProps {
  onContactClick?: (contact: Contact) => void;
}

const NewLeadsSection: React.FC<NewLeadsSectionProps> = ({ onContactClick }) => {
  return <LeadsSection onContactClick={onContactClick} />;
};

export default NewLeadsSection;