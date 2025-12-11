import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFormStore, FormTemplate, FormField } from '../store/formStore';
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
import FormSubmissionsView from '../components/marketing/FormSubmissionsView';

const FormsAndSurveys: React.FC = () => {
  const { forms, fetchForms, createForm, updateForm, deleteForm, getPublicFormUrl, toggleFormActive } = useFormStore();
  
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
  
  // Load forms on component mount
  useEffect(() => {
    setIsLoading(true);
    fetchForms().finally(() => setIsLoading(false));
  }, [fetchForms]);
  
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
  
  // Add an option to a field
  const addOption = (fieldId: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options) {
        return {
          ...field,
          options: [...field.options, `Option ${field.options.length + 1}`]
        };
      }
      return field;
    }));
  };
  
  // Remove an option from a field
  const removeOption = (fieldId: string, optionIndex: number) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options) {
        return {
          ...field,
          options: field.options.filter((_, index) => index !== optionIndex)
        };
      }
      return field;
    }));
  };
  
  // Update an option
  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options) {
        const newOptions = [...field.options];
        newOptions[optionIndex] = value;
        return {
          ...field,
          options: newOptions
        };
      }
      return field;
    }));
  };
  
  // Save form
  const saveForm = async () => {
    if (!formName) return;
    
    setIsLoading(true);
    
    try {
      if (selectedForm) {
        // Update existing form
        await updateForm(selectedForm.id, {
          name: formName,
          description: formDescription,
          fields: formFields
        });
      } else {
        // Create new form
        await createForm({
          name: formName,
          description: formDescription,
          fields: formFields
        });
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
      await deleteForm(selectedForm.id);
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
    const url = getPublicFormUrl(formId);
    navigator.clipboard.writeText(url);
    
    // Show a toast or notification here
    alert('Form URL copied to clipboard');
  };
  
  // Toggle form active status
  const handleToggleActive = async (formId: string, isActive: boolean) => {
    setIsLoading(true);
    
    try {
      await toggleFormActive(formId, !isActive);
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
                {/* Dropdown menu would go here */}
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
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${form.conversionRate}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.lastUpdated.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(form.id, form.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          form.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {form.isActive ? (
                          <>
                            <CheckCircle size={12} className="mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <X size={12} className="mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedForm(form);
                            setShowSubmissions(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Submissions"
                        >
                          <BarChart3 size={18} />
                        </button>
                        <button
                          onClick={() => copyFormUrl(form.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Copy Form URL"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForm(form);
                            setShowEditForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Form"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForm(form);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Form"
                        >
                          <Trash2 size={18} />
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
      
      {/* Form Performance Overview */}
      {filteredForms.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Form Performance Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-700">Total Submissions</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {Object.values(forms).reduce((sum, form) => sum + form.submissions, 0)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <FileText size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-700">Avg. Conversion Rate</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Object.values(forms).length > 0 
                      ? (Object.values(forms).reduce((sum, form) => sum + (form.conversionRate || 0), 0) / Object.values(forms).length).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                  <BarChart3 size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-purple-700">Total Views</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Object.values(forms).reduce((sum, form) => sum + (form.totalViews || 0), 0)}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                  <Eye size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-amber-700">Active Forms</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {Object.values(forms).filter(form => form.isActive).length}
                  </p>
                </div>
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                  <CheckCircle size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Editor Modal */}
      {(showCreateForm || showEditForm) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-gray-900">
                  {showEditForm ? 'Edit Form' : 'Create New Form'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowEditForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
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
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter form description"
                  ></textarea>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Form Fields</h3>
                    <div className="flex items-center space-x-2">
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as FormField['type'])}
                        className="p-1 text-sm border rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkboxes</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="textarea">Text Area</option>
                      </select>
                      <button
                        onClick={addField}
                        className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                    {formFields.map((field, index) => (
                      <div key={field.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {field.type} Field
                            </span>
                          </div>
                          <button
                            onClick={() => removeField(field.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Field Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="w-full p-2 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'textarea') && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Placeholder (Optional)
                              </label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                className="w-full p-2 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}
                          
                          {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-medium text-gray-500">
                                  Options
                                </label>
                                <button
                                  onClick={() => addOption(field.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Add Option
                                </button>
                              </div>
                              <div className="space-y-2">
                                {field.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center">
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                      className="flex-1 p-1.5 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => removeOption(field.id, optionIndex)}
                                      className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`required-${field.id}`}
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`required-${field.id}`} className="ml-2 block text-xs text-gray-700">
                              Required field
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {formFields.length === 0 && (
                      <div className="text-center p-4 border border-dashed border-gray-300 rounded-md">
                        <p className="text-gray-500">No fields added yet. Add your first field to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowEditForm(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveForm}
                  disabled={!formName || formFields.length === 0 || isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Form
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4 text-red-600">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Form
              </h3>
              
              <p className="text-sm text-gray-500 text-center mb-4">
                Are you sure you want to delete "{selectedForm.name}"? This action cannot be undone and all form submissions will be permanently deleted.
              </p>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteForm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  {isLoading ? 'Deleting...' : 'Delete Form'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Submissions Modal */}
      {showSubmissions && selectedForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-gray-900">
                  Form Submissions: {selectedForm.name}
                </h2>
                <button
                  onClick={() => setShowSubmissions(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <FormSubmissionsView formId={selectedForm.id} />
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSubmissions(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-4">Form Best Practices</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Keep forms short and focused on essential information</p>
            </div>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Use clear, concise labels for form fields</p>
            </div>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Make only the most essential fields required</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Use dropdown menus for fields with predefined options</p>
            </div>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Include a clear call-to-action on your form</p>
            </div>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Test your form on different devices before sharing</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Send a confirmation email after form submission</p>
            </div>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">Regularly review and analyze form submissions</p>
            </div>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700">A/B test different form layouts to optimize conversion</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link to="/faq" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
            Learn more about form best practices
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FormsAndSurveys;