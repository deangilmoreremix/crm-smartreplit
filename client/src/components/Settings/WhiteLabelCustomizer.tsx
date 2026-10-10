import React, { useState, useEffect } from 'react';
import { Palette, Image, RotateCcw, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColorInput } from '@/components/ui/ColorInput';
import { useWhitelabel } from '@/contexts/WhitelabelContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

interface WhiteLabelCustomizerProps {
  className?: string;
}

export const WhiteLabelCustomizer: React.FC<WhiteLabelCustomizerProps> = ({ className }) => {
  const { config, updateConfig, resetToDefault } = useWhitelabel();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState(config.companyName);
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logoUrl || null);

  useEffect(() => {
    setCompanyName(config.companyName);
    setPrimaryColor(config.primaryColor);
    setSecondaryColor(config.secondaryColor);
    setLogoUrl(config.logoUrl || '');
    setLogoPreview(config.logoUrl || null);
  }, [config]);

  const handleSave = () => {
    updateConfig({
      companyName,
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl || undefined,
    });
    toast({
      title: 'Branding Updated',
      description: 'Your white label settings have been saved.',
    });
  };

  const handleReset = () => {
    resetToDefault();
    setCompanyName('Smart CRM');
    setPrimaryColor('#3B82F6');
    setSecondaryColor('#6366F1');
    setLogoUrl('');
    setLogoPreview(null);
    toast({
      title: 'Reset Complete',
      description: 'Branding has been reset to default values.',
    });
  };

  const handleDarkModeToggle = (checked: boolean) => {
    toggleTheme();
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          White Label Customization
        </CardTitle>
        <CardDescription>
          Customize your branding to match your organization&apos;s identity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-base font-medium">
                Dark Mode
              </Label>
              <p className="text-sm text-muted-foreground">Enable dark mode for your dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch id="dark-mode" checked={isDark} onCheckedChange={handleDarkModeToggle} />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="company-name" className="text-base font-medium">
              Company Name
            </Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorInput
            id="primary-color"
            label="Primary Color"
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorInput
            id="secondary-color"
            label="Secondary Color"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-url" className="text-base font-medium">
            Logo URL
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="flex-1"
            />
            {logoPreview && (
              <div className="flex items-center justify-center w-16 h-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setLogoPreview(null)}
                />
              </div>
            )}
            {!logoPreview && (
              <div className="flex items-center justify-center w-16 h-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Image className="h-6 w-6 text-zinc-400" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Live Preview</h4>
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="h-10 w-10 object-contain"
                onError={() => setLogoPreview(null)}
              />
            ) : (
              <div
                className="h-10 w-10 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold" style={{ color: primaryColor }}>
                {companyName || 'Your Company'}
              </div>
              <div className="text-xs text-muted-foreground">Dashboard Preview</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded" style={{ backgroundColor: primaryColor }} />
            <div className="h-6 w-6 rounded" style={{ backgroundColor: secondaryColor }} />
            <span className="text-xs text-muted-foreground ml-2">Primary / Secondary</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhiteLabelCustomizer;
