export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  position?: string;
  industry?: string;
  avatarSrc?: string;
  avatar?: string;
  sources?: string[];
  source?: string;
  interestLevel?: 'hot' | 'medium' | 'low' | 'cold';
  status: string;
  lastConnected?: string;
  lastContact?: Date;
  notes?: string;
  aiScore?: number;
  score?: number;
  tags: string[];
  isFavorite?: boolean;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  customFields?: Record<string, any>;
  location?: string;
  department?: string;
  preferredContact?: 'email' | 'phone' | 'text' | 'social';
  timezone?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}