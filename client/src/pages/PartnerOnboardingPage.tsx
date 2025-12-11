import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../contexts/ThemeContext';
import { Building2, Users, Palette, Globe, Mail, Phone, FileText, Star, Sun, Moon } from 'lucide-react';

// Simple navigation function
const navigate = (path: string) => {
  window.location.href = path;
};

const partnerOnboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactEmail: z.string().email('Invalid email address'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  expectedCustomers: z.number().min(1, 'Must expect at least 1 customer'),
  businessType: z.string().min(1, 'Business type is required'),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters'),
  customDomain: z.string().optional(),
  primaryColor: z.string().min(4, 'Valid color code required'),
  secondaryColor: z.string().min(4, 'Valid color code required'),
  logo: z.string().optional(),
});

type PartnerOnboardingForm = z.infer<typeof partnerOnboardingSchema>;

export default function PartnerOnboardingPage() {
  const { isDark, toggleTheme } = useTheme(); // Use global theme context
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerOnboardingForm>({
    resolver: zodResolver(partnerOnboardingSchema),
    defaultValues: {
      companyName: '',
      contactEmail: '',
      contactName: '',
      phone: '',
      website: '',
      expectedCustomers: 10,
      businessType: '',
      subdomain: '',
      customDomain: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      logo: '',
    },
  });

  const onSubmit = async (data: PartnerOnboardingForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/partners/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          brandingConfig: {
            logo: data.logo,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
          },
        }),
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        navigate('/partner/pending');
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      alert('Failed to submit application. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const businessTypes = [
    'Marketing Agency',
    'Development Agency',
    'Consulting Firm',
    'SaaS Company',
    'System Integrator',
    'Reseller',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              White-Label Partner Program
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Join our partner program and offer Smart CRM to your customers with your own branding
            </p>
          </div>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`h-1 w-24 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Company Info</span>
            <span>Business Details</span>
            <span>Branding</span>
            <span>Review</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Company Information */}
            {step === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Company Information</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Tell us about your company and primary contact
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="block text-sm font-medium">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      {...form.register('companyName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Company LLC"
                    />
                    {form.formState.errors.companyName && (
                      <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contactName" className="block text-sm font-medium">
                      Primary Contact *
                    </label>
                    <input
                      id="contactName"
                      {...form.register('contactName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Smith"
                    />
                    {form.formState.errors.contactName && (
                      <p className="text-sm text-red-600">{form.formState.errors.contactName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contactEmail" className="block text-sm font-medium">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="contactEmail"
                        {...form.register('contactEmail')}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@company.com"
                      />
                    </div>
                    {form.formState.errors.contactEmail && (
                      <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="phone"
                        {...form.register('phone')}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="website" className="block text-sm font-medium">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="website"
                        {...form.register('website')}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://www.yourcompany.com"
                      />
                    </div>
                    {form.formState.errors.website && (
                      <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Business Details</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Help us understand your business and customer expectations
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="businessType" className="block text-sm font-medium">
                      Business Type *
                    </label>
                    <select
                      {...form.register('businessType')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.businessType && (
                      <p className="text-sm text-red-600">{form.formState.errors.businessType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="expectedCustomers" className="block text-sm font-medium">
                      Expected Customers *
                    </label>
                    <input
                      id="expectedCustomers"
                      type="number"
                      {...form.register('expectedCustomers', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                      min="1"
                    />
                    {form.formState.errors.expectedCustomers && (
                      <p className="text-sm text-red-600">{form.formState.errors.expectedCustomers.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subdomain" className="block text-sm font-medium">
                      Preferred Subdomain *
                    </label>
                    <div className="flex">
                      <input
                        id="subdomain"
                        {...form.register('subdomain')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="yourcompany"
                      />
                      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 border border-l-0 rounded-r-md text-sm text-gray-600 dark:text-gray-300">
                        .smartcrm.com
                      </div>
                    </div>
                    {form.formState.errors.subdomain && (
                      <p className="text-sm text-red-600">{form.formState.errors.subdomain.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="customDomain" className="block text-sm font-medium">
                      Custom Domain (Optional)
                    </label>
                    <input
                      id="customDomain"
                      {...form.register('customDomain')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="crm.yourcompany.com"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Partner Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      'White-label branding',
                      'Revenue sharing',
                      'Dedicated support',
                      'Training materials',
                      'Marketing resources',
                      'API access',
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Branding */}
            {step === 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Branding Configuration</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Customize the look and feel for your customers
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="primaryColor" className="block text-sm font-medium">
                      Primary Color *
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="primaryColor"
                        type="color"
                        {...form.register('primaryColor')}
                        className="w-20 h-10 border border-gray-300 rounded"
                      />
                      <input
                        {...form.register('primaryColor')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="secondaryColor" className="block text-sm font-medium">
                      Secondary Color *
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="secondaryColor"
                        type="color"
                        {...form.register('secondaryColor')}
                        className="w-20 h-10 border border-gray-300 rounded"
                      />
                      <input
                        {...form.register('secondaryColor')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="logo" className="block text-sm font-medium">
                      Logo URL (Optional)
                    </label>
                    <input
                      id="logo"
                      {...form.register('logo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourcompany.com/logo.png"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Branding Preview</h3>
                  <div 
                    className="p-6 rounded-lg border"
                    style={{ 
                      backgroundColor: form.watch('primaryColor') + '10',
                      borderColor: form.watch('primaryColor')
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {form.watch('logo') && (
                        <img src={form.watch('logo')} alt="Logo" className="h-8 w-auto" />
                      )}
                      <h4 
                        className="text-xl font-bold" 
                        style={{ color: form.watch('primaryColor') }}
                      >
                        {form.watch('companyName') || 'Your Company'} CRM
                      </h4>
                    </div>
                    <button 
                      type="button"
                      style={{ 
                        backgroundColor: form.watch('primaryColor'),
                        borderColor: form.watch('secondaryColor')
                      }}
                      className="px-4 py-2 text-white rounded font-medium"
                    >
                      Sample Button
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Review Application</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Please review your information before submitting
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Company Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Company:</span> {form.watch('companyName')}</p>
                      <p><span className="font-medium">Contact:</span> {form.watch('contactName')}</p>
                      <p><span className="font-medium">Email:</span> {form.watch('contactEmail')}</p>
                      <p><span className="font-medium">Phone:</span> {form.watch('phone') || 'Not provided'}</p>
                      <p><span className="font-medium">Website:</span> {form.watch('website') || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Business Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Business Type:</span> {form.watch('businessType')}</p>
                      <p><span className="font-medium">Expected Customers:</span> {form.watch('expectedCustomers')}</p>
                      <p><span className="font-medium">Subdomain:</span> {form.watch('subdomain')}.smartcrm.com</p>
                      <p><span className="font-medium">Custom Domain:</span> {form.watch('customDomain') || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-3">Branding</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: form.watch('primaryColor') }}
                      />
                      <span className="text-sm">Primary: {form.watch('primaryColor')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: form.watch('secondaryColor') }}
                      />
                      <span className="text-sm">Secondary: {form.watch('secondaryColor')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-6">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Next Steps</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Your application will be reviewed within 2-3 business days</li>
                    <li>• You'll receive an email notification once approved</li>
                    <li>• Our team will reach out to schedule an onboarding call</li>
                    <li>• You'll gain access to the partner dashboard and training materials</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {step < 4 ? (
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}