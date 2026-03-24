import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from '../components/GlassCard';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Camera,
  X,
  Plus,
  Building,
  Home,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
  fieldType: 'text' | 'number' | 'date' | 'url';
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  website?: string;
  confirmPassword?: string;
}

interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  appContext: string;
  bio?: string;
  company?: string;
  position?: string;
  location?: string;
  website?: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  address?: Address;
  customFields?: CustomField[];
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    role: 'regular_user',
    appContext: 'smartcrm',
    bio: '',
    company: '',
    position: '',
    location: '',
    website: '',
    timezone: 'America/New_York',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    customFields: [],
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newCustomField, setNewCustomField] = useState<CustomField>({
    id: '',
    label: '',
    value: '',
    fieldType: 'text',
  });
  const [showAddField, setShowAddField] = useState(false);

  // Calculate profile completeness
  const profileCompleteness = useMemo(() => {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.phone,
      profile.avatar,
      profile.bio,
      profile.company,
      profile.position,
      profile.location,
      profile.website,
      profile.address?.street,
      profile.address?.city,
      profile.address?.state,
      profile.address?.zipCode,
      profile.address?.country,
    ];
    
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    const totalFields = fields.length;
    
    const customFieldsFilled = profile.customFields?.filter(f => f.value && f.value.trim() !== '').length || 0;
    const totalCustomFields = profile.customFields?.length || 0;
    
    return Math.round(((filledFields + customFieldsFilled) / (totalFields + (totalCustomFields || 1))) * 100) || 0;
  }, [profile]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!profile.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!profile.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (profile.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(profile.phone)) {
      errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    if (profile.website && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(profile.website)) {
      errors.website = 'Please enter a valid website URL';
      isValid = false;
    }

    if (security.newPassword !== security.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Get profile from your profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Get user metadata from Supabase auth
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      // Combine profile and auth data
      setProfile({
        id: user?.id || '',
        username: profileData?.username || authUser?.email?.split('@')[0] || '',
        firstName: profileData?.firstName || authUser?.user_metadata?.first_name || '',
        lastName: profileData?.lastName || authUser?.user_metadata?.last_name || '',
        email: authUser?.email || '',
        phone: authUser?.phone || authUser?.user_metadata?.phone || '',
        avatar: profileData?.avatar || authUser?.user_metadata?.avatar_url || '',
        role: profileData?.role || 'regular_user',
        appContext: profileData?.appContext || 'smartcrm',
        bio: profileData?.bio || '',
        company: profileData?.company || '',
        position: profileData?.position || '',
        location: profileData?.location || '',
        website: profileData?.website || '',
        timezone: profileData?.timezone || 'America/New_York',
        language: profileData?.language || 'en',
        emailNotifications: profileData?.emailNotifications ?? true,
        pushNotifications: profileData?.pushNotifications ?? true,
        marketingEmails: profileData?.marketingEmails ?? false,
        twoFactorEnabled: authUser?.factors?.length > 0 || false,
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    // Validate form before saving
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before saving',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);

      // Update profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: profile.id,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        bio: profile.bio,
        company: profile.company,
        position: profile.position,
        location: profile.location,
        website: profile.website,
        timezone: profile.timezone,
        language: profile.language,
        emailNotifications: profile.emailNotifications,
        pushNotifications: profile.pushNotifications,
        marketingEmails: profile.marketingEmails,
        updatedAt: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Update Supabase auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          avatar_url: profile.avatar,
          company: profile.company,
          position: profile.position,
        },
      });

      if (authError) throw authError;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    try {
      if (security.newPassword !== security.confirmPassword) {
        toast({
          title: 'Error',
          description: 'New passwords do not match',
          variant: 'destructive',
        });
        return;
      }

      if (security.newPassword.length < 8) {
        toast({
          title: 'Error',
          description: 'Password must be at least 8 characters long',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: security.newPassword,
      });

      if (error) throw error;

      setSecurity({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 2MB',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with new avatar URL
      setProfile((prev) => ({ ...prev, avatar: publicUrl }));

      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const enableTwoFactor = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      // Show QR code or setup instructions
      toast({
        title: 'Two-Factor Authentication',
        description: 'Scan the QR code with your authenticator app',
      });

      // You would typically show a modal with the QR code here
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable two-factor authentication',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
      }

      setLoading(true);

      // Delete user profile and related data
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', profile.id);

      if (profileError) throw profileError;

      // Sign out user
      await supabase.auth.signOut();

      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your profile and account preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              profile.role === 'super_admin'
                ? 'bg-purple-100 text-purple-800'
                : profile.role === 'wl_user'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {profile.role.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Profile Completeness Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Profile Completeness</span>
            <span className={`text-sm font-bold ${profileCompleteness >= 80 ? 'text-green-600' : profileCompleteness >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {profileCompleteness}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${profileCompleteness >= 80 ? 'bg-green-600' : profileCompleteness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${profileCompleteness}%` }}
            ></div>
          </div>
          {profileCompleteness < 100 && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              Complete your profile by adding more information to get the most out of SmartCRM
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs value="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 cursor-pointer hover:bg-blue-700"
                  >
                    <Camera className="h-3 w-3 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Profile Picture</h3>
                  <p className="text-sm text-gray-500">Upload a new avatar (max 2MB)</p>
                  {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => {
                      setProfile((prev) => ({ ...prev, firstName: e.target.value }));
                      if (validationErrors.firstName) {
                        setValidationErrors((prev) => ({ ...prev, firstName: undefined }));
                      }
                    }}
                    placeholder="John"
                    className={validationErrors.firstName ? 'border-red-500' : ''}
                  />
                  {validationErrors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => {
                      setProfile((prev) => ({ ...prev, lastName: e.target.value }));
                      if (validationErrors.lastName) {
                        setValidationErrors((prev) => ({ ...prev, lastName: undefined }));
                      }
                    }}
                    placeholder="Doe"
                    className={validationErrors.lastName ? 'border-red-500' : ''}
                  />
                  {validationErrors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed here. Use security settings.
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => {
                      setProfile((prev) => ({ ...prev, phone: e.target.value }));
                      if (validationErrors.phone) {
                        setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    placeholder="+1 (555) 123-4567"
                    className={validationErrors.phone ? 'border-red-500' : ''}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="New York, NY"
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => setProfile((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder="Sales Manager"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => {
                      setProfile((prev) => ({ ...prev, website: e.target.value }));
                      if (validationErrors.website) {
                        setValidationErrors((prev) => ({ ...prev, website: undefined }));
                      }
                    }}
                    placeholder="https://example.com"
                    className={validationErrors.website ? 'border-red-500' : ''}
                  />
                  {validationErrors.website && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.website}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              {/* Address Section */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={profile.address?.street || ''}
                      onChange={(e) => setProfile((prev) => ({ ...prev, address: { ...prev.address!, street: e.target.value } }))}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.address?.city || ''}
                      onChange={(e) => setProfile((prev) => ({ ...prev, address: { ...prev.address!, city: e.target.value } }))}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={profile.address?.state || ''}
                      onChange={(e) => setProfile((prev) => ({ ...prev, address: { ...prev.address!, state: e.target.value } }))}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={profile.address?.zipCode || ''}
                      onChange={(e) => setProfile((prev) => ({ ...prev, address: { ...prev.address!, zipCode: e.target.value } }))}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.address?.country || ''}
                      onChange={(e) => setProfile((prev) => ({ ...prev, address: { ...prev.address!, country: e.target.value } }))}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Custom Fields
                </h3>
                
                {profile.customFields && profile.customFields.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {profile.customFields.map((field, index) => (
                      <div key={field.id || index} className="flex items-start gap-2">
                        <div className="flex-1">
                          <Label>{field.label}</Label>
                          {(field.fieldType === 'text' || field.fieldType === 'url') ? (
                            <Textarea
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...(profile.customFields || [])];
                                newFields[index] = { ...field, value: e.target.value };
                                setProfile((prev) => ({ ...prev, customFields: newFields }));
                              }}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              rows={2}
                            />
                          ) : (
                            <Input
                              type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : field.fieldType === 'url' ? 'url' : 'text'}
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...(profile.customFields || [])];
                                newFields[index] = { ...field, value: e.target.value };
                                setProfile((prev) => ({ ...prev, customFields: newFields }));
                              }}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-6 text-red-500 hover:text-red-700"
                          onClick={() => {
                            const newFields = (profile.customFields || []).filter((_, i) => i !== index);
                            setProfile((prev) => ({ ...prev, customFields: newFields }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No custom fields added yet</p>
                )}
                
                {/* Add New Custom Field */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Add Custom Field</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Field Label</Label>
                      <Input
                        value={newCustomField.label}
                        onChange={(e) => setNewCustomField((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., LinkedIn URL"
                      />
                    </div>
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={newCustomField.fieldType}
                        onValueChange={(value) => setNewCustomField((prev) => ({ ...prev, fieldType: value as 'text' | 'number' | 'date' | 'url' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (newCustomField.label.trim()) {
                            setProfile((prev) => ({
                              ...prev,
                              customFields: [...(prev.customFields || []), { ...newCustomField, id: Date.now().toString() }],
                            }));
                            setNewCustomField({ id: '', label: '', value: '', fieldType: 'text' });
                          }
                        }}
                        disabled={!newCustomField.label.trim()}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={updateProfile} disabled={loading} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Security
              </CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="font-medium">Change Password</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={security.currentPassword}
                      onChange={(e) =>
                        setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                      }
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={security.newPassword}
                      onChange={(e) =>
                        setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={security.confirmPassword}
                      onChange={(e) =>
                        setSecurity((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                      }
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button onClick={updatePassword} disabled={loading || !security.newPassword}>
                  Update Password
                </Button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {profile.twoFactorEnabled ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <Button onClick={enableTwoFactor} variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-600">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={profile.emailNotifications}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={profile.pushNotifications}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                  </div>
                  <Switch
                    checked={profile.marketingEmails}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({ ...prev, marketingEmails: checked }))
                    }
                  />
                </div>
              </div>
              <Button onClick={updateProfile} disabled={loading}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Preferences
              </CardTitle>
              <CardDescription>Set your language and timezone preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={updateProfile} disabled={loading}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action is irreversible and all your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="confirmDelete">Type <span className="font-bold">DELETE</span> to confirm</Label>
            <Input
              id="confirmDelete"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmText('');
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmText === 'DELETE') {
                  deleteAccount();
                  setShowDeleteDialog(false);
                } else {
                  toast({
                    title: 'Error',
                    description: 'Please type DELETE to confirm account deletion',
                    variant: 'destructive',
                  });
                }
              }}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
