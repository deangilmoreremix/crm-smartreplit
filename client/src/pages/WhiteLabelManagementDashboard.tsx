import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import {
  BrandingVersion,
  DomainRow,
  listBrandingHistory,
  listDomains,
} from '../services/whitelabelService';

const WhiteLabelManagementDashboard: React.FC = () => {
  const { config, resetToDefault, updateConfig } = useWhitelabel();
  const { toast } = useToast();
  const [history, setHistory] = useState<BrandingVersion[]>([]);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [h, d] = await Promise.all([listBrandingHistory(), listDomains()]);
      setHistory(h);
      setDomains(d);
    } catch (e) {
      toast({ title: 'Could not load white-label data', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = (version: BrandingVersion) => {
    if (!window.confirm(`Restore the version saved ${new Date(version.created_at).toLocaleString()}?`)) return;
    // Reset first so keys absent from the old version return to defaults; the context then saves
    // the restored config to Supabase (which records it as a new history entry).
    resetToDefault();
    updateConfig(version.config);
    toast({ title: 'Version restored', description: 'Saving to your account...' });
    setTimeout(load, 2000);
  };

  return (
    <div className="min-h-screen pb-8 bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-4xl">
        <DashboardHeader title="White Label Management" subtitle="Your branding, version history and domains" />

        <GlassCard hover={false}>
          <CardHeader>
            <CardTitle>Current branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold">{config.companyName}</span>
              {[config.primaryColor, config.secondaryColor].filter(Boolean).map((c) => (
                <span key={c} className="inline-flex items-center gap-1">
                  <span className="inline-block h-4 w-4 rounded border" style={{ backgroundColor: c }} />
                  <code>{c}</code>
                </span>
              ))}
            </div>
            <Link to="/white-label" className="inline-block text-sm underline">Edit branding</Link>
          </CardContent>
        </GlassCard>

        <GlassCard hover={false}>
          <CardHeader>
            <CardTitle>Domains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom domains yet.</p>
            ) : (
              domains.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <span>{d.domain}</span>
                  <Badge variant={d.status === 'active' ? 'default' : 'secondary'}>{d.status}</Badge>
                </div>
              ))
            )}
            <Link to="/white-label/domains" className="inline-block text-sm underline">Manage domains</Link>
          </CardContent>
        </GlassCard>

        <GlassCard hover={false}>
          <CardHeader>
            <CardTitle>Version history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved versions yet.</p>
            ) : (
              history.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span>
                    {new Date(v.created_at).toLocaleString()} — {v.config.companyName ?? 'Untitled'}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => restore(v)}>
                    Restore this version
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
};

export default WhiteLabelManagementDashboard;
