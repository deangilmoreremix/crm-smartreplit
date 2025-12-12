import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  domain?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  description?: string;
  industry?: string;
  website?: string;
  support_email?: string;
  support_phone?: string;
  subscription_tier: string;
  subscription_status: string;
  max_users: number;
  owner_user_id: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
  status: 'active' | 'pending' | 'suspended';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  permissions: any[];
  profiles?: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface CompanyContextType {
  currentCompany: Company | null;
  userCompanies: Company[];
  companyUsers: CompanyUser[];
  setCurrentCompany: (company: Company | null) => void;
  createCompany: (data: Partial<Company>) => Promise<Company>;
  inviteUser: (email: string, role: string) => Promise<void>;
  loadCompanies: () => Promise<void>;
  loadCompanyUsers: () => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  updateWhitelabelConfig: (config: any) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const { user } = useAuth();

  const loadCompanies = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const companies = await response.json();
        setUserCompanies(companies);
        
        // Set first company as current if none selected
        if (!currentCompany && companies.length > 0) {
          setCurrentCompany(companies[0]);
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadCompanyUsers = async () => {
    if (!currentCompany) return;
    
    try {
      const response = await fetch(`/api/companies/${currentCompany.id}/users`);
      if (response.ok) {
        const users = await response.json();
        setCompanyUsers(users);
      }
    } catch (error) {
      console.error('Error loading company users:', error);
    }
  };

  const createCompany = async (data: Partial<Company>): Promise<Company> => {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create company');
    }

    const company = await response.json();
    await loadCompanies();
    setCurrentCompany(company);
    return company;
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!currentCompany) throw new Error('No current company');
    
    const response = await fetch(`/api/companies/${currentCompany.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update company');
    }

    const updatedCompany = await response.json();
    setCurrentCompany(updatedCompany);
    
    // Update in userCompanies array
    setUserCompanies(prev => prev.map(c => 
      c.id === updatedCompany.id ? updatedCompany : c
    ));
  };

  const inviteUser = async (email: string, role: string) => {
    if (!currentCompany) throw new Error('No current company');
    
    const response = await fetch(`/api/companies/${currentCompany.id}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });

    if (!response.ok) {
      throw new Error('Failed to invite user');
    }

    await loadCompanyUsers();
  };

  const updateWhitelabelConfig = async (config: any) => {
    if (!currentCompany) throw new Error('No current company');
    
    const response = await fetch(`/api/companies/${currentCompany.id}/whitelabel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error('Failed to update whitelabel config');
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [user]);

  useEffect(() => {
    loadCompanyUsers();
  }, [currentCompany]);

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      userCompanies,
      companyUsers,
      setCurrentCompany,
      createCompany,
      inviteUser,
      loadCompanies,
      loadCompanyUsers,
      updateCompany,
      updateWhitelabelConfig
    }}>
      {children}
    </CompanyContext.Provider>
  );
};
