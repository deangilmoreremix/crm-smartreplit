import React from 'react';
import { useDuplicateContacts, DuplicateGroup } from '../hooks/useDuplicateContacts';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Mail,
  Phone,
  Building2,
  User,
  Tag,
  FileText,
  Merge,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';

const reasonLabel: Record<string, string> = {
  email: 'Same email',
  phone: 'Same phone',
  name_company: 'Same name + company',
};

const ContactPreview: React.FC<{ contact: any; label: string }> = ({ contact, label }) => (
  <div className={`p-3 rounded-lg border ${label === 'Primary' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      {label === 'Primary' && <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Keep</Badge>}
    </div>
    <div className="space-y-1 text-sm text-gray-700">
      <div className="flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-gray-500" />
        <span>{contact.firstName} {contact.lastName}</span>
      </div>
      {contact.email && (
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-gray-500" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}
      {contact.phone && (
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-gray-500" />
          <span>{contact.phone}</span>
        </div>
      )}
      {contact.company && (
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-gray-500" />
          <span className="truncate">{contact.company}</span>
        </div>
      )}
      {(contact.tags || []).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-gray-500" />
          {(contact.tags || []).slice(0, 4).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  </div>
);

const MergePreview: React.FC<{ merged: any }> = ({ merged }) => (
  <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800 space-y-1">
    <div className="font-medium text-gray-900 mb-1">Merged preview</div>
    <div><span className="text-gray-500">Name:</span> {merged.firstName} {merged.lastName}</div>
    {merged.email && <div><span className="text-gray-500">Email:</span> {merged.email}</div>}
    {merged.phone && <div><span className="text-gray-500">Phone:</span> {merged.phone}</div>}
    {merged.company && <div><span className="text-gray-500">Company:</span> {merged.company}</div>}
    {(merged.tags || []).length > 0 && (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-500">Tags:</span>
        {merged.tags.map((tag: string) => (
          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
        ))}
      </div>
    )}
    {merged.notes && (
      <div className="flex items-start gap-2">
        <FileText className="h-3.5 w-3.5 text-gray-500 mt-0.5" />
        <span className="whitespace-pre-wrap">{merged.notes}</span>
      </div>
    )}
  </div>
);

export const DuplicateContacts: React.FC = () => {
  const { isDark } = useTheme();
  const { duplicates, loading, error, refreshing, mergingId, mergeError, refresh, merge } = useDuplicateContacts();

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Duplicate Contacts
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Review and merge potential duplicates to keep your CRM clean.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className={`rounded-lg border p-4 text-sm ${isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {error}
        </div>
      )}

      {mergeError && (
        <div className={`rounded-lg border p-4 text-sm ${isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {mergeError}
        </div>
      )}

      {loading && (
        <div className={`rounded-xl border p-6 text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
          Scanning contacts for duplicates...
        </div>
      )}

      {!loading && duplicates.length === 0 && (
        <div className={`rounded-xl border p-6 flex items-center gap-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>No duplicates found</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your contact list looks clean.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {duplicates.map((group) => {
          const mergeKey = `${group.contactA.id}-${group.contactB.id}`;
          const isMerging = mergingId === mergeKey;

          return (
            <div key={mergeKey} className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {reasonLabel[group.reason] || 'Potential duplicate'}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {group.matchScore}% match
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <ContactPreview contact={group.contactA} label="Primary" />
                <ContactPreview contact={group.contactB} label="Duplicate" />
              </div>

              <MergePreview merged={group.merged} />

              <div className="flex justify-end mt-4">
                <Button
                  size="sm"
                  onClick={() => merge(group)}
                  disabled={isMerging}
                  className="flex items-center gap-2"
                >
                  <Merge className="h-4 w-4" />
                  {isMerging ? 'Merging...' : 'Merge contacts'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DuplicateContacts;
