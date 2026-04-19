import React, { useState, useMemo } from 'react';
import { ContactsViewIntegration } from '../components/contacts/ViewsIntegration';

const sampleContacts = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    company: 'Acme Inc',
    status: 'active',
    aiScore: 85,
    createdAt: '2024-01-15',
    industry: 'Technology',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    company: 'TechCorp',
    status: 'active',
    aiScore: 92,
    createdAt: '2024-01-14',
    industry: 'Finance',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael@example.com',
    company: 'Global Co',
    status: 'inactive',
    aiScore: 45,
    createdAt: '2024-01-13',
    industry: 'Healthcare',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    company: 'StartupXYZ',
    status: 'active',
    aiScore: 78,
    createdAt: '2024-01-12',
    industry: 'Technology',
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david@example.com',
    company: 'Enterprise Co',
    status: 'active',
    aiScore: 88,
    createdAt: '2024-01-11',
    industry: 'Manufacturing',
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    company: 'Tech Innovations',
    status: 'active',
    aiScore: 95,
    createdAt: '2024-01-10',
    industry: 'Technology',
  },
  {
    id: '7',
    name: 'James Taylor',
    email: 'james@example.com',
    company: 'Digital Solutions',
    status: 'inactive',
    aiScore: 35,
    createdAt: '2024-01-09',
    industry: 'Retail',
  },
  {
    id: '8',
    name: 'Jennifer Martinez',
    email: 'jennifer@example.com',
    company: 'Creative Agency',
    status: 'active',
    aiScore: 82,
    createdAt: '2024-01-08',
    industry: 'Marketing',
  },
  {
    id: '9',
    name: 'Robert Garcia',
    email: 'robert@example.com',
    company: 'Data Systems',
    status: 'active',
    aiScore: 76,
    createdAt: '2024-01-07',
    industry: 'Technology',
  },
  {
    id: '10',
    name: 'Amanda White',
    email: 'amanda@example.com',
    company: 'Cloud Services',
    status: 'active',
    aiScore: 91,
    createdAt: '2024-01-06',
    industry: 'Technology',
  },
];

const Contacts: React.FC = () => {
  const contacts = sampleContacts;

  return (
    <div className="h-screen w-full flex flex-col">
      <ContactsViewIntegration contacts={contacts} />
    </div>
  );
};

export default Contacts;
