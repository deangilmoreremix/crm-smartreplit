import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Globe, Users, Settings } from 'lucide-react';

interface TenantManagementProps {
  onTenantSelect?: (tenantId: string) => void;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ onTenantSelect }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (tenantData) => {
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantData),
      });
      if (response.ok) {
        await loadTenants();
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const handleUpdateTenant = async (tenantId, updates) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await loadTenants();
        setEditingTenant(null);
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadTenants();
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage multi-tenant configurations and domains
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tenant.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Globe className="w-3 h-3 mr-1" />
                    {tenant.domain}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingTenant(tenant)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTenant(tenant.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Created: {new Date(tenant.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Updated: {new Date(tenant.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => onTenantSelect?.(tenant.id)}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Settings className="w-3 h-3 inline mr-1" />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tenants configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by creating your first tenant
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Tenant
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal would go here */}
      {showCreateForm && (
        <TenantForm onSubmit={handleCreateTenant} onCancel={() => setShowCreateForm(false)} />
      )}

      {editingTenant && (
        <TenantForm
          tenant={editingTenant}
          onSubmit={(updates) => handleUpdateTenant(editingTenant.id, updates)}
          onCancel={() => setEditingTenant(null)}
        />
      )}
    </div>
  );
};

interface TenantFormProps {
  tenant?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TenantForm: React.FC<TenantFormProps> = ({ tenant, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    domain: tenant?.domain || '',
    config: tenant?.config || {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {tenant ? 'Edit Tenant' : 'Create New Tenant'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {tenant ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantManagement;
