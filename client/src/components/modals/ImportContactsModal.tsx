import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { useContactStore } from '../../hooks/useContactStore';
import { Contact } from '../../types/contact';
import {
  X,
  Upload,
  FileText,
  Users,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (contacts: Contact[]) => void;
}

interface ParsedContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  industry?: string;
  source?: string;
  status?: string;
  notes?: string;
  tags?: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const ImportContactsModal = ({
  isOpen,
  onClose,
  onImport
}: ImportContactsModalProps) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addContact } = useContactStore();

  const sampleCsv = `firstName,lastName,email,phone,company,position,industry,source,status,notes
John,Doe,john.doe@example.com,(555) 123-4567,Acme Corp,Marketing Director,Technology,LinkedIn,lead,Interested in enterprise solutions
Jane,Smith,jane.smith@company.com,(555) 987-6543,Tech Solutions,CEO,Software,Referral,prospect,High priority follow-up`;

  const parseCSV = (content: string): ParsedContact[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const contacts: ParsedContact[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map(v => v.replace(/^["']|["']$/g, '').trim());

      const contact: ParsedContact = {
        firstName: '',
        lastName: '',
        email: ''
      };

      headers.forEach((header, index) => {
        const value = cleanValues[index] || '';
        
        switch (header) {
          case 'firstname':
          case 'first_name':
          case 'first name':
            contact.firstName = value;
            break;
          case 'lastname':
          case 'last_name':
          case 'last name':
            contact.lastName = value;
            break;
          case 'email':
          case 'email_address':
          case 'emailaddress':
            contact.email = value;
            break;
          case 'phone':
          case 'phone_number':
          case 'phonenumber':
          case 'mobile':
            contact.phone = value;
            break;
          case 'company':
          case 'company_name':
          case 'organization':
            contact.company = value;
            break;
          case 'position':
          case 'title':
          case 'job_title':
          case 'jobtitle':
            contact.position = value;
            break;
          case 'industry':
          case 'sector':
            contact.industry = value;
            break;
          case 'source':
          case 'lead_source':
          case 'leadsource':
            contact.source = value;
            break;
          case 'status':
          case 'lead_status':
            contact.status = value;
            break;
          case 'notes':
          case 'note':
          case 'comments':
            contact.notes = value;
            break;
          case 'tags':
            contact.tags = value.split(';').map(t => t.trim()).filter(Boolean);
            break;
          case 'name':
          case 'fullname':
          case 'full_name':
            const nameParts = value.split(' ');
            contact.firstName = nameParts[0] || '';
            contact.lastName = nameParts.slice(1).join(' ') || '';
            break;
        }
      });

      if (!contact.email && !contact.firstName && !contact.lastName) {
        errors.push(`Row ${i + 1}: Missing required fields (email or name)`);
        continue;
      }

      if (contact.email && !contact.email.includes('@')) {
        errors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      contacts.push(contact);
    }

    if (errors.length > 0) {
      console.warn('CSV parsing warnings:', errors);
    }

    return contacts;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      
      try {
        const parsed = parseCSV(content);
        if (parsed.length === 0) {
          toast({
            title: "No valid contacts found",
            description: "Please check your CSV format",
            variant: "destructive"
          });
          return;
        }
        setParsedContacts(parsed);
        setStep('preview');
        toast({
          title: "File parsed successfully",
          description: `Found ${parsed.length} contacts`
        });
      } catch (error: any) {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const handlePasteCSV = () => {
    if (!csvContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste your CSV data first",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsed = parseCSV(csvContent);
      if (parsed.length === 0) {
        toast({
          title: "No valid contacts found",
          description: "Please check your CSV format",
          variant: "destructive"
        });
        return;
      }
      setParsedContacts(parsed);
      setStep('preview');
      toast({
        title: "CSV parsed successfully",
        description: `Found ${parsed.length} contacts`
      });
    } catch (error: any) {
      toast({
        title: "Error parsing CSV",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setStep('importing');
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    const importedContacts: Contact[] = [];

    for (const contact of parsedContacts) {
      try {
        const newContact = addContact({
          firstName: contact.firstName,
          lastName: contact.lastName,
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          position: contact.position,
          title: contact.position,
          industry: contact.industry,
          source: contact.source || 'CSV Import',
          sources: [contact.source || 'CSV Import'],
          status: (contact.status as any) || 'lead',
          notes: contact.notes,
          tags: contact.tags || []
        });
        
        importedContacts.push(newContact);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${contact.email || contact.firstName}: ${error.message}`);
      }
    }

    setImportResult(result);
    setIsLoading(false);
    setStep('complete');

    if (onImport && importedContacts.length > 0) {
      onImport(importedContacts);
    }

    toast({
      title: "Import Complete",
      description: `Successfully imported ${result.success} contacts${result.failed > 0 ? `, ${result.failed} failed` : ''}`
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setStep('upload');
    setCsvContent('');
    setParsedContacts([]);
    setImportResult(null);
    setFileName(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="import-contacts-modal">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Contacts</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 'upload' && 'Upload a CSV file or paste data'}
                {step === 'preview' && `${parsedContacts.length} contacts ready to import`}
                {step === 'importing' && 'Importing contacts...'}
                {step === 'complete' && 'Import completed'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            data-testid="close-import-modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
                data-testid="dropzone"
              >
                <input {...getInputProps()} data-testid="file-input" />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <FileText className="w-8 h-8 text-gray-500" />
                  </div>
                  {isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop your file here</p>
                  ) : (
                    <>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">
                        Drag & drop a CSV file here
                      </p>
                      <p className="text-gray-500 text-sm">or click to browse</p>
                    </>
                  )}
                  {fileName && (
                    <p className="text-green-600 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {fileName}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">or paste CSV data</span>
                </div>
              </div>

              <div>
                <Label htmlFor="csv-content">CSV Data</Label>
                <Textarea
                  id="csv-content"
                  placeholder="Paste your CSV data here..."
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="min-h-32 font-mono text-sm mt-2"
                  data-testid="csv-textarea"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">CSV Format</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Required: firstName, lastName, email<br />
                      Optional: phone, company, position, industry, source, status, notes, tags
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-700 font-medium"
                      data-testid="download-template"
                    >
                      <Download className="w-4 h-4" />
                      Download template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  {parsedContacts.length} contacts ready to import
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Company</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {parsedContacts.slice(0, 10).map((contact, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {contact.firstName} {contact.lastName}
                          </td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{contact.email}</td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{contact.company || '-'}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              {contact.status || 'lead'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedContacts.length > 10 && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-500">
                    ... and {parsedContacts.length - 10} more contacts
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Importing contacts...</p>
              <p className="text-gray-500 mt-1">Please wait while we add your contacts</p>
            </div>
          )}

          {step === 'complete' && importResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-green-700 dark:text-green-300 text-sm">Successfully imported</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-red-700 dark:text-red-300 text-sm">Failed</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</p>
                  <ul className="space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300">• {error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-sm text-red-700 dark:text-red-300">
                        ... and {importResult.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">What's next?</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Your contacts are now available in the contacts list</li>
                      <li>• You can enrich them with AI to get more data</li>
                      <li>• Use filters and search to find specific contacts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose} data-testid="cancel-import">
                Cancel
              </Button>
              <Button onClick={handlePasteCSV} disabled={!csvContent.trim()} data-testid="parse-csv">
                Parse CSV
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading} data-testid="import-contacts">
                <Users className="w-4 h-4 mr-2" />
                Import {parsedContacts.length} Contacts
              </Button>
            </>
          )}

          {step === 'importing' && (
            <div className="w-full text-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Importing...
            </div>
          )}

          {step === 'complete' && (
            <>
              <Button variant="outline" onClick={resetModal}>
                Import More
              </Button>
              <Button onClick={handleClose} data-testid="done-import">
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal;
