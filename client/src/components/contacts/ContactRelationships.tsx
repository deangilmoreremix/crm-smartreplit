import React, { useMemo } from 'react';
import { useContactStore } from '../hooks/useContactStore';
import { Building2, Users, User, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Contact Relationships</h2>
          <p className="text-sm text-gray-600">
            Contacts grouped by shared company. Use this to discover internal relationships and
            prioritize multi-stakeholder outreach.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {groups.length} companies · {totalRelated} related contacts
        </Badge>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">No relationships found</p>
              <p className="text-sm text-gray-600">
                Add company values to your contacts to see relationship groupings.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.company}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {group.company}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`rounded-md border p-2.5 space-y-1 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {contact.status}
                      </Badge>
                    </div>
                    {contact.position && (
                      <div className="text-xs text-gray-600 ml-5">{contact.position}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-600 ml-5">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactRelationships;
