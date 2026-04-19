import React, { useState } from 'react';
import { Building2, Globe, Link2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface TenantSettingsProps {
  className?: string;
}

interface TenantConfig {
  tenantName: string;
  subdomain: string;
  customDomain: string;
  brandingName: string;
}

export const TenantSettings: React.FC<TenantSettingsProps> = ({ className }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TenantConfig>({
    tenantName: 'SmartCRM',
    subdomain: 'smartcrm',
    customDomain: '',
    brandingName: 'SmartCRM',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: 'Tenant Settings Saved',
        description: 'Your tenant configuration has been updated.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save tenant settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidateDomain = () => {
    if (!config.customDomain) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a custom domain.',
        variant: 'destructive',
      });
      return;
    }

    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(config.customDomain)) {
      toast({
        title: 'Invalid Domain',
        description: 'Please enter a valid domain (e.g., crm.yourcompany.com).',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Domain Validated',
      description: `The domain ${config.customDomain} appears to be valid.`,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Tenant Settings
        </CardTitle>
        <CardDescription>Configure your tenant identity and domain settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="tenant-name" className="text-base font-medium">
              Tenant Name
            </Label>
            <Input
              id="tenant-name"
              value={config.tenantName}
              onChange={(e) => setConfig({ ...config, tenantName: e.target.value })}
              placeholder="Your Organization Name"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This name will be displayed across the platform
            </p>
          </div>

          <div>
            <Label htmlFor="branding-name" className="text-base font-medium">
              Branding Name
            </Label>
            <Input
              id="branding-name"
              value={config.brandingName}
              onChange={(e) => setConfig({ ...config, brandingName: e.target.value })}
              placeholder="Product Name"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Name used in emails and public-facing pages
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h4 className="font-medium text-base mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domain Configuration
          </h4>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subdomain" className="text-base font-medium">
                Subdomain
              </Label>
              <div className="flex items-center mt-1">
                <Input
                  id="subdomain"
                  value={config.subdomain}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="yourcompany"
                  className="flex-1"
                />
                <span className="ml-2 text-muted-foreground">.smartcrm.app</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your unique subdomain on the platform
              </p>
            </div>

            <div>
              <Label
                htmlFor="custom-domain"
                className="text-base font-medium flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Custom Domain
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="custom-domain"
                  value={config.customDomain}
                  onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                  placeholder="crm.yourcompany.com"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleValidateDomain}>
                  Validate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Point your domain CNAME record to smartcrm.proxy.com
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
            Domain Setup Required
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            To use a custom domain, add a CNAME record pointing to{' '}
            <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">
              smartcrm.proxy.com
            </code>
            . DNS changes may take up to 48 hours to propagate.
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Tenant Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantSettings;
