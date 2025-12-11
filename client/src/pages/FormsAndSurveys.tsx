import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  BarChart3, 
  Eye, 
  Copy, 
  Settings, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  ChevronDown, 
  X, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Users, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight
} from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  submissions: number;
  totalViews: number;
  conversionRate: number;
  createdAt: Date;
  lastUpdated: Date;
}

const FormsAndSurveys: React.FC = () => {
  const [forms, setForms] = useState<Record<string, FormTemplate>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'submissions' | 'lastUpdated'>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Form editor state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
  
  // Mock data initialization
  useEffect(() => {
    const mockForms: Record<string, FormTemplate> = {
      '1': {
        id: '1',
        name: 'Lead Capture Form',
        description: 'Capture leads from website visitors',
        fields: [
          { id: '1', type: 'text', label: 'Full Name', required: true },
          { id: '2', type: 'email', label: 'Email Address', required: true },
          { id: '3', type: 'tel', label: 'Phone Number', required: false },
        ],
        isActive: true,
        submissions: 142,
        totalViews: 1250,
        conversionRate: 11.4,
        createdAt: new Date(2024, 0, 15),
        lastUpdated: new Date(2024, 1, 10)
      },
      '2': {
        id: '2',
        name: 'Product Interest Survey',
        description: 'Gauge customer interest in new products',
        fields: [
          { id: '1', type: 'text', label: 'Name', required: true },
          { id: '2', type: 'email', label: 'Email', required: true },
          { id: '3', type: 'select', label: 'Product Interest', required: true, options: ['Product A', 'Product B', 'Product C'] },
        ],
        isActive: false,
        submissions: 67,
        totalViews: 890,
        conversionRate: 7.5,
        createdAt: new Date(2024, 0, 20),
        lastUpdated: new Date(2024, 1, 5)
      }
    };
    setForms(mockForms);
  }, []);
  
  // Reset form editor when selected form changes
  useEffect(() => {
    if (selectedForm) {
      setFormName(selectedForm.name);
      setFormDescription(selectedForm.description);
      setFormFields([...selectedForm.fields]);
    } else {
      setFormName('');
      setFormDescription('');
      setFormFields([
        { id: `field-${Date.now()}-1`, type: 'text', label: 'Full Name', required: true },
        { id: `field-${Date.now()}-2`, type: 'email', label: 'Email Address', required: true }
      ]);
    }
  }, [selectedForm]);
  
  // Filter and sort forms
  const filteredForms = Object.values(forms)
    .filter(form => 
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'submissions') {
        return sortOrder === 'asc' 
          ? a.submissions - b.submissions 
          : b.submissions - a.submissions;
      } else {
        return sortOrder === 'asc' 
          ? a.lastUpdated.getTime() - b.lastUpdated.getTime() 
          : b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }
    });
  
  // Add a new field to the form
  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}-${formFields.length + 1}`,
      type: newFieldType,
      label: `New ${newFieldType.charAt(0).toUpperCase() + newFieldType.slice(1)} Field`,
      required: false
    };
    
    if (newFieldType === 'select' || newFieldType === 'checkbox' || newFieldType === 'radio') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }
    
    setFormFields([...formFields, newField]);
  };
  
  // Remove a field from the form
  const removeField = (id: string) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };
  
  // Update a field property
  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };
  
  // Save form
  const saveForm = async () => {
    if (!formName) return;
    
    setIsLoading(true);
    
    try {
      if (selectedForm) {
        // Update existing form
        const updatedForm = {
          ...selectedForm,
          name: formName,
          description: formDescription,
          fields: formFields,
          lastUpdated: new Date()
        };
        setForms(prev => ({ ...prev, [selectedForm.id]: updatedForm }));
      } else {
        // Create new form
        const newForm: FormTemplate = {
          id: Date.now().toString(),
          name: formName,
          description: formDescription,
          fields: formFields,
          isActive: true,
          submissions: 0,
          totalViews: 0,
          conversionRate: 0,
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        setForms(prev => ({ ...prev, [newForm.id]: newForm }));
      }
      
      // Reset and close form editor
      setShowCreateForm(false);
      setShowEditForm(false);
      setSelectedForm(null);
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete form
  const confirmDeleteForm = async () => {
    if (!selectedForm) return;
    
    setIsLoading(true);
    
    try {
      const { [selectedForm.id]: removed, ...remainingForms } = forms;
      setForms(remainingForms);
      setShowDeleteConfirm(false);
      setSelectedForm(null);
    } catch (error) {
      console.error('Error deleting form:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy form URL to clipboard
  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/forms/public/${formId}`;
    navigator.clipboard.writeText(url);
    
    // Show a toast or notification here
    alert('Form URL copied to clipboard');
  };
  
  // Toggle form active status
  const handleToggleActive = async (formId: string, isActive: boolean) => {
    setIsLoading(true);
    
    try {
      const form = forms[formId];
      if (form) {
        const updatedForm = { ...form, isActive: !isActive };
        setForms(prev => ({ ...prev, [formId]: updatedForm }));
      }
    } catch (error) {
      console.error('Error toggling form status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms & Surveys</h1>
          <p className="text-gray-600 mt-1">Create and manage forms to collect information from your leads and customers</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => {
              setSelectedForm(null);
              setShowCreateForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Create Form
          </button>
        </div>
      </header>
      
      {/* Forms List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input 
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button 
                  className="flex items-center px-3 py-2 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter size={16} className="mr-1" />
                  Sort by
                  <ChevronDown size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Loading forms...</p>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No forms match your search criteria' : 'Create your first form to get started'}
            </p>
            <button
              onClick={() => {
                setSelectedForm(null);
                setShowCreateForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={18} className="mr-1" />
              Create Form
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredForms.map(form => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          <FileText size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{form.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{form.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{form.submissions}</div>
                      <div className="text-xs text-gray-500">{form.totalViews} views</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{form.conversionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.lastUpdated.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(form.id, form.isActive)}
                        className="flex items-center"
                      >
                        {form.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-green-600" />
                            <span className="ml-1 text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                            <span className="ml-1 text-sm text-gray-500">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => copyFormUrl(form.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy form URL"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForm(form);
                            setShowEditForm(true);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit form"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForm(form);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete form"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {showEditForm ? 'Edit Form' : 'Create New Form'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setShowEditForm(false);
                  setSelectedForm(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="formName" className="block text-sm font-medium text-gray-700 mb-1">
                    Form Name
                  </label>
                  <input
                    type="text"
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter form name"
                  />
                </div>
                
                <div>
                  <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="formDescription"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter form description"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Form Fields</h3>
                    <div className="flex items-center space-x-2">
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as FormField['type'])}
                        className="px-3 py-1 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                      </select>
                      <button
                        onClick={addField}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Field
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {formFields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Label
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                                className="w-full px-2 py-1 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="textarea">Textarea</option>
                                <option value="select">Select</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="radio">Radio</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                              </select>
                            </div>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                <span className="ml-2 text-xs text-gray-700">Required</span>
                              </label>
                            </div>
                          </div>
                          <button
                            onClick={() => removeField(field.id)}
                            className="ml-4 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setShowEditForm(false);
                  setSelectedForm(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveForm}
                disabled={!formName || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (showEditForm ? 'Update Form' : 'Create Form')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium">Delete Form</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedForm.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedForm(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteForm}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete Form'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsAndSurveys;