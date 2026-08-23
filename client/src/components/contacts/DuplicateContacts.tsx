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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';

const reasonLabel: Record<string, string> = {
  email: 'Same email',
  phone: 'Same phone',
  name_company: 'Same name + company',
};

const ContactPreview: React.FC<{ contact: any; label: string }> = ({ contact, label }) => (
  <div className={`rounded-lg border p-3 space-y-2 ${label === 'Primary' ? 'bg-green-50/60 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
    <div className="flex items-center justify-between">
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
  <div className="rounded-md bg-blue-50/60 border border-blue-200 p-3 text-sm text-gray-800 space-y-1">
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
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Duplicate Contacts</h2>
          <p className="text-sm text-gray-600">
            Review and merge potential duplicates to keep your CRM clean.
          </p>
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
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {mergeError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {mergeError}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-600">Scanning contacts for duplicates...</div>
      )}

      {!loading && duplicates.length === 0 && (
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">No duplicates found</p>
              <p className="text-sm text-gray-600">Your contact list looks clean.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {duplicates.map((group) => {
          const mergeKey = `${group.contactA.id}-${group.contactB.id}`;
          const isMerging = mergingId === mergeKey;

          return (
            <Card key={mergeKey}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    {reasonLabel[group.reason] || 'Potential duplicate'}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {group.matchScore}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ContactPreview contact={group.contactA} label="Primary" />
                  <ContactPreview contact={group.contactB} label="Duplicate" />
                </div>
                <MergePreview merged={group.merged} />
                <div className="flex justify-end">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DuplicateContacts;
