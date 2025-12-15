import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { Plus, Edit, Trash2, Users, Settings, Save } from 'lucide-react';

interface UserTemplate {
  id: number;
  name: string;
  config: {
    role: string;
    productTier: string;
    permissions?: string[];
  };
  createdBy: string;
  createdAt: string;
}

export default function UserTemplateSystem() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'regular_user',
    productTier: 'smartcrm',
    permissions: [] as string[]
  });
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/user-templates', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/user-templates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          config: {
            role: formData.role,
            productTier: formData.productTier,
            permissions: formData.permissions
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(prev => [...prev, data.template]);
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: 'Success',
          description: 'User template created successfully'
        });
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      // Mock delete (in production, you'd have a DELETE endpoint)
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const applyTemplate = (template: UserTemplate) => {
    // This would be used by the UserManagement component
    // For now, just show a toast
    toast({
      title: 'Template Applied',
      description: `Applied template: ${template.name}`
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'regular_user',
      productTier: 'smartcrm',
      permissions: []
    });
  };

  const startEdit = (template: UserTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      role: template.config.role,
      productTier: template.config.productTier,
      permissions: template.config.permissions || []
    });
  };

  const availablePermissions = [
    'users.create', 'users.edit', 'users.delete',
    'contacts.create', 'contacts.edit', 'contacts.delete',
    'deals.create', 'deals.edit', 'deals.delete',
    'tasks.create', 'tasks.edit', 'tasks.delete',
    'analytics.view', 'billing.view', 'settings.edit',
    'ai_tools.use', 'integrations.manage', 'reports.export'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Template System
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create User Template</DialogTitle>
                  <DialogDescription>
                    Define a reusable template for user creation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      placeholder="e.g., Sales Representative"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular_user">Regular User</SelectItem>
                          <SelectItem value="wl_user">WL User</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="template-tier">Product Tier</Label>
                      <Select value={formData.productTier} onValueChange={(value) => setFormData(prev => ({ ...prev, productTier: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smartcrm">SmartCRM</SelectItem>
                          <SelectItem value="sales_maximizer">Sales Maximizer</SelectItem>
                          <SelectItem value="ai_boost_unlimited">AI Boost Unlimited</SelectItem>
                          <SelectItem value="ai_communication">AI Communication</SelectItem>
                          <SelectItem value="smartcrm_bundle">SmartCRM Bundle</SelectItem>
                          <SelectItem value="whitelabel">Whitelabel</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Create and manage reusable user templates for quick account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates created yet. Create your first template to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                          title="Apply this template"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(template)}
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Badge variant="outline">{template.config.role.replace('_', ' ')}</Badge>
                      <Badge variant="secondary">{template.config.productTier.replace('_', ' ')}</Badge>
                    </div>

                    {template.config.permissions && template.config.permissions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Permissions:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.config.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {template.config.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.config.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Template</DialogTitle>
            <DialogDescription>
              Update template configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-template-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_user">Regular User</SelectItem>
                    <SelectItem value="wl_user">WL User</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-template-tier">Product Tier</Label>
                <Select value={formData.productTier} onValueChange={(value) => setFormData(prev => ({ ...prev, productTier: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smartcrm">SmartCRM</SelectItem>
                    <SelectItem value="sales_maximizer">Sales Maximizer</SelectItem>
                    <SelectItem value="ai_boost_unlimited">AI Boost Unlimited</SelectItem>
                    <SelectItem value="ai_communication">AI Communication</SelectItem>
                    <SelectItem value="smartcrm_bundle">SmartCRM Bundle</SelectItem>
                    <SelectItem value="whitelabel">Whitelabel</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Mock update
              if (editingTemplate) {
                setTemplates(prev => prev.map(t =>
                  t.id === editingTemplate.id
                    ? { ...t, name: formData.name, config: { role: formData.role, productTier: formData.productTier, permissions: formData.permissions } }
                    : t
                ));
                setEditingTemplate(null);
                resetForm();
                toast({
                  title: 'Success',
                  description: 'Template updated successfully'
                });
              }
            }}>
              <Save className="h-4 w-4 mr-2" />
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}