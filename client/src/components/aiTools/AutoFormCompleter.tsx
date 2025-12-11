import React, { useState, useEffect, useRef } from 'react';
import { useGemini } from '../../services/geminiService';
import { CheckCircle, AlertCircle, FileText, RefreshCw, Sparkles, User, Building, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  value: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  autoCompleted?: boolean;
  icon?: React.ReactNode;
}

interface AutoFormCompleterProps {
  onSubmit?: (data: Record<string, string>) => void;
  formType?: 'contact' | 'deal' | 'lead';
}

const AutoFormCompleter: React.FC<AutoFormCompleterProps> = ({
  onSubmit,
  formType = 'lead'
}) => {
  const gemini = useGemini();
  const [fields, setFields] = useState<FormField[]>([]);
  const [partialData, setPartialData] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);
  const [completionScore, setCompletionScore] = useState(0);
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
  const [currentFieldWithSuggestion, setCurrentFieldWithSuggestion] = useState<string | null>(null);
  
  const autocompleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize form fields based on form type
  useEffect(() => {
    // Define form fields based on the form type
    if (formType === 'contact') {
      setFields([
        { id: '1', name: 'name', label: 'Full Name', type: 'text', value: '', required: true, icon: <User size={16} className="text-gray-400" /> },
        { id: '2', name: 'email', label: 'Email', type: 'email', value: '', required: true, icon: <Mail size={16} className="text-gray-400" /> },
        { id: '3', name: 'phone', label: 'Phone Number', type: 'tel', value: '', icon: <Phone size={16} className="text-gray-400" /> },
        { id: '4', name: 'company', label: 'Company', type: 'text', value: '', icon: <Building size={16} className="text-gray-400" /> },
        { id: '5', name: 'position', label: 'Position', type: 'text', value: '', placeholder: 'e.g., CTO, Marketing Director', icon: <User size={16} className="text-gray-400" /> },
        { id: '6', name: 'industry', label: 'Industry', type: 'select', value: '', options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Other'] },
        { id: '7', name: 'notes', label: 'Notes', type: 'textarea', value: '', placeholder: 'Add any additional information...' }
      ]);
    } else if (formType === 'deal') {
      setFields([
        { id: '1', name: 'title', label: 'Deal Title', type: 'text', value: '', required: true },
        { id: '2', name: 'company', label: 'Company', type: 'text', value: '', required: true },
        { id: '3', name: 'value', label: 'Deal Value ($)', type: 'text', value: '', required: true },
        { id: '4', name: 'contact', label: 'Contact Person', type: 'text', value: '' },
        { id: '5', name: 'stage', label: 'Deal Stage', type: 'select', value: '', options: ['qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] },
        { id: '6', name: 'probability', label: 'Win Probability (%)', type: 'text', value: '' },
        { id: '7', name: 'notes', label: 'Notes', type: 'textarea', value: '' }
      ]);
    } else {
      // Lead form
      setFields([
        { id: '1', name: 'name', label: 'Full Name', type: 'text', value: '', required: true, icon: <User size={16} className="text-gray-400" /> },
        { id: '2', name: 'email', label: 'Email', type: 'email', value: '', required: true, icon: <Mail size={16} className="text-gray-400" /> },
        { id: '3', name: 'phone', label: 'Phone Number', type: 'tel', value: '', icon: <Phone size={16} className="text-gray-400" /> },
        { id: '4', name: 'company', label: 'Company', type: 'text', value: '', icon: <Building size={16} className="text-gray-400" /> },
        { id: '5', name: 'source', label: 'Lead Source', type: 'select', value: '', options: ['Website', 'Referral', 'Event', 'Social Media', 'Email Campaign', 'Other'] },
        { id: '6', name: 'interest', label: 'Interest Level', type: 'select', value: '', options: ['High', 'Medium', 'Low', 'Unknown'] },
        { id: '7', name: 'notes', label: 'Notes', type: 'textarea', value: '' }
      ]);
    }
  }, [formType]);
  
  useEffect(() => {
    // Initialize formData from fields
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.name] = field.value;
    });
    setFormData(initialData);
  }, [fields]);
  
  // Update completion score when form data changes
  useEffect(() => {
    if (Object.keys(formData).length === 0) return;
    
    const requiredFields = fields.filter(field => field.required).map(field => field.name);
    const filledRequiredFields = requiredFields.filter(fieldName => formData[fieldName]?.trim());
    
    const allFields = fields.map(field => field.name);
    const filledFields = allFields.filter(fieldName => formData[fieldName]?.trim());
    
    // Calculate completion score
    const requiredScore = requiredFields.length > 0 
      ? (filledRequiredFields.length / requiredFields.length) * 0.7 
      : 0;
    
    const optionalScore = allFields.length - requiredFields.length > 0 
      ? ((filledFields.length - filledRequiredFields.length) / (allFields.length - requiredFields.length)) * 0.3 
      : 0;
    
    setCompletionScore(requiredScore + optionalScore);
  }, [formData, fields]);
  
  const handleFieldChange = (name: string, value: string) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update fields state
    setFields(prev => 
      prev.map(field => 
        field.name === name 
          ? { ...field, value, autoCompleted: false }
          : field
      )
    );
    
    // Track the current field for suggestions
    setCurrentFieldWithSuggestion(name);
    
    // Debounce autocomplete
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }
    
    if (isAutocompleteEnabled && value.trim().length > 0) {
      autocompleteTimerRef.current = setTimeout(() => {
        autocompleteForm(name, value);
      }, 500);
    }
  };
  
  // Parse partial data and try to complete the form
  const parseAndComplete = async () => {
    if (!partialData.trim()) {
      setError("Please enter some data to auto-complete the form");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Format field names for the AI to recognize
      const fieldNames = fields.map(field => field.name).join(', ');
      
      const prompt = `
        Parse the following text and extract ${formType} information for these fields: ${fieldNames}
        
        Text: "${partialData}"
        
        Format response as a strict JSON object where keys are field names and values are extracted data.
        If a field can't be extracted, leave it blank.
        
        Example format:
        {
          "name": "John Smith",
          "email": "john@example.com"
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Try to parse the JSON response
      try {
        // Find JSON part (if the AI wrapped it in markdown code blocks)
        const jsonRegex = /{[\s\S]*}/;
        const match = responseText.match(jsonRegex);
        
        if (match) {
          const extractedData = JSON.parse(match[0]);
          
          // Update form data with extracted values
          const updatedFormData = { ...formData };
          const updatedFields = [...fields];
          
          Object.entries(extractedData).forEach(([field, value]) => {
            if (value && typeof value === 'string') {
              updatedFormData[field] = value;
              
              // Mark fields as auto-completed
              const fieldIndex = updatedFields.findIndex(f => f.name === field);
              if (fieldIndex >= 0) {
                updatedFields[fieldIndex] = {
                  ...updatedFields[fieldIndex],
                  value: value as string,
                  autoCompleted: true
                };
              }
            }
          });
          
          setFormData(updatedFormData);
          setFields(updatedFields);
        } else {
          setError("Couldn't extract structured data from the input");
        }
      } catch (e) {
        console.error("Failed to parse extracted data:", e);
        setError("Failed to extract data from the input");
      }
    } catch (error) {
      console.error("Error extracting data:", error);
      setError("An error occurred while processing the input");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Auto-complete remaining fields based on partial data
  const autocompleteForm = async (changedField: string, value: string) => {
    // Don't autocomplete if there's not enough data yet
    const filledFields = Object.entries(formData).filter(([_, val]) => val.trim().length > 0);
    if (filledFields.length < 2) return;
    
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Collect the filled fields to use as context
      const filledFieldsContext = filledFields
        .map(([field, val]) => `${field}: ${val}`)
        .join('\n');
      
      // Get the remaining empty fields
      const emptyFields = fields
        .filter(field => !formData[field.name]?.trim() && field.name !== changedField)
        .map(field => field.name);
      
      if (emptyFields.length === 0) return;
      
      // Request suggestions for empty fields
      const prompt = `
        Based on the following ${formType} information:
        
        ${filledFieldsContext}
        
        Suggest values for these fields: ${emptyFields.join(', ')}
        
        Format response as strict JSON where keys are field names and values are suggested data.
        Only include fields that can be confidently inferred.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Parse and set suggestions
      try {
        // Find JSON part
        const jsonRegex = /{[\s\S]*}/;
        const match = responseText.match(jsonRegex);
        
        if (match) {
          const suggestions = JSON.parse(match[0]);
          
          // Only show suggestions if we have at least one
          if (Object.keys(suggestions).length > 0) {
            setSuggestions(suggestions);
            setShowSuggestionPopup(true);
          }
        }
      } catch (e) {
        console.error("Failed to parse suggestions:", e);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
    }
  };
  
  // Apply a suggestion to a field
  const applySuggestion = (fieldName: string, value: string) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Update fields state
    setFields(prev => 
      prev.map(field => 
        field.name === fieldName 
          ? { ...field, value, autoCompleted: true }
          : field
      )
    );
    
    // Remove the applied suggestion
    setSuggestions(prev => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
    
    // If no suggestions left, hide the popup
    if (Object.keys(suggestions).length <= 1) {
      setShowSuggestionPopup(false);
    }
  };
  
  // Dismiss all suggestions
  const dismissSuggestions = () => {
    setSuggestions({});
    setShowSuggestionPopup(false);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check required fields
    const requiredFields = fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.name]?.trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in the required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }
    
    // Clear any errors
    setError(null);
    
    // Call onSubmit with form data
    if (onSubmit) {
      onSubmit(formData);
    }
    
    // In a real app, you'd submit the form data here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText size={20} className="text-emerald-600 mr-2" />
            AI-Powered {formType === 'contact' ? 'Contact' : formType === 'deal' ? 'Deal' : 'Lead'} Form
          </h3>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAutocompleteEnabled}
                onChange={() => setIsAutocompleteEnabled(!isAutocompleteEnabled)}
                className="sr-only"
              />
              <div className={`relative h-6 w-11 ${isAutocompleteEnabled ? 'bg-emerald-500' : 'bg-gray-200'} rounded-full transition-colors`}>
                <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transform transition-transform ${isAutocompleteEnabled ? 'translate-x-5' : ''}`} />
              </div>
              <span className="ml-2 text-sm text-gray-700">
                AI Autocomplete
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Form completion progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-medium text-gray-700">Form Completion</div>
            <div className="text-sm font-medium text-gray-700">{Math.round(completionScore * 100)}%</div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                completionScore > 0.8 ? 'bg-emerald-500' :
                completionScore > 0.5 ? 'bg-blue-500' :
                completionScore > 0.2 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${completionScore * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Partial data parser for auto-completion */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Sparkles size={16} className="text-emerald-500 mr-1.5" />
              Quick Auto-Fill
            </h4>
          </div>
          
          <div className="mb-4">
            <textarea
              value={partialData}
              onChange={(e) => setPartialData(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder={`Paste text containing ${formType} information (e.g., email, notes, business card) and we'll auto-fill the form...`}
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={parseAndComplete}
              disabled={!partialData.trim() || isAnalyzing}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm ${
                !partialData.trim() || isAnalyzing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-1.5" />
                  Auto-Complete Form
                </>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className={`w-full p-2 pr-8 border rounded-md ${
                        field.autoCompleted 
                          ? 'bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500' 
                          : 'focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className={`w-full p-2 pr-8 border rounded-md ${
                        field.autoCompleted 
                          ? 'bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500' 
                          : 'focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      {field.icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {field.icon}
                        </div>
                      )}
                      <input
                        id={field.name}
                        type={field.type}
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full ${field.icon ? 'pl-10' : 'pl-3'} p-2 pr-8 border rounded-md ${
                          field.autoCompleted 
                            ? 'bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500' 
                            : 'focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  )}
                  
                  {field.autoCompleted && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Sparkles size={16} className="text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
      
      {/* Suggestion popup */}
      <AnimatePresence>
        {showSuggestionPopup && Object.keys(suggestions).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 max-w-md w-full bg-white rounded-lg shadow-xl border border-emerald-200 z-50"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-800 flex items-center">
                  <Sparkles size={18} className="text-emerald-600 mr-2" />
                  AI Suggestions
                </h4>
                <button
                  onClick={dismissSuggestions}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle size={18} />
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(suggestions).map(([fieldName, value]) => {
                  const field = fields.find(f => f.name === fieldName);
                  if (!field) return null;
                  
                  return (
                    <div key={fieldName} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{field.label}</p>
                        <p className="text-sm text-emerald-600">{value}</p>
                      </div>
                      <button
                        onClick={() => applySuggestion(fieldName, value)}
                        className="p-1.5 bg-emerald-100 rounded text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 flex justify-between">
                <button
                  onClick={dismissSuggestions}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    // Apply all suggestions
                    Object.entries(suggestions).forEach(([fieldName, value]) => {
                      applySuggestion(fieldName, value);
                    });
                    setShowSuggestionPopup(false);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Apply All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoFormCompleter;