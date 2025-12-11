import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Shield, Mail, Calendar, Search, Filter, UserCheck, UserX, Settings, Lock, Send, Key } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useRole } from '../components/RoleBasedAccess';
import { RoleMigrationPanel } from '../components/RoleMigrationPanel';
import { useToast } from '../hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'wl_user' | 'regular_user';
  productTier?: 'super_admin' | 'whitelabel' | 'smartcrm' | 'sales_maximizer' | 'ai_boost_unlimited' | 'ai_communication' | 'smartcrm_bundle';
  tenantId: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  createdAt: string;
  permissions: string[];
  invitedBy?: string;
  twoFactorEnabled: boolean;
}

interface InviteUserData {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  permissions: string[];
}

export default function UserManagement() {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuthStore();
  const { canAccess, isSuperAdmin } = useRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteData, setInviteData] = useState<InviteUserData>({
    email: '',
    role: 'regular_user',
    firstName: '',
    lastName: '',
    permissions: [],
  });
  const [showMigrationPanel, setShowMigrationPanel] = useState(false);
  const [tierDropdownStates, setTierDropdownStates] = useState<{ [key: string]: string }>({});
  const [sendingPasswordEmail, setSendingPasswordEmail] = useState<string | null>(null);

  // Check if user has admin access - only super admins can manage users
  const isAdmin = isSuperAdmin() || (currentUser?.email === 'dev@smartcrm.local');

  // Auto-fetch users when page loads
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch users:', response.status, errorText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteUser = async () => {
    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });

      if (response.ok) {
        alert('User invitation sent successfully!');
        setShowInviteModal(false);
        setInviteData({ email: '', role: 'regular_user', firstName: '', lastName: '', permissions: [] });
        fetchUsers();
      } else {
        alert('Failed to send invitation');
      }
    } catch (error) {
      alert('Error sending invitation');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        alert('User role updated successfully!');
        fetchUsers();
      }
    } catch (error) {
      alert('Failed to update user role');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('User status updated successfully!');
        fetchUsers();
      }
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const updateUserProductTier = async (userId: string, newTier: string) => {
    try {
      console.log(`🔄 Updating product tier: userId=${userId}, newTier=${newTier}`);
      
      // Update local state immediately for optimistic UI
      setTierDropdownStates(prev => ({ ...prev, [userId]: newTier }));
      
      const response = await fetch(`/api/users/${userId}/product-tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productTier: newTier }),
        credentials: 'include'
      });

      console.log(`📡 Response status: ${response.status}`);
      const data = await response.json();
      console.log(`📦 Response data:`, data);

      if (response.ok) {
        console.log(`✅ Product tier updated successfully!`);
        alert('User product tier updated successfully!');
        // Re-fetch to confirm changes from server
        setTimeout(() => fetchUsers(), 500);
      } else {
        console.error(`❌ Failed to update product tier:`, data);
        alert(`Failed to update user product tier: ${data.error || 'Unknown error'}`);
        // Revert optimistic update on error
        setTierDropdownStates(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error) {
      console.error(`❌ Exception updating product tier:`, error);
      alert(`Error updating product tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert optimistic update on error
      setTierDropdownStates(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('User deleted successfully!');
          fetchUsers();
        }
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const sendPasswordSetupEmail = async (email: string, firstName?: string) => {
    try {
      setSendingPasswordEmail(email);
      
      const response = await fetch('/api/admin/send-password-setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Email Sent',
          description: `Password setup email sent to ${email}`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send password setup email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send password setup email',
        variant: 'destructive',
      });
    } finally {
      setSendingPasswordEmail(null);
    }
  };

  const sendBulkPasswordSetupEmails = async () => {
    const emailsToSend = filteredUsers.map(u => u.email).filter(Boolean);
    if (emailsToSend.length === 0) {
      toast({
        title: 'No Users',
        description: 'No users selected to send emails',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Send password setup emails to ${emailsToSend.length} users?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/send-bulk-password-setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToSend }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Emails Sent',
          description: `Sent: ${data.sent}, Failed: ${data.failed}`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send password setup emails',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send password setup emails',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const email = user.email?.toLowerCase() || '';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = email.includes(searchLower) || fullName.includes(searchLower);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const availableRoles = [
    { value: 'regular_user', label: 'Regular User', description: 'Core CRM features only' },
    { value: 'wl_user', label: 'WL User', description: 'Full CRM + AI tools' },
    { value: 'super_admin', label: 'Super Admin', description: 'Full platform access' },
  ];

  const availablePermissions = [
    'users.create', 'users.edit', 'users.delete',
    'contacts.create', 'contacts.edit', 'contacts.delete',
    'deals.create', 'deals.edit', 'deals.delete',
    'tasks.create', 'tasks.edit', 'tasks.delete',
    'analytics.view', 'billing.view', 'settings.edit',
    'ai_tools.use', 'integrations.manage', 'reports.export'
  ];

  if (!isAdmin) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Access Denied</h1>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  User Management
                </h1>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Manage users and their permissions
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendBulkPasswordSetupEmails}
                className={`px-4 py-2 ${isDark ? 'bg-purple-700 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors flex items-center gap-2`}
                data-testid="button-bulk-password-setup"
                title="Send password setup emails to all visible users"
              >
                <Key className="h-4 w-4" />
                Send Password Emails
              </button>
              <button
                onClick={() => setShowMigrationPanel(!showMigrationPanel)}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-current rounded-lg transition-colors flex items-center gap-2`}
                data-testid="button-toggle-migration"
              >
                <Settings className="h-4 w-4" />
                Role Migration
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                data-testid="button-invite-user"
              >
                <Plus className="h-4 w-4" />
                Invite User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Migration Panel */}
        {showMigrationPanel && (
          <div className="mb-8">
            <RoleMigrationPanel onComplete={() => {
              fetchUsers();
              setShowMigrationPanel(false);
            }} />
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="wl_user">WL User</option>
            <option value="regular_user">Regular User</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Users Table */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    User
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Role
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Product Tier
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Last Active
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'wl_user' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'regular_user' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={tierDropdownStates[user.id] || user.productTier || 'smartcrm'}
                        onChange={(e) => updateUserProductTier(user.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                          user.productTier === 'super_admin' ? 'bg-red-50 text-red-800 border-red-200' :
                          user.productTier === 'whitelabel' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          user.productTier === 'smartcrm_bundle' ? 'bg-green-50 text-green-800 border-green-200' :
                          user.productTier === 'ai_communication' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                          user.productTier === 'ai_boost_unlimited' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          user.productTier === 'sales_maximizer' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        data-testid={`select-product-tier-${user.id}`}
                      >
                        <option value="smartcrm">SmartCRM</option>
                        <option value="sales_maximizer">Sales Maximizer</option>
                        <option value="ai_boost_unlimited">AI Boost Unlimited</option>
                        <option value="ai_communication">AI Communication</option>
                        <option value="smartcrm_bundle">SmartCRM Bundle</option>
                        <option value="whitelabel">Whitelabel</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.lastActive).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => sendPasswordSetupEmail(user.email, user.firstName)}
                          disabled={sendingPasswordEmail === user.email}
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-1 disabled:opacity-50"
                          data-testid={`button-send-password-${user.id}`}
                          title="Send password setup email"
                        >
                          <Key className="h-4 w-4" />
                          {sendingPasswordEmail === user.email ? 'Sending...' : 'Password'}
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        
                        {user.status === 'active' ? (
                          <button
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                          >
                            <UserX className="h-4 w-4" />
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <UserCheck className="h-4 w-4" />
                            Activate
                          </button>
                        )}

                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Users', value: users.length, color: 'blue' },
            { label: 'Active Users', value: users.filter(u => u.status === 'active').length, color: 'green' },
            { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: 'red' },
            { label: 'Admins', value: users.filter(u => u.role.includes('admin')).length, color: 'purple' },
          ].map((stat) => (
            <div key={stat.label} className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</h3>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Invite New User
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Role *
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData({...inviteData, firstName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData({...inviteData, lastName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className={`px-4 py-2 border rounded-md hover:bg-gray-50 ${
                  isDark ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-600 border-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={inviteUser}
                disabled={!inviteData.email || !inviteData.role}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Edit User: {editingUser.email}
            </h3>
            <div className="overflow-y-auto flex-1 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Role
                </label>
                <select
                  defaultValue={editingUser.role}
                  onChange={(e) => updateUserRole(editingUser.id, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  data-testid="select-user-role"
                >
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Status
                </label>
                <select
                  defaultValue={editingUser.status}
                  onChange={(e) => updateUserStatus(editingUser.id, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  data-testid="select-user-status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Product Tier
                </label>
                <select
                  defaultValue={editingUser.productTier || 'smartcrm'}
                  onChange={(e) => updateUserProductTier(editingUser.id, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  data-testid="select-product-tier"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="whitelabel">Whitelabel</option>
                  <option value="smartcrm_bundle">SmartCRM Bundle</option>
                  <option value="smartcrm">SmartCRM</option>
                  <option value="sales_maximizer">Sales Maximizer</option>
                  <option value="ai_boost_unlimited">AI Boost Unlimited</option>
                  <option value="ai_communication">AI Communication</option>
                </select>
              </div>
            </div>

            {/* Feature Management Coming Soon */}
            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4 mb-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Lock className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h4 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Feature Access Control
                </h4>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Individual feature management coming soon. Features are automatically inherited based on the user's product tier.
              </p>
            </div>

            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setEditingUser(null)}
                className={`px-4 py-2 border rounded-md hover:bg-gray-50 ${
                  isDark ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-600 border-gray-300'
                }`}
                data-testid="button-close-edit-user"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
