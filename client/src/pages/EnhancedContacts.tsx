import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Contact } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Brain, 
  Download, 
  Upload, 
  FileInput,
  X,
  ArrowUp,
  ArrowDown,
  CheckCheck,
  Zap,
  Mail,
  Users
} from 'lucide-react';
import { useOpenAI } from '../services/openaiService';
import { useForm } from 'react-hook-form';
import Avatar from 'react-avatar';
import { CSVLink } from 'react-csv';
import { useDropzone } from 'react-dropzone';
import { read, utils } from 'xlsx';
import Fuse from 'fuse.js';
import Select from 'react-select';
import AIEnhancedContactCard from '../components/contacts/AIEnhancedContactCard';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  PaginationState
} from '@tanstack/react-table';
import { useContactStore } from '../store/contactStore';
import ContactImport from '../components/contacts/ContactImport';
import ContactExport from '../components/contacts/ContactExport';

const Contacts: React.FC = () => {
  // Use the contact store
  const { 
    contacts: storeContacts, 
    isLoading: storeIsLoading,
    error: storeError,
    fetchContacts, 
    createContact,
    updateContact,
    deleteContact,
    selectContact,
    importContacts
  } = useContactStore();

  // Local state for UI
  const [contacts, setContacts] = useState<Contact[]>([]);
  const openai = useOpenAI();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [importValidation, setImportValidation] = useState<{error?: string, success?: string}>({});
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Extract unique industries for filtering
  const industries = useMemo(() => 
    [...new Set(contacts.map(contact => contact.industry))].filter(Boolean) as string[],
    [contacts]
  );

  const statuses = ['lead', 'prospect', 'customer', 'churned'];

  // Filters state
  const [activeFilters, setActiveFilters] = useState<{
    status: string | null,
    industry: string | null,
    score: [number, number] | null
  }>({
    status: null,
    industry: null,
    score: null
  });

  // Load contacts from store on component mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Update local contacts from store
  useEffect(() => {
    if (Object.keys(storeContacts).length > 0) {
      setContacts(Object.values(storeContacts));
    }
  }, [storeContacts]);

  // Set up fuzzy search with fuse.js
  const fuse = useMemo(() => 
    new Fuse(contacts, {
      keys: ['name', 'email', 'company', 'phone'],
      threshold: 0.3
    }),
  [contacts]);

  // Filter contacts based on search and active filters
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Apply search filter
    if (searchTerm) {
      result = fuse.search(searchTerm).map(res => res.item);
    }

    // Apply status filter
    if (activeFilters.status) {
      result = result.filter(contact => contact.status === activeFilters.status);
    }

    // Apply industry filter
    if (activeFilters.industry) {
      result = result.filter(contact => contact.industry === activeFilters.industry);
    }

    // Apply score filter
    if (activeFilters.score) {
      const [min, max] = activeFilters.score;
      result = result.filter(contact => 
        (contact.score || 0) >= min && (contact.score || 0) <= max
      );
    }

    return result;
  }, [contacts, searchTerm, activeFilters, fuse]);

  const toggleContactSelection = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(contactId => contactId !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const statusColors = {
    lead: 'bg-yellow-100 text-yellow-800',
    prospect: 'bg-purple-100 text-purple-800',
    customer: 'bg-green-100 text-green-800',
    churned: 'bg-red-100 text-red-800'
  };

  // Import contacts feature
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            if (!data) {
              setImportValidation({ error: 'Failed to read file' });
              return;
            }

            const workbook = read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(worksheet);

            // Validate data has required fields
            if (jsonData.length === 0) {
              setImportValidation({ error: 'No data found in file' });
              return;
            }

            // Check for required fields
            const requiredFields = ['name', 'email'];
            const firstRow = jsonData[0] as any;
            const missingFields = requiredFields.filter(field => 
              !Object.keys(firstRow).some(key => 
                key.toLowerCase() === field.toLowerCase()
              )
            );

            if (missingFields.length > 0) {
              setImportValidation({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
              });
              return;
            }

            setImportedData(jsonData);
            setImportValidation({ 
              success: `Found ${jsonData.length} contacts ready to import` 
            });
          } catch (error) {
            setImportValidation({ error: 'Failed to parse file' });
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  });

  const handleImportContacts = () => {
    if (importedData.length === 0) {
      return;
    }

    // Convert imported data to Contact format
    const newContacts: Partial<Contact>[] = importedData.map((row: any) => {
      // Map the imported data to our Contact type
      return {
        name: row.name || row.Name || '',
        email: row.email || row.Email || '',
        phone: row.phone || row.Phone || '',
        company: row.company || row.Company || '',
        position: row.position || row.Position || row.Title || '',
        status: (row.status || row.Status || 'lead').toLowerCase(),
        industry: row.industry || row.Industry || '',
        location: row.location || row.Location || '',
        notes: row.notes || row.Notes || '',
      };
    });

    // Import to Supabase through store
    importContacts(newContacts)
      .then(() => {
        setImportValidation({ success: `Successfully imported ${newContacts.length} contacts` });

        // Reset import state
        setTimeout(() => {
          setImportedData([]);
          setShowImportModal(false);
          setImportValidation({});
        }, 1500);
      })
      .catch(error => {
        setImportValidation({ error: 'Failed to import contacts: ' + error.message });
      });
  };

  // Submit form for creating a new contact
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Contact>();

  const onSubmit = (data: any) => {
    // Add new contact through Supabase
    createContact({
      ...data,
      status: data.status || 'lead',
      score: data.score || 50
    })
      .then(() => {
        reset();
        setShowAddContactModal(false);
      })
      .catch(error => {
        console.error('Failed to create contact:', error);
      });
  };

  // Handle AI analysis of all contacts
  const handleAnalyzeAllContacts = async () => {
    setIsAnalyzing(true);

    try {
      // In a real app, we would process all leads in batches
      // For demo purposes, just wait a moment and update scores
      await new Promise(r => setTimeout(r, 1500));

      const updatedContacts = contacts.map(contact => {
        // Simple mock logic to simulate AI scoring
        const randomAdjustment = Math.floor(Math.random() * 10) - 5;
        const newScore = Math.max(0, Math.min(100, (contact.score || 50) + randomAdjustment));

        // Update contact in supabase
        updateContact(contact.id, { ...contact, score: newScore });

        return {
          ...contact,
          score: newScore
        };
      });

      setContacts(updatedContacts);
    } catch (err) {
      console.error("Error analyzing contacts:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Table setup using @tanstack/react-table
  const columnHelper = createColumnHelper<Contact>();

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <Link to={`/contacts/${info.row.original.id}`} className="flex items-center">
          <Avatar 
            name={info.getValue()} 
            size="40" 
            round 
            className="mr-3" 
          />
          <div>
            <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-sm text-gray-500">{info.row.original.email}</div>
          </div>
        </Link>
      )
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      cell: (info) => (
        <div>
          <div className="text-sm text-gray-900">{info.getValue() || 'N/A'}</div>
          <div className="text-sm text-gray-500">{info.row.original.position || ''}</div>
        </div>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          statusColors[info.getValue() as keyof typeof statusColors]
        }`}>
          {info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1)}
        </span>
      )
    }),
    columnHelper.accessor('score', {
      header: 'AI Score',
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className={`h-2.5 rounded-full ${
                info.getValue() && info.getValue() >= 80 ? 'bg-green-500' : 
                info.getValue() && info.getValue() >= 60 ? 'bg-blue-500' : 
                info.getValue() && info.getValue() >= 40 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} 
              style={{ width: `${info.getValue() || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-500">
            {info.getValue()}/100
          </span>
        </div>
      )
    }),
    columnHelper.accessor('lastContact', {
      header: 'Last Contact',
      cell: (info) => (
        <span className="text-sm text-gray-500">
          {info.getValue()?.toLocaleDateString() || 'N/A'}
        </span>
      )
    }),
    columnHelper.accessor('industry', {
      header: 'Industry',
      cell: (info) => (
        <span className="text-sm text-gray-500">
          {info.getValue() || 'N/A'}
        </span>
      )
    }),
    columnHelper.accessor('id', {
      header: 'Actions',
      cell: (info) => (
        <div className="flex justify-end">
          <button className="text-gray-400 hover:text-gray-500 mr-2">
            <Link to={`/contacts/${info.getValue()}`}>
              <MoreHorizontal size={18} />
            </Link>
          </button>
        </div>
      )
    })
  ], []);

  const table = useReactTable({
    columns,
    data: filteredContacts,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Set up export data for CSV
  const exportData = useMemo(() => 
    contacts.map(contact => ({
      Name: contact.name,
      Email: contact.email,
      Phone: contact.phone,
      Company: contact.company,
      Position: contact.position,
      Status: contact.status,
      Score: contact.score,
      LastContact: contact.lastContact ? contact.lastContact.toLocaleDateString() : '',
      Industry: contact.industry,
      Location: contact.location,
      Notes: contact.notes
    })),
  [contacts]);

  const csvHeaders = [
    { label: "Name", key: "Name" },
    { label: "Email", key: "Email" },
    { label: "Phone", key: "Phone" },
    { label: "Company", key: "Company" },
    { label: "Position", key: "Position" },
    { label: "Status", key: "Status" },
    { label: "Score", key: "Score" },
    { label: "Last Contact", key: "LastContact" },
    { label: "Industry", key: "Industry" },
    { label: "Location", key: "Location" },
    { label: "Notes", key: "Notes" }
  ];

  // Handle bulk AI analysis for selected contacts
  const handleAnalyzeSelectedContacts = async () => {
    if (selectedContacts.length === 0) return;

    setIsAnalyzing(true);

    try {
      // Simple mock logic to simulate AI scoring
      const updatedContacts = contacts.map(contact => {
        if (selectedContacts.includes(contact.id)) {
          const randomAdjustment = Math.floor(Math.random() * 10) - 5;
          const newScore = Math.max(0, Math.min(100, (contact.score || 50) + randomAdjustment));

          // Update contact in store
          updateContact(contact.id, { score: newScore });

          return {
            ...contact,
            score: newScore
          };
        }
        return contact;
      });

      setContacts(updatedContacts);

      // Clear selected contacts after bulk operation
      setSelectedContacts([]);
      setShowBulkActions(false);
    } catch (err) {
      console.error("Error analyzing selected contacts:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Watch for selections to show/hide bulk actions
  useEffect(() => {
    if (selectedContacts.length > 0) {
      setShowBulkActions(true);
    } else {
      setShowBulkActions(false);
    }
  }, [selectedContacts]);

  // Calculate values needed for pagination
  const currentPage = pagination.pageIndex + 1;
  const itemsPerPage = pagination.pageSize;
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts with AI-powered insights</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button 
            onClick={handleAnalyzeAllContacts}
            disabled={isAnalyzing}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors disabled:bg-purple-300"
          >
            <Brain size={18} className="mr-1" />
            {isAnalyzing ? 'Analyzing...' : 'AI Lead Scoring'}
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            <Download size={18} className="mr-1" />
            Export
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
          >
            <Upload size={18} className="mr-1" />
            Import
          </button>
          <button 
            onClick={() => setShowAddContactModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Add Contact
          </button>
        </div>
      </header>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-blue-700 font-medium">{selectedContacts.length} contacts selected</span>
            <button 
              onClick={handleSelectAll}
              className="ml-4 text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="flex space-x-2">
            <div className="flex space-x-1">
              <button
                onClick={async () => {
                  if (selectedContacts.length === 0) return;
                  setIsAnalyzing(true);
                  
                  try {
                    const { batchAPIService } = await import('../services/openai-batch-api.service');
                    await batchAPIService.enrichContactsBulk(selectedContacts, ['contact_scoring'], { processingMode: 'immediate' });
                    setSelectedContacts([]);
                    setShowBulkActions(false);
                  } catch (error) {
                    console.error('Immediate analysis failed:', error);
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                className="inline-flex items-center px-2 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
              >
                <Zap size={14} className="mr-1" />
                Immediate
              </button>
              <button
                onClick={async () => {
                  if (selectedContacts.length === 0) return;
                  setIsAnalyzing(true);
                  
                  try {
                    const { batchAPIService } = await import('../services/openai-batch-api.service');
                    await batchAPIService.enrichContactsBulk(selectedContacts, ['contact_scoring'], { processingMode: 'overnight' });
                    setSelectedContacts([]);
                    setShowBulkActions(false);
                  } catch (error) {
                    console.error('Overnight analysis failed:', error);
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                className="inline-flex items-center px-2 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
              >
                <Layers size={14} className="mr-1" />
                Overnight (50% off)
              </button>
            </div>
            <button className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
              <Mail size={16} className="mr-1" />
              Add to Sequence
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
              <Users size={16} className="mr-1" />
              Export Selected
            </button>
            <button 
              onClick={() => setSelectedContacts([])}
              className="inline-flex items-center px-2 py-1.5 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div>
                <Select
                  placeholder="Status"
                  isClearable
                  className="min-w-[150px]"
                  options={statuses.map(status => ({ value: status, label: status.charAt(0).toUpperCase() + status.slice(1) }))}
                  onChange={(selectedOption) => setActiveFilters({
                    ...activeFilters, 
                    status: selectedOption?.value || null
                  })}
                />
              </div>
              <div>
                <Select
                  placeholder="Industry"
                  isClearable
                  className="min-w-[170px]"
                  options={industries.map(industry => ({ value: industry, label: industry }))}
                  onChange={(selectedOption) => setActiveFilters({
                    ...activeFilters, 
                    industry: selectedOption?.value || null
                  })}
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded border ${viewMode === 'table' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
                <button 
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded border ${viewMode === 'card' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {storeIsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading contacts...</p>
            </div>
          ) : filteredContacts.length > 0 ? (
            viewMode === 'table' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </div>
                    </th>
                    {table.getHeaderGroups().map(headerGroup => (
                      headerGroup.headers.map(header => (
                        <th 
                          key={header.id}
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="ml-1">
                              {{
                                asc: <ArrowUp size={14} className="text-gray-500" />,
                                desc: <ArrowDown size={14} className="text-gray-500" />
                              }[header.column.getIsSorted() as string] ?? (
                                <div className="opacity-0 group-hover:opacity-100">
                                  <ArrowUp size={14} className="text-gray-300" />
                                </div>
                              )}
                            </span>
                          </div>
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(row.original.id)}
                          onChange={() => toggleContactSelection(row.original.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </td>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredContacts.map(contact => (
                  <AIEnhancedContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContacts.includes(contact.id)}
                    onSelect={() => toggleContactSelection(contact.id)}
                    onClick={() => window.location.href = `/contacts/${contact.id}`}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500 mb-2">No contacts found</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredContacts.length)}
                </span>{' '}
                of <span className="font-medium">{filteredContacts.length}</span> results
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                disabled={pagination.pageIndex === 0}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1) }))}
                disabled={pagination.pageIndex === totalPages - 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Contact</h3>
                  <button 
                    onClick={() => setShowAddContactModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 gap-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        id="name"
                        type="text"
                        {...register("name", { required: "Name is required" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        id="email"
                        type="email"
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        id="phone"
                        type="tel"
                        {...register("phone")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        id="company"
                        type="text"
                        {...register("company")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
                      <input
                        id="position"
                        type="text"
                        {...register("position")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
                      <select
                        id="industry"
                        {...register("industry")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select Industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Education">Education</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        id="status"
                        {...register("status")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        id="location"
                        type="text"
                        {...register("location")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        id="notes"
                        rows={3}
                        {...register("notes")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Contact
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Import Contacts</h3>
                  <button 
                    onClick={() => setShowImportModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <ContactImport />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Contacts Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Export Contacts</h3>
                  <button 
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <ContactExport />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;