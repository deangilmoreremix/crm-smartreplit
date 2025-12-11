import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Upload, Users, Mail, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface BulkUser {
  email: string;
  first_name: string;
  last_name: string;
  app_context?: string;
  phone?: string;
  company?: string;
  role?: string;
  product_tier?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  imported_users: string[];
}

export default function BulkImportPage() {
  const [csvContent, setCsvContent] = useState('');
  const [parsedUsers, setParsedUsers] = useState<BulkUser[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'import' | 'complete'>('upload');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Admin emails list - must match server admin list
  const adminEmails = [
    'dean@videoremix.io',
    'dean@smartcrm.vip', // Production super admin
    'samuel@videoremix.io',
    'victor@videoremix.io',
    'dev@smartcrm.local' // Dev bypass user
  ];

  useEffect(() => {
    // Check if user is admin
    const checkAdminAccess = () => {
      if (!user?.email) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access this page",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      const userEmail = user.email.toLowerCase();
      const isAdmin = adminEmails.includes(userEmail) || user.role === 'admin' || user.role === 'super_admin';

      if (!isAdmin) {
        toast({
          title: "Admin Access Required",
          description: "This page is restricted to system administrators only",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsAuthorized(true);
    };

    checkAdminAccess();
  }, [user, navigate, toast]);

  // Show loading while checking authorization
  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Verifying Admin Access...</h2>
            <p className="text-gray-500">Please wait while we verify your permissions.</p>
          </div>
        </div>
      </div>
    );
  }

  const sampleCsv = `email,first_name,last_name,company,phone,role,product_tier
john.doe@company.com,John,Doe,Acme Corp,(555) 123-4567,regular_user,smartcrm
jane.smith@business.com,Jane,Smith,Tech Solutions,(555) 987-6543,wl_user,smartcrm_bundle`;

  const handleParseCSV = async () => {
    if (!csvContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste your CSV data first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bulk-import/parse-csv', {
        method: 'POST',
        credentials: 'include',  // Include session cookies for authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_content: csvContent })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse CSV');
      }

      setParsedUsers(data.users);
      setStep('preview');
      toast({
        title: "Success",
        description: `Parsed ${data.users.length} users from CSV`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!parsedUsers.length) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/bulk-import/users', {
        method: 'POST',
        credentials: 'include',  // Include session cookies for authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users: parsedUsers,
          send_notifications: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import users');
      }

      setImportResult(data.result);
      setStep('complete');
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.result.success} users`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setCsvContent('');
    setParsedUsers([]);
    setImportResult(null);
    setStep('upload');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin: Bulk User Import</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">ADMIN ONLY</span>
              <span className="text-gray-500 text-sm">Logged in as: {user?.email}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-600">Import users for SmartCRM. All users get access to the complete suite of apps and features.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Upload CSV', 'Preview Users', 'Import Users', 'Complete'].map((stepName, index) => {
            const isActive = ['upload', 'preview', 'import', 'complete'][index] === step;
            const isCompleted = ['upload', 'preview', 'import', 'complete'].indexOf(step) > index;
            
            return (
              <div key={stepName} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                  {stepName}
                </span>
                {index < 3 && <div className="w-12 h-0.5 bg-gray-300 mx-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV Data
            </CardTitle>
            <CardDescription>
              Paste your CSV data below. Required columns: email, first_name, last_name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <strong className="text-blue-800">CSV Format Example:</strong>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border">
                    {sampleCsv}
                  </pre>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV Data
              </label>
              <Textarea
                placeholder="Paste your CSV data here..."
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="min-h-40"
              />
            </div>

            <Button 
              onClick={handleParseCSV}
              disabled={isLoading || !csvContent.trim()}
              className="w-full"
            >
              {isLoading ? 'Parsing...' : 'Parse CSV'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Preview Users ({parsedUsers.length})
            </CardTitle>
            <CardDescription>
              Review the parsed users before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded p-4">
              {parsedUsers.slice(0, 10).map((user, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    {user.company && <div className="text-xs text-gray-500">{user.company}</div>}
                  </div>
                  <div className="text-sm text-blue-600">SmartCRM</div>
                </div>
              ))}
              {parsedUsers.length > 10 && (
                <div className="text-center text-gray-500 py-2">
                  ... and {parsedUsers.length - 10} more users
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
              <Button 
                onClick={handleBulkImport}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Importing...' : `Import ${parsedUsers.length} Users`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Your bulk user import has been completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.success}</div>
                <div className="text-sm text-blue-700">Emails Sent</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
                  <div>
                    <div className="font-medium text-red-800">Import Errors:</div>
                    <ul className="mt-2 space-y-1">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-sm text-red-700">• {error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-sm text-red-700">... and {importResult.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <Mail className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                <div>
                  <strong className="text-green-800">What happens next:</strong>
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>• Users receive welcome emails with account access links</li>
                    <li>• Emails use the "Confirm Reauthentication" template with SmartCRM branding</li>
                    <li>• Users set their password and access their dashboard immediately</li>
                    <li>• All support requests go to support@videoremix.io</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={resetImport} className="w-full">
              Import More Users
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}