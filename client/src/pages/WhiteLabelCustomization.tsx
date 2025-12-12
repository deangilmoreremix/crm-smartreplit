import React, { useState, useEffect, useCallback } from 'react';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { WhitelabelButton } from '../types/whitelabel';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { ColorInput } from '../components/ui/ColorInput';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  Plus,
  Trash2,
  Palette,
  Type,
  Link,
  Eye,
  Settings,
  Sparkles,
  Wand2,
  Globe,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';

const WhiteLabelCustomization: React.FC = () => {
  const { config, updateConfig, resetToDefault, exportConfig, importConfig } = useWhitelabel();
  const { isDark, toggleTheme } = useTheme(); // Use global theme context
const { toast } = useToast();
  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');

  const handleButtonUpdate = useCallback((index: number, updates: Partial<WhitelabelButton>) => {
    const newButtons = [...config.ctaButtons];
    newButtons[index] = { ...newButtons[index], ...updates };
    updateConfig({ ctaButtons: newButtons });
  };

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
  };

  const removeButton = useCallback((index: number) => {
    const newButtons = config.ctaButtons.filter((_, i) => i !== index);
    updateConfig({ ctaButtons: newButtons });
  };

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
        // Fallback to document.execCommand
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
          description: "Configuration copied to clipboard (fallback method)"
        });
      }
    } else {
      // Fallback for older browsers
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
        description: "Configuration copied to clipboard (legacy method)"
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-6 space-y-8 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>White Label Customization</h1>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Customize your application's branding and appearance</p>
          </div>
          <div className="flex gap-3">
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
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Settings */}
        <Card className={`transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Globe className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={config.companyName}
                onChange={(e) => updateConfig({ companyName: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={config.logoUrl}
                onChange={(e) => updateConfig({ logoUrl: e.target.value })}
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
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                value={config.supportEmail}
                onChange={(e) => updateConfig({ supportEmail: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value && !validateEmail(e.target.value)) {
                    toast({
                      title: "Invalid Email",
                      description: "Please enter a valid email address",
                      variant: "destructive"
                    });
                  }
                }}
                placeholder="support@yourcompany.com"
              />
            </div>
            <div>
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                value={config.supportPhone}
                onChange={(e) => updateConfig({ supportPhone: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value && !validatePhone(e.target.value)) {
                    toast({
                      title: "Invalid Phone Number",
                      description: "Please enter a valid phone number",
                      variant: "destructive"
                    });
                  }
                }}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card className={`transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Palette className="h-5 w-5 mr-2" />
              Color Scheme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              id="primaryColor"
              value={config.primaryColor}
              onChange={(value) => updateConfig({ primaryColor: value })}
              label="Primary Color"
              placeholder="#3B82F6"
              ariaDescribedBy="primaryColorHelp"
            />
            <ColorInput
              id="secondaryColor"
              value={config.secondaryColor}
              onChange={(value) => updateConfig({ secondaryColor: value })}
              label="Secondary Color"
              placeholder="#1E40AF"
              ariaDescribedBy="secondaryColorHelp"
            />
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <Card className={`lg:col-span-2 transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center justify-between ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Call-to-Action Buttons
              </div>
              <Button onClick={addButton} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {config.ctaButtons.map((button, index) => (
                <div key={button.id} className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors duration-300 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={button.text}
                        onChange={(e) => handleButtonUpdate(index, { text: e.target.value })}
                        placeholder="Button Text"
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={button.url}
                        onChange={(e) => handleButtonUpdate(index, { url: e.target.value })}
                        placeholder="/dashboard"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={button.color}
                          onChange={(e) => handleButtonUpdate(index, { color: e.target.value })}
                          className="w-12 h-10 p-1"
                          aria-label="Button color picker"
                        />
                        <Input
                          value={button.color}
                          onChange={(e) => handleButtonUpdate(index, { color: e.target.value })}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeButton(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {config.ctaButtons.length === 0 && (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No buttons configured. Add your first button to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Import/Export */}
        <Card className={`lg:col-span-2 transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Settings className="h-5 w-5 mr-2" />
              Import/Export Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="configImport">Import Configuration</Label>
              <div className="flex space-x-2">
                <Textarea
                  id="configImport"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your configuration JSON here..."
                  rows={3}
                  className="flex-1"
                />
                <Button onClick={handleImport} disabled={!importText.trim()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
            <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Export current configuration</span>
                <Button onClick={handleExport} variant="outline">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Config
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default WhiteLabelCustomization;