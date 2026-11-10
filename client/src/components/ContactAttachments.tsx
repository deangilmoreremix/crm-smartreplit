import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET = 'crm-attachments';

interface AttachmentFile {
  name: string;
  size: number;
  createdAt?: string;
}

interface ContactAttachmentsProps {
  contactId: string;
}

const displayName = (stored: string) => stored.replace(/^\d+-/, '');
const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

const ContactAttachments: React.FC<ContactAttachmentsProps> = ({ contactId }) => {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFolder = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getUser();
    return data.user ? `${data.user.id}/${contactId}` : null;
  }, [contactId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const folder = await getFolder();
      if (!folder) {
        setFiles([]);
        setError('Sign in to view attachments.');
        return;
      }
      const { data, error: listError } = await supabase.storage.from(BUCKET).list(folder, {
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (listError) throw listError;
      setFiles(
        (data || [])
          .filter((f: { name?: string; id?: string | null }) => f.name && f.id)
          .map((f: { name: string; metadata?: unknown; created_at?: string }) => ({
            name: f.name,
            size: (f.metadata as { size?: number } | null)?.size ?? 0,
            createdAt: f.created_at,
          }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [getFolder]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (inputRef.current) inputRef.current.value = '';
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const folder = await getFolder();
      if (!folder) throw new Error('Sign in to upload attachments.');
      for (const file of selected) {
        const safe = file.name.replace(/[^\w.\-]+/g, '_');
        const { error: upError } = await supabase.storage
          .from(BUCKET)
          .upload(`${folder}/${Date.now()}-${safe}`, file, { contentType: file.type || undefined });
        if (upError) throw upError;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (name: string) => {
    setError(null);
    try {
      const folder = await getFolder();
      if (!folder) return;
      const { data, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(`${folder}/${name}`, 60, { download: displayName(name) });
      if (urlError || !data) throw urlError || new Error('Could not create download link');
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete ${displayName(name)}?`)) return;
    setError(null);
    try {
      const folder = await getFolder();
      if (!folder) return;
      const { error: rmError } = await supabase.storage.from(BUCKET).remove([`${folder}/${name}`]);
      if (rmError) throw rmError;
      setFiles((prev) => prev.filter((f) => f.name !== name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Uploading...' : 'Upload files'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : files.length === 0 ? (
        <div className="text-sm text-gray-500">No attachments yet.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate mr-3">
                {displayName(f.name)} <span className="text-gray-400">{formatSize(f.size)}</span>
              </span>
              <span className="flex gap-3 shrink-0">
                <button type="button" onClick={() => handleDownload(f.name)} className="text-blue-600 hover:underline">
                  Download
                </button>
                <button type="button" onClick={() => handleDelete(f.name)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactAttachments;
