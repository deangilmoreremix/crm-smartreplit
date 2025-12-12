import React, { useState, useEffect } from 'react';
import { useGemini } from '../../services/geminiService';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  value: string;
  required: boolean;
  validation?: {
    valid: boolean;
    message: string;
  };
}

interface RealTimeFormValidationProps {
  onValidationComplete?: (isValid: boolean) => void;
  formContext?: string;
}

const RealTimeFormValidation: React.FC<RealTimeFormValidationProps> = ({ 
  onValidationComplete,
  formContext = 'sales inquiry' 
}) => {
  const gemini = useGemini();
  const [fields, setFields] = useState<FormField[]>([
    { name: 'name', label: 'Full Name', type: 'text', value: '', required: true },
    { name: 'email', label: 'Email Address', type: 'email', value: '', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel', value: '', required: false },
    { name: 'company', label: 'Company Name', type: 'text', value: '', required: true },
    { name: 'message', label: 'Message', type: 'textarea', value: '', required: true }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [debounceTimers, setDebounceTimers] = useState<{[key: string]: NodeJS.Timeout}>({});
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: string}>({});
  
  const validateField = async (field: FormField) => {
    // Skip validation for empty non-required fields
    if (!field.value && !field.required) return field;
    
    // Clear any existing timer for this field
    if (debounceTimers[field.name]) {
      clearTimeout(debounceTimers[field.name]);
    }
    
    // Set a new debounce timer
    const timer = setTimeout(async () => {
      if (!field.value && field.required) {
        // Simple required validation
        return {
          ...field,
          validation: {
            valid: false,
            message: `${field.label} is required`
          }
        };
      }
      
      if (field.type === 'email' && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
          return {
            ...field,
            validation: {
              valid: false,
              message: 'Please enter a valid email address'
            }
          };
        }
      }
      
      if (field.value.length > 0) {
        setValidating(true);
        try {
          const result = await gemini.validateFormField(field.label, field.value, formContext);
          
          // If valid but can be improved, add an AI suggestion
          if (result.valid && (result.message.includes("suggest") || result.message.includes("improve") || result.message.includes("consider"))) {
            setAiSuggestions(prev => ({...prev, [field.name]: result.message}));
          } else if (result.valid) {
            // Clear any previous suggestion
            setAiSuggestions(prev => {
              const newSuggestions = {...prev};
              delete newSuggestions[field.name];
              return newSuggestions;
            });
          }
          
          return {
            ...field,
            validation: {
              valid: result.valid,
              message: result.message
            }
          };
        } catch (e) {
          console.error("Error validating with Gemini", e);
          return field;
        } finally {
          setValidating(false);
        }
      }
      
      return field;
    }, 400); // Debounce time of 400ms
    
    setDebounceTimers(prev => ({...prev, [field.name]: timer}));
    
    return field;
  };
  
  const handleInputChange = async (name: string, value: string) => {
    setFields(prevFields => {
      return prevFields.map(field => {
        if (field.name === name) {
          const updatedField = { ...field, value };
          validateField(updatedField).then(validatedField => {
            setFields(prevFields => 
              prevFields.map(f => f.name === name ? validatedField : f)
            );
          });
          return updatedField;
        }
        return field;
      });
    });
  };
  
  const validateAllFields = async () => {
    setValidating(true);
    const validatedFields = await Promise.all(fields.map(validateField));
    setFields(validatedFields);
    setValidating(false);
    
    // Check if the form is valid
    const isValid = validatedFields.every(field => 
      (!field.required || field.value.trim().length > 0) && 
      (!field.validation || field.validation.valid)
    );
    
    if (onValidationComplete) {
      onValidationComplete(isValid);
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isValid = await validateAllFields();
    
    if (!isValid) {
      const errors = fields
        .filter(field => field.validation && !field.validation.valid)
        .map(field => field.validation?.message || `${field.label} is invalid`);
      
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }
    
    setFormErrors([]);
    
    // In a real app, submit the form data to your backend
    await new Promise(resolve => // TODO: Replace with real AI implementation);
    
    // Reset form after successful submission
    setFields(fields.map(field => ({ ...field, value: '', validation: undefined })));
    setIsSubmitting(false);
    alert('Form submitted successfully!');
  };

  // Create a status indicator for the field
  const FieldStatusIndicator = ({ field }: { field: FormField }) => {
    if (validating && field.value) {
      return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
    } else if (field.validation && !field.validation.valid) {
      return <XCircle size={16} className="text-red-500" />;
    } else if (field.validation && field.validation.valid) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    return null;
  };

  const isFormValid = fields.every(field => 
    !field.required || (field.value && (!field.validation || field.validation.valid))
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Form with Real-time Validation</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {formErrors.length > 0 && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} />
              <span className="font-medium">Please correct the following errors:</span>
            </div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {fields.map((field) => (
          <div key={field.name}>
            <div className="flex justify-between">
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <FieldStatusIndicator field={field} />
            </div>
            
            <div className="mt-1 relative">
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={field.value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  rows={4}
                  className={`w-full p-2 border rounded-md ${
                    field.validation ? (
                      field.validation.valid ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    ) : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={field.value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  className={`w-full p-2 border rounded-md ${
                    field.validation ? (
                      field.validation.valid ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    ) : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              )}
            </div>
            
            {field.validation && !field.validation.valid && (
              <p className="mt-1 text-sm text-red-600">{field.validation.message}</p>
            )}
            
            {aiSuggestions[field.name] && (
              <p className="mt-1 text-sm text-blue-600">
                <span className="font-medium">Suggestion:</span> {aiSuggestions[field.name]}
              </p>
            )}
          </div>
        ))}
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || validating}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isSubmitting || validating || !isFormValid
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : validating ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealTimeFormValidation;