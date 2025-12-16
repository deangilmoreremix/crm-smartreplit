
import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { Package, Plus, Minus, Check, Star, Zap, Shield, Globe, Users, Upload, Save, Eye, Edit, Trash2, UserPlus, FileText, AlertCircle, CheckCircle, Settings, Palette, Sun, Moon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PackageFeature {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'branding' | 'integration' | 'support' | 'advanced';
  basePrice: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  popular?: boolean;
}

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
}

interface PackageUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
}

const WhiteLabelPackageBuilder: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('builder');
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkUserModal, setShowBulkUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [packageUsers, setPackageUsers] = useState<PackageUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['all_access', 'user_management', 'package_config'],
      description: 'Full system access'
    },
    {
      id: 'manager',
      name: 'Package Manager', 
      permissions: ['package_config', 'user_view', 'analytics'],
      description: 'Manage package features and view analytics'
    },
    {
      id: 'user',
      name: 'Standard User',
      permissions: ['basic_access'],
      description: 'Basic package access'
    }
  ]);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportData, setBulkImportData] = useState<PackageUser[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  // Persistence for package builder state
  useEffect(() => {
    const saved = localStorage.getItem('package-builder-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedFeatures(parsed.selectedFeatures || []);
        setPackageName(parsed.packageName || '');
        setPackageDescription(parsed.packageDescription || '');
        setPackageUsers(parsed.packageUsers || []);
        setUserRoles(parsed.userRoles || userRoles);
      } catch (error) {
        console.error('Error loading package builder state:', error);
      }
    }
  }, []);

  useEffect(() => {
    const state = {
      selectedFeatures,
      packageName,
      packageDescription,
      packageUsers,
      userRoles
    };
    localStorage.setItem('package-builder-state', JSON.stringify(state));
  }, [selectedFeatures, packageName, packageDescription, packageUsers, userRoles]);

  // WhiteLabelPackageBuilder respects global theme but starts optimized for light mode UI
  // Users can toggle via the theme button if they prefer dark mode

  const features: PackageFeature[] = [
    {
      id: 'basic-branding',
      name: 'Basic Branding',
      description: 'Logo, colors, and basic customization',
      category: 'branding',
      basePrice: 99,
      icon: Package
    },
    {
      id: 'advanced-branding',
      name: 'Advanced Branding',
      description: 'Complete UI customization and white-labeling',
      category: 'branding',
      basePrice: 299,
      icon: Star
    },
    {
      id: 'custom-domain',
      name: 'Custom Domain',
      description: 'Use your own domain name',
      category: 'core',
      basePrice: 49,
      icon: Globe
    },
    {
      id: 'api-access',
      name: 'API Access',
      description: 'Full API integration capabilities',
      category: 'integration',
      basePrice: 199,
      icon: Zap
    },
    {
      id: 'priority-support',
      name: 'Priority Support',
      description: '24/7 dedicated support team',
      category: 'support',
      basePrice: 149,
      icon: Shield
    }
  ];

  const packageTemplates: PackageTemplate[] = [
    {
      id: 'starter',
      name: 'Starter Package',
      description: 'Perfect for small businesses getting started',
      basePrice: 199,
      features: ['basic-branding', 'custom-domain']
    },
    {
      id: 'professional',
      name: 'Professional Package',
      description: 'Ideal for growing businesses',
      basePrice: 499,
      features: ['advanced-branding', 'custom-domain', 'api-access'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Package',
      description: 'Complete solution for large organizations',
      basePrice: 999,
      features: ['advanced-branding', 'custom-domain', 'api-access', 'priority-support']
    }
  ];

  const calculateTotalPrice = () => {
    return selectedFeatures.reduce((total, featureId) => {
      const feature = features.find(f => f.id === featureId);
      return total + (feature?.basePrice || 0);
    }, 0);
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const applyTemplate = (template: PackageTemplate) => {
    setSelectedFeatures(template.features);
    setPackageName(template.name);
    setPackageDescription(template.description);
  };

  const addUser = (userData: typeof newUserForm) => {
  const createPackage = async () => {
    if (!packageName.trim()) {
      // Show validation error
      return;
    }
    
    setIsCreatingPackage(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would make actual API call to create package
      console.log('Package created:', {
        name: packageName,
        description: packageDescription,
        features: selectedFeatures,
        users: packageUsers,
        totalPrice: calculateTotalPrice()
      });
      
      // Show success message
    } catch (error) {
      console.error('Error creating package:', error);
      // Show error message
    } finally {
      setIsCreatingPackage(false);
    }
  };
  const parseCSV = (csvText: string): PackageUser[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');
    const roleIndex = headers.indexOf('role');
    
    if (nameIndex === -1 || emailIndex === -1) {
      throw new Error('CSV must contain name and email columns');
    }
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const name = values[nameIndex];
      const email = values[emailIndex];
      const role = values[roleIndex] || 'user';
      
      if (!name || !email) {
        throw new Error(`Row ${index + 2}: Missing name or email`);
      }
      
      return {
        id: `bulk_${Date.now()}_${index}`,
        name,
        email,
        role: ['admin', 'manager', 'user'].includes(role) ? role : 'user',
        status: 'pending' as const
      };
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setBulkImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const parsed = parseCSV(csvText);
          setBulkImportData(parsed);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          // Show error toast
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImport = async () => {
    if (bulkImportData.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      for (let i = 0; i < bulkImportData.length; i++) {
        setPackageUsers(prev => [...prev, bulkImportData[i]]);
        setImportProgress(((i + 1) / bulkImportData.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
      }
      
      setBulkImportData([]);
      setBulkImportFile(null);
      setShowBulkUserModal(false);
      // Show success toast
    } catch (error) {
      console.error('Bulk import error:', error);
      // Show error toast
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };
    const newUser: PackageUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: 'pending'
    };
    setPackageUsers([...packageUsers, newUser]);
    setNewUserForm({ name: '', email: '', role: 'user' });
    setShowUserModal(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Action Buttons */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                White-Label Package Builder
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Create custom white-label packages and manage user access
              </p>
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
              <Button
                onClick={() => setShowBulkUserModal(true)}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-bulk-users"
              >
                <Upload className="h-4 w-4" />
                Bulk Import Users
              </Button>
              <Button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2"
                data-testid="button-add-user"
              >
                <UserPlus className="h-4 w-4" />
                Add Users
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Builder
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Role Configuration
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Package Preview
            </TabsTrigger>
          </TabsList>

          {/* Package Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Package Templates */}
              <div className="lg:col-span-2 space-y-6">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Quick Start Templates
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packageTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          template.popular 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                            : `border-gray-200 dark:border-gray-700 hover:border-purple-300`
                        }`}
                        onClick={() => applyTemplate(template)}
                        data-testid={`template-${template.id}`}
                      >
                        {template.popular && (
                          <Badge className="mb-2 bg-purple-600">Popular</Badge>
                        )}
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                          {template.name}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                          {template.description}
                        </p>
                        <p className="text-lg font-bold text-purple-600">
                          ${template.basePrice}/month
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Selection */}
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Select Features
                  </h2>
                  <div className="space-y-3">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedFeatures.includes(feature.id)
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : `border-gray-200 dark:border-gray-700 hover:border-gray-300`
                        }`}
                        onClick={() => toggleFeature(feature.id)}
                        data-testid={`feature-${feature.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedFeatures.includes(feature.id) ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <feature.icon className={`h-5 w-5 ${selectedFeatures.includes(feature.id) ? 'text-purple-600' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {feature.name}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            ${feature.basePrice}/mo
                          </span>
                          <button
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedFeatures.includes(feature.id)
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {selectedFeatures.includes(feature.id) && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package Summary */}
              <div className="space-y-6">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm sticky top-4`}>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Package Summary
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Package Name
                      </Label>
                      <Input
                        value={packageName}
                        onChange={(e) => setPackageName(e.target.value)}
                        className={`w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        placeholder="Enter package name"
                        data-testid="input-package-name"
                      />
                    </div>

                    <div>
                      <Label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Description
                      </Label>
                      <Textarea
                        value={packageDescription}
                        onChange={(e) => setPackageDescription(e.target.value)}
                        className={`w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows={3}
                        placeholder="Package description"
                        data-testid="textarea-package-description"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                        Included Features:
                      </h3>
                      <ul className="space-y-2">
                        {selectedFeatures.map((featureId) => {
                          const feature = features.find(f => f.id === featureId);
                          return feature ? (
                            <li key={featureId} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-2`}>
                              <Check className="h-4 w-4 text-green-500" />
                              {feature.name}
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Total Price:
                        </span>
                        <span className="text-2xl font-bold text-purple-600">
                          ${calculateTotalPrice()}/month
                        </span>
                      </div>
                      
                      <Button onClick={createPackage} disabled={isCreatingPackage} className="w-full" data-testid="button-create-package">
                        <Save className="h-4 w-4 mr-2" />
                        Create Package
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Package Users ({packageUsers.length})
                </h2>
                <Button onClick={() => setShowUserModal(true)} data-testid="button-add-user-inline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {packageUsers.length > 0 ? packageUsers.map((user) => (
                      <tr key={user.id} data-testid={`user-row-${user.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                              <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {userRoles.find(r => r.id === user.role)?.name || user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-edit-user-${user.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-delete-user-${user.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-300">
                          No users assigned to this package. Add users to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Role Configuration Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                User Roles & Permissions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {userRoles.map((role) => (
                  <div key={role.id} className={`border-2 rounded-lg p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {role.name}
                      </h3>
                      <Button variant="outline" size="sm" data-testid={`button-edit-role-${role.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      {role.description}
                    </p>
                    <div>
                      <h4 className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Permissions:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Package Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                Package Preview
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Package Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Name:
                      </span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {packageName || 'Untitled Package'}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description:
                      </span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {packageDescription || 'No description provided'}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Monthly Price:
                      </span>
                      <span className="ml-2 text-lg font-bold text-purple-600">
                        ${calculateTotalPrice()}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Total Users:
                      </span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {packageUsers.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Feature Breakdown
                  </h3>
                  <div className="space-y-2">
                    {selectedFeatures.length > 0 ? selectedFeatures.map((featureId) => {
                      const feature = features.find(f => f.id === featureId);
                      return feature ? (
                        <div key={featureId} className="flex justify-between items-center">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature.name}
                          </span>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            ${feature.basePrice}/mo
                          </span>
                        </div>
                      ) : null;
                    }) : (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No features selected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add User Modal */}
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add User to Package
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="userName">Name *</Label>
                <Input
                  id="userName"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  placeholder="John Smith"
                  data-testid="input-user-name"
                />
              </div>
              
              <div>
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="john@company.com"
                  data-testid="input-user-email"
                />
              </div>
              
              <div>
                <Label htmlFor="userRole">Role</Label>
                <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm({...newUserForm, role: value})}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUserModal(false)} data-testid="button-cancel-user">
                Cancel
              </Button>
              <Button 
                onClick={() => addUser(newUserForm)}
                disabled={!newUserForm.name || !newUserForm.email}
                data-testid="button-save-user"
              >
                <Save className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Users Modal */}
        <Dialog open={showBulkUserModal} onOpenChange={setShowBulkUserModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import Users
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload a CSV file with user information
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="bulk-import-file"
                />
                <label htmlFor="bulk-import-file">
                  <Button variant="outline" data-testid="button-choose-user-file">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </label>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      CSV Format Requirements
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-200 mb-3">
                      Your CSV file should include these columns:
                    </p>
                    <ul className="text-xs text-purple-600 dark:text-purple-300 space-y-1">
                      <li>• name (required)</li>
                      <li>• email (required)</li>
                      <li>• role (admin, manager, user)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" data-testid="button-download-user-template">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowBulkUserModal(false)} data-testid="button-cancel-bulk-import">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport} disabled={bulkImportData.length === 0 || isImporting} data-testid="button-import-users">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Import Users
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WhiteLabelPackageBuilder;
