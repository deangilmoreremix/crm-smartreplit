import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Users, Settings, Palette, Mail, UserPlus, Crown, Building2, Globe, Phone, Link } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const CompanyAdminDashboard: React.FC = () => {
  const { currentCompany, companyUsers, inviteUser, updateCompany, updateWhitelabelConfig } = useCompany();
  const { config: whitelabelConfig, updateConfig } = useWhitelabel();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  if (!currentCompany) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Company Selected</h1>
          <p className="text-gray-600">Please select or create a company to manage.</p>
        </div>
      </div>
    );
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    setIsInviting(true);
    try {
      await inviteUser(inviteEmail, inviteRole);
      setInviteEmail('');
      toast({
        title: 'Success',
        description: 'Invitation sent successfully!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateCompany = async (updates: any) => {
    try {
      await updateCompany(updates);
      toast({
        title: 'Success',
        description: 'Company updated successfully!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update company',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateWhitelabel = async (updates: any) => {
    try {
      await updateWhitelabelConfig(updates);
      toast({
        title: 'Success',
        description: 'Branding updated successfully!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update branding',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {currentCompany.logo_url && (
              <img
                src={currentCompany.logo_url}
                alt={`${currentCompany.name} logo`}
                className="h-12 w-12 object-contain rounded-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentCompany.name}</h1>
              <p className="text-gray-600 mt-1">Company Administration Dashboard</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{companyUsers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Subscription</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{currentCompany.subscription_tier}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Domain</p>
                  <p className="text-lg font-bold text-gray-900">{currentCompany.domain || 'Not set'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Support Email</p>
                  <p className="text-lg font-bold text-gray-900">{currentCompany.support_email || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Team Members</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="whitelabel">White Label</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Members ({companyUsers.length}/{currentCompany.max_users})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Invite User Form */}
                <div className="flex gap-4 p-4 border rounded-lg bg-blue-50">
                  <Input
                    placeholder="user@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                    type="email"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button 
                    onClick={handleInviteUser} 
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? 'Sending...' : 'Invite'}
                    <UserPlus className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  {companyUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {user.profiles?.avatar_url ? (
                          <img
                            src={user.profiles.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {user.profiles?.first_name} {user.profiles?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                          {user.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Company Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <Input
                    value={whitelabelConfig.companyName}
                    onChange={(e) => updateConfig({ companyName: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Logo URL</label>
                  <Input
                    value={whitelabelConfig.logoUrl || ''}
                    onChange={(e) => updateConfig({ logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Color</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={whitelabelConfig.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                        className="w-12 h-10"
                      />
                      <Input
                        value={whitelabelConfig.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary Color</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={whitelabelConfig.secondaryColor}
                        onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                        className="w-12 h-10"
                      />
                      <Input
                        value={whitelabelConfig.secondaryColor}
                        onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Company Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Description</label>
                  <Input
                    value={currentCompany.description || ''}
                    onChange={(e) => handleUpdateCompany({ description: e.target.value })}
                    placeholder="Brief description of your company"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Input
                    value={currentCompany.industry || ''}
                    onChange={(e) => handleUpdateCompany({ industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <Input
                    value={currentCompany.website || ''}
                    onChange={(e) => handleUpdateCompany({ website: e.target.value })}
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Support Email</label>
                    <Input
                      type="email"
                      value={currentCompany.support_email || ''}
                      onChange={(e) => handleUpdateCompany({ support_email: e.target.value })}
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Support Phone</label>
                    <Input
                      value={currentCompany.support_phone || ''}
                      onChange={(e) => handleUpdateCompany({ support_phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whitelabel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Advanced White Label Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Title</label>
                  <Input
                    value={whitelabelConfig.heroTitle}
                    onChange={(e) => updateConfig({ heroTitle: e.target.value })}
                    placeholder="Welcome to our platform"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
                  <Input
                    value={whitelabelConfig.heroSubtitle}
                    onChange={(e) => updateConfig({ heroSubtitle: e.target.value })}
                    placeholder="Transform your business with our powerful tools"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Custom CSS</label>
                  <textarea
                    value={whitelabelConfig.customCss || ''}
                    onChange={(e) => updateConfig({ customCss: e.target.value })}
                    placeholder="/* Custom CSS styles */"
                    className="w-full px-3 py-2 border rounded h-32"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;
