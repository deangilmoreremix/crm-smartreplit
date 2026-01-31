import React, { useState, useEffect, useCallback } from 'react';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { WhitelabelButton, WhitelabelConfig } from '../types/whitelabel';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/button';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ColorInput } from '../components/ui/ColorInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  RotateCcw,
  Download,
  Upload,
  Check,
  Plus,
  Trash2,
  Palette,
  Type,
  Link,
  Eye,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Tablet,
  Building2,
  FileText,
  ImageIcon
} from 'lucide-react';

const WhiteLabelCustomization: React.FC = () => {
  const { config, updateConfig, resetToDefault, exportConfig, importConfig } = useWhitelabel();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Preview state for live preview functionality
  const [previewConfig, setPreviewConfig] = useState<WhitelabelConfig>(config);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('branding');

  // Update preview config when main config changes
  useEffect(() => {
    setPreviewConfig(config);
  }, [config]);

  // Preview update functions
  const updatePreviewConfig = useCallback((updates: Partial<WhitelabelConfig>) => {
    setPreviewConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const applyPreviewChanges = useCallback(() => {
    updateConfig(previewConfig);
    toast({
      title: "Preview Applied",
      description: "Branding changes have been applied successfully"
    });
  }, [previewConfig, updateConfig, toast]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');

  const handleButtonUpdate = useCallback((index: number, updates: Partial<WhitelabelButton>) => {
    const newButtons = [...config.ctaButtons];
    newButtons[index] = { ...newButtons[index], ...updates };
    updateConfig({ ctaButtons: newButtons });
  }, [config.ctaButtons, updateConfig]);

  const addButton = useCallback(() => {
    const newButton: WhitelabelButton = {
      id: `button_${Date.now()}`,
      text: 'New Button',
      url: '/dashboard',
      color: '#3B82F6',
      variant: 'primary',
      enabled: true
    };
    updateConfig({ ctaButtons: [...config.ctaButtons, newButton] });
  }, [config.ctaButtons, updateConfig]);

  const removeButton = useCallback((index: number) => {
    const newButtons = config.ctaButtons.filter((_, i) => i !== index);
    updateConfig({ ctaButtons: newButtons });
  }, [config.ctaButtons, updateConfig]);

  const handleExport = async () => {
    const configString = exportConfig();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(configString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Export Successful",
          description: "Configuration copied to clipboard"
        });
      } catch (error) {
        const textArea = document.createElement("textarea");
        textArea.value = configString;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Export Successful",
          description: "Configuration copied to clipboard"
        });
      }
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = configString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Export Successful",
        description: "Configuration copied to clipboard"
      });
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast({
        title: "Import Error",
        description: "Please enter configuration data to import",
        variant: "destructive"
      });
      return;
    }

    try {
      importConfig(importText);
      setImportText('');
      toast({
        title: "Import Successful",
        description: "Configuration imported successfully"
      });
    } catch (error) {
      console.error('Failed to import config:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid configuration format",
        variant: "destructive"
      });
    }
  };

  // Preview component
  const BrandingPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Preview</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`p-2 rounded ${previewDevice === 'tablet' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
            >
              <Tablet size={16} />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
            >
              <Smartphone size={16} />
            </button>
          </div>
          <Button onClick={applyPreviewChanges} size="sm">
            <Check className="h-4 w-4 mr-2" />
            Apply Changes
          </Button>
        </div>
      </div>

      <div className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div
          className={`bg-white transition-all duration-300 ${
            previewDevice === 'mobile' ? 'w-80 mx-auto' :
            previewDevice === 'tablet' ? 'w-96 mx-auto' : 'w-full'
          }`}
          style={{
            transform: previewDevice === 'mobile' ? 'scale(0.8)' : previewDevice === 'tablet' ? 'scale(0.9)' : 'scale(1)',
            transformOrigin: 'top center'
          }}
        >
          {/* Preview Header */}
          <div
            className="h-16 flex items-center justify-between px-6 shadow-sm"
            style={{
              background: `linear-gradient(to right, ${previewConfig.primaryColor}, ${previewConfig.secondaryColor})`
            }}
          >
            <div className="flex items-center space-x-3">
              {previewConfig.logoUrl && (
                <img
                  src={previewConfig.logoUrl}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="text-white font-bold text-lg">
                {previewConfig.companyName || 'SmartCRM'}
              </span>
            </div>
            <div className="flex space-x-4">
              <span className="text-white/80">Features</span>
              <span className="text-white/80">Pricing</span>
              <span className="text-white/80">Contact</span>
            </div>
          </div>

          {/* Preview Hero */}
          <div className="px-6 py-12 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Transform Your Sales Process with AI
            </h1>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {previewConfig.companyName || 'SmartCRM'} combines powerful sales tools with advanced AI capabilities to streamline your workflow and boost your results.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                className="px-6 py-3 text-white rounded-lg font-medium"
                style={{
                  background: `linear-gradient(to right, ${previewConfig.primaryColor}, ${previewConfig.secondaryColor})`
                }}
              >
                Start Your Free Trial
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-8 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        {/* Dashboard Header - Matching Dashboard Design */}
        <DashboardHeader
          title="White Label Customization"
          subtitle="Customize your application's branding and appearance with live preview"
        />

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button variant="outline" onClick={toggleTheme} className="flex items-center">
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleExport} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Tabs for Organization */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6 mt-6">
                <GlassCard>
                  <CardHeader>
                    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Palette className="h-5 w-5 mr-2 text-blue-500" />
                      Color Scheme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ColorInput
                        id="primaryColor"
                        value={previewConfig.primaryColor}
                        onChange={(value) => updatePreviewConfig({ primaryColor: value })}
                        label="Primary Color"
                        placeholder="#3B82F6"
                        ariaDescribedBy="primaryColorHelp"
                      />
                      <ColorInput
                        id="secondaryColor"
                        value={previewConfig.secondaryColor}
                        onChange={(value) => updatePreviewConfig({ secondaryColor: value })}
                        label="Secondary Color"
                        placeholder="#1E40AF"
                        ariaDescribedBy="secondaryColorHelp"
                      />
                    </div>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardHeader>
                    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <ImageIcon className="h-5 w-5 mr-2 text-purple-500" />
                      Visual Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={previewConfig.logoUrl || ''}
                        onChange={(e) => updatePreviewConfig({ logoUrl: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value && !validateUrl(e.target.value)) {
                            toast({
                              title: "Invalid URL",
                              description: "Please enter a valid URL",
                              variant: "destructive"
                            });
                          }
                        }}
                        placeholder="https://your-logo.png"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="faviconUrl">Favicon URL</Label>
                      <Input
                        id="faviconUrl"
                        value={previewConfig.faviconUrl || ''}
                        onChange={(e) => updatePreviewConfig({ faviconUrl: e.target.value })}
                        placeholder="https://your-favicon.ico"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </GlassCard>
              </TabsContent>

              {/* Company Tab */}
              <TabsContent value="company" className="space-y-6 mt-6">
                <GlassCard>
                  <CardHeader>
                    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Building2 className="h-5 w-5 mr-2 text-green-500" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={previewConfig.companyName}
                        onChange={(e) => updatePreviewConfig({ companyName: e.target.value })}
                        placeholder="Your Company Name"
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supportEmail">Support Email</Label>
                        <Input
                          id="supportEmail"
                          type="email"
                          value={previewConfig.supportEmail || ''}
                          onChange={(e) => updatePreviewConfig({ supportEmail: e.target.value })}
                          placeholder="support@company.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportPhone">Support Phone</Label>
                        <Input
                          id="supportPhone"
                          value={previewConfig.supportPhone || ''}
                          onChange={(e) => updatePreviewConfig({ supportPhone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </GlassCard>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6 mt-6">
                <GlassCard>
                  <CardHeader>
                    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Type className="h-5 w-5 mr-2 text-orange-500" />
                      Content Customization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={previewConfig.metaTitle || ''}
                        onChange={(e) => updatePreviewConfig({ metaTitle: e.target.value })}
                        placeholder="SmartCRM - AI-Powered Sales Platform"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={previewConfig.metaDescription || ''}
                        onChange={(e) => updatePreviewConfig({ metaDescription: e.target.value })}
                        placeholder="Transform your sales process with AI-powered CRM"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardHeader>
                    <CardTitle className={`flex items-center justify-between ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <Link className="h-5 w-5 mr-2 text-indigo-500" />
                        CTA Buttons
                      </div>
                      <Button onClick={addButton} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Button
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.ctaButtons.map((button, index) => (
                      <div key={button.id} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <Input
                          value={button.text}
                          onChange={(e) => handleButtonUpdate(index, { text: e.target.value })}
                          placeholder="Button text"
                          className="flex-1"
                        />
                        <Input
                          value={button.url}
                          onChange={(e) => handleButtonUpdate(index, { url: e.target.value })}
                          placeholder="URL"
                          className="flex-1"
                        />
                        <ColorInput
                          id={`button-color-${button.id}`}
                          value={button.color || '#3B82F6'}
                          onChange={(value) => handleButtonUpdate(index, { color: value })}
                          label=""
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeButton(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </GlassCard>
              </TabsContent>

              {/* Import Tab */}
              <TabsContent value="import" className="space-y-6 mt-6">
                <GlassCard>
                  <CardHeader>
                    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Upload className="h-5 w-5 mr-2 text-teal-500" />
                      Import Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste your configuration JSON here..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleImport} className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Configuration
                    </Button>
                  </CardContent>
                </GlassCard>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-6">
              <GlassCard className="h-full">
                <CardContent className="p-6">
                  <BrandingPreview />
                </CardContent>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelCustomization;
