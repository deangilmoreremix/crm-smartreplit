import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import {
  DomainRow,
  listDomains,
  removeDomain,
  requestDomain,
  verifyDomain,
} from '../services/whitelabelService';

const NETLIFY_CNAME_TARGET: string =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_NETLIFY_CNAME_TARGET ||
  'your-site-name.netlify.app';

const statusVariant = (d: DomainRow): 'default' | 'secondary' | 'destructive' | 'outline' =>
  d.status === 'active' ? 'default' : d.status === 'failed' || d.status === 'suspended' ? 'destructive' : 'secondary';

const WhiteLabelDomains: React.FC = () => {
  const { toast } = useToast();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDomains(await listDomains());
    } catch (e) {
      toast({ title: 'Could not load domains', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      await requestDomain(newDomain);
      setNewDomain('');
      await load();
    } catch (err) {
      toast({ title: 'Could not add domain', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleVerify = async (d: DomainRow) => {
    setBusyId(d.id);
    try {
      const { verified, domain } = await verifyDomain(d.id);
      toast({
        title: verified ? 'Domain verified' : 'Not verified yet',
        description: verified ? undefined : domain.error_message ?? 'DNS record not found.',
        variant: verified ? 'default' : 'destructive',
      });
      await load();
    } catch (err) {
      toast({ title: 'Verification failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (d: DomainRow) => {
    if (!window.confirm(`Remove ${d.domain}?`)) return;
    setBusyId(d.id);
    try {
      await removeDomain(d.id);
      await load();
    } catch (err) {
      toast({ title: 'Could not remove domain', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen pb-8 bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-4xl">
        <DashboardHeader title="Custom Domains" subtitle="Serve your branded CRM from your own domain" />
        <Link to="/white-label" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to White Label Customization
        </Link>

        <GlassCard hover={false}>
          <CardContent className="p-6">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="crm.yourcompany.com"
                aria-label="Domain"
              />
              <Button type="submit" disabled={!newDomain.trim()}>
                <Plus className="h-4 w-4 mr-2" /> Add domain
              </Button>
            </form>
          </CardContent>
        </GlassCard>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom domains yet.</p>
        ) : (
          domains.map((d) => (
            <GlassCard key={d.id} hover={false}>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-500" />
                    <span className="font-semibold">{d.domain}</span>
                    <Badge variant={statusVariant(d)}>{d.status}</Badge>
                    <Badge variant="outline">DNS {d.dns_verified ? 'verified' : 'unverified'}</Badge>
                    <Badge variant="outline">SSL {d.ssl_status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={busyId === d.id} onClick={() => handleVerify(d)}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Verify
                    </Button>
                    <Button variant="outline" size="sm" disabled={busyId === d.id} onClick={() => handleRemove(d)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>

                {d.error_message && !d.dns_verified && (
                  <p className="text-sm text-destructive">{d.error_message}</p>
                )}

                <div className="text-sm space-y-3">
                  <div>
                    <p className="font-medium">1. Prove ownership: add this DNS TXT record</p>
                    <dl className="mt-1 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 font-mono text-xs break-all">
                      <dt>Name</dt>
                      <dd>_smartcrm-verify.{d.domain}</dd>
                      <dt>Value</dt>
                      <dd>{d.verification_token}</dd>
                    </dl>
                  </div>
                  <div>
                    <p className="font-medium">2. Serve the domain and issue its SSL certificate (Netlify)</p>
                    <p className="text-muted-foreground">
                      In Netlify, open your site, go to Domain management, and add <code>{d.domain}</code> as a
                      domain alias. Then add a DNS record <code>CNAME {d.domain} {NETLIFY_CNAME_TARGET}</code> at
                      your DNS provider. Netlify issues the SSL certificate automatically once DNS points at it;
                      SSL status here is not updated automatically and stays &quot;pending&quot; until then.
                    </p>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};

export default WhiteLabelDomains;
