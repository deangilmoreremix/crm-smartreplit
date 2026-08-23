import React, { useMemo } from 'react';
import { useContactStore } from '../hooks/useContactStore';
import { Building2, Users, User, Mail, Phone } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';

interface CompanyGroup {
  company: string;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    status: string;
  }>;
}

export const ContactRelationships: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();

  const groups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, CompanyGroup['contacts']>();

    Object.values(contacts || {}).forEach((contact) => {
      const company = (contact.company || '').trim();
      if (!company) return;

      const list = map.get(company) || [];
      list.push({
        id: contact.id,
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone,
        position: contact.position || contact.title || '',
        status: contact.status || 'active',
      });
      map.set(company, list);
    });

    return Array.from(map.entries())
      .map(([company, contacts]) => ({ company, contacts }))
      .filter((group) => group.contacts.length > 1)
      .sort((a, b) => b.contacts.length - a.contacts.length);
  }, [contacts]);

  const totalRelated = groups.reduce((sum, group) => sum + group.contacts.length, 0);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contact Relationships
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Contacts grouped by shared company. Use this to discover internal relationships and
              prioritize multi-stakeholder outreach.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {groups.length} companies · {totalRelated} related contacts
        </Badge>
      </div>

      {groups.length === 0 ? (
        <div className={`rounded-xl border p-6 flex items-center gap-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <Building2 className="h-5 w-5 text-gray-500" />
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>No relationships found</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Add company values to your contacts to see relationship groupings.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div key={group.company} className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {group.company}
                </h3>
              </div>
              <div className="space-y-3">
                {group.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`rounded-lg border p-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-500" />
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {contact.status}
                      </Badge>
                    </div>
                    {contact.position && (
                      <div className={`text-xs mt-1 ml-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{contact.position}</div>
                    )}
                    <div className={`flex items-center gap-3 text-xs mt-1 ml-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactRelationships;
