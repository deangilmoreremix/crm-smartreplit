import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useOpenAI } from '../services/openaiLegacyService';
import { useAIAssistant } from '../services/aiAssistantService';
import { Contact } from '../types';
import {
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  RefreshCw,
  AlertOctagon,
  FileText,
  MessageSquare,
  BarChart3,
  Brain,
  Edit,
  Trash2,
  Flag,
  Tag,
  MapPin,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';
import Avatar from 'react-avatar';
import { usePersistedLayout } from '../hooks/usePersistedLayout';
import { RecordShell } from './record/RecordPage';
import ContactRelated from './record/ContactRelated';
import { LayoutCustomizer, LayoutPref, applyLayout, emptyLayout } from './record/layout';

const ContactDetail: React.FC = () => {
  const { isDark } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // This would normally come from a router parameter and database
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});

  const { value: layout, setValue: setLayout } = usePersistedLayout<LayoutPref>(
    'record-layout',
    'contact:widgets',
    emptyLayout
  );
  const [customizing, setCustomizing] = useState(false);

  const openai = useOpenAI();
  const ai = useAIAssistant();

  const [leadScoreResult, setLeadScoreResult] = useState<string | null>(null);
  const [leadScoreLoading, setLeadScoreLoading] = useState(false);
  const [leadScoreError, setLeadScoreError] = useState<string | null>(null);

  const [personalizationResult, setPersonalizationResult] = useState<string | null>(null);
  const [personalizationLoading, setPersonalizationLoading] = useState(false);
  const [personalizationError, setPersonalizationError] = useState<string | null>(null);

  // Load the real contact from the contacts API by route id
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch('/api/contacts', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((rows: any[]) => {
        if (cancelled) return;
        const row = rows.find((r) => String(r.id) === id);
        if (!row) {
          setContact(null);
          return;
        }
        const loaded: Contact = {
          id: String(row.id),
          name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
          email: row.email ?? '',
          phone: row.phone ?? '',
          company: row.company ?? '',
          position: row.position ?? '',
          status: row.status ?? 'lead',
          score: Number(row.score ?? 0),
          lastContact: row.updatedAt ? new Date(row.updatedAt) : new Date(),
          notes: row.notes ?? '',
          industry: row.industry ?? '',
          location: [row.city, row.state].filter(Boolean).join(', '),
          tags: row.tags ?? [],
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        };
        setContact(loaded);
        setEditFormData(loaded);
      })
      .catch(() => !cancelled && setContact(null))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Handle editing the contact
  const handleEditToggle = () => {
    if (isEditing && contact) {
      setEditFormData(contact); // Reset form data if canceling
    }
    setIsEditing(!isEditing);
  };

  // Handle saving the edited contact
  const [saveError, setSaveError] = useState<string | null>(null);
  const handleSaveContact = async () => {
    if (!contact || !editFormData) return;
    setSaveError(null);
    const [firstName, ...rest] = String(editFormData.name ?? '')
      .trim()
      .split(/\s+/);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName ?? '',
          lastName: rest.join(' '),
          email: editFormData.email,
          phone: editFormData.phone,
          company: editFormData.company,
          position: editFormData.position,
          status: editFormData.status,
          industry: editFormData.industry,
          notes: editFormData.notes,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setContact({ ...contact, ...editFormData });
      setIsEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save contact');
    }
  };

  // Handle delete contact
  const handleDeleteContact = async () => {
    if (!contact || !confirm('Are you sure you want to delete this contact?')) return;
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) navigate('/contacts');
    else setSaveError(`Could not delete contact (${res.status})`);
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const previousInteractions = [
    'Initial call: Discussed basic features of our platform. John expressed interest in the enterprise plan but had concerns about implementation timeline.',
    'Email follow-up: Sent detailed information about implementation process. John replied with questions about security certifications.',
    'Demo meeting: Showcased enterprise features. John had technical questions about API integration capabilities.',
  ];

  const handleLeadScoreAnalysis = async () => {
    if (!contact) return;

    setLeadScoreLoading(true);
    setLeadScoreError(null);

    try {
      const result = await openai.predictLeadScore(contact);
      setLeadScoreResult(result);
    } catch (err) {
      setLeadScoreError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLeadScoreLoading(false);
    }
  };

  const handlePersonalization = async () => {
    if (!contact) return;

    setPersonalizationLoading(true);
    setPersonalizationError(null);

    try {
      const result = await ai.suggestPersonalization(contact, previousInteractions);
      setPersonalizationResult(result);
    } catch (err) {
      setPersonalizationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setPersonalizationLoading(false);
    }
  };

  const statusColors = {
    lead: 'bg-yellow-100 text-yellow-800',
    prospect: 'bg-purple-100 text-purple-800',
    customer: 'bg-green-100 text-green-800',
    churned: 'bg-red-100 text-red-800',
  };

  // Handle initiating a phone call
  const handleCallContact = () => {
    if (contact && contact.phone) {
      // Clean phone number
      const cleanNumber = contact.phone.replace(/\D/g, '');
      window.location.href = `tel:${cleanNumber}`;
    }
  };

  // Handle sending an email
  const handleSendEmail = () => {
    if (contact && contact.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={40} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">Contact not found</p>
        </div>
      </div>
    );
  }

  const widgetDefs: { id: string; label: string; col: 'left' | 'right'; node: React.ReactNode }[] =
    [
      {
        id: 'details',
        label: 'Contact details',
        col: 'left',
        node: (
          <React.Fragment>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[contact.status]
                  }`}
                >
                  {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                </span>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={editFormData.company || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      name="position"
                      value={editFormData.position || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={editFormData.status || 'lead'}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="churned">Churned</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={editFormData.industry || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={editFormData.notes || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-4">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {contact.email}
                          </a>
                          <p className="text-xs text-gray-500">Email</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <a
                            href={`tel:${contact.phone?.replace(/\D/g, '')}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            onClick={(e) => {
                              // Let the default tel: behavior handle the call
                            }}
                          >
                            {contact.phone || 'Not provided'}
                          </a>
                          <p className="text-xs text-gray-500">Phone</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.location || 'Not specified'}
                          </p>
                          <p className="text-xs text-gray-500">Location</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.lastContact
                              ? contact.lastContact.toLocaleDateString()
                              : 'Never contacted'}
                          </p>
                          <p className="text-xs text-gray-500">Last Contact</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-4">Company Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.company || 'Not provided'}
                          </p>
                          <p className="text-xs text-gray-500">Company</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.position || 'Not provided'}
                          </p>
                          <p className="text-xs text-gray-500">Position</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.industry || 'Not specified'}
                          </p>
                          <p className="text-xs text-gray-500">Industry</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Flag className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.score || 'N/A'}/100
                          </p>
                          <p className="text-xs text-gray-500">Lead Score</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {contact.notes && (
                    <div className="col-span-1 md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{contact.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-4">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSendEmail}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Mail size={16} className="mr-1.5" />
                    Send Email
                  </button>
                  <button
                    onClick={handleCallContact}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Phone size={16} className="mr-1.5" />
                    Call
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Calendar size={16} className="mr-1.5" />
                    Schedule Meeting
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <MessageSquare size={16} className="mr-1.5" />
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </React.Fragment>
        ),
      },
      {
        id: 'history',
        label: 'Interaction history',
        col: 'left',
        node: (
          <React.Fragment>
            {/* Interaction History */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction History</h3>

              <div className="space-y-4">
                {previousInteractions.map((interaction, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-0">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {idx === 0 && <MessageSquare size={16} className="text-blue-500" />}
                        {idx === 1 && <Mail size={16} className="text-purple-500" />}
                        {idx === 2 && <FileText size={16} className="text-green-500" />}
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm">{interaction}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(
                            Date.now() - idx * 7 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        ),
      },
      {
        id: 'ai',
        label: 'AI insights',
        col: 'right',
        node: (
          <React.Fragment>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <Brain size={20} className="text-blue-500 mr-2" />
                <h3 className="text-lg font-medium">AI Insights</h3>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleLeadScoreAnalysis}
                  disabled={leadScoreLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:bg-blue-300"
                >
                  {leadScoreLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain size={18} />
                      Analyze Lead Potential
                    </>
                  )}
                </button>

                {leadScoreError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
                    <AlertOctagon size={18} />
                    <span>{leadScoreError}</span>
                  </div>
                )}

                {leadScoreResult && !leadScoreError && (
                  <div className="bg-blue-50 text-gray-800 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Lead Analysis</h3>
                    <div className="whitespace-pre-wrap text-sm">{leadScoreResult}</div>
                  </div>
                )}

                <button
                  onClick={handlePersonalization}
                  disabled={personalizationLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors disabled:bg-indigo-300 mt-2"
                >
                  {personalizationLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Personalization Recommendations'
                  )}
                </button>

                {personalizationError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
                    <AlertOctagon size={18} />
                    <span>{personalizationError}</span>
                  </div>
                )}

                {personalizationResult && !personalizationError && (
                  <div className="bg-blue-50 text-gray-800 p-4 rounded-md">
                    <div className="whitespace-pre-wrap text-sm">{personalizationResult}</div>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ),
      },
      {
        id: 'engagement',
        label: 'Engagement summary',
        col: 'right',
        node: (
          <React.Fragment>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <BarChart3 size={22} className="text-indigo-500 mr-2" />
                <h3 className="text-lg font-medium">Engagement Summary</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Email Engagement</span>
                    <span className="font-medium">64%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '64%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Meeting Attendance</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Response Time</span>
                    <span className="font-medium">8 hours avg.</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ),
      },
    ];
  const orderedWidgets = applyLayout(widgetDefs, layout);
  const leftWidgets = orderedWidgets.filter((w) => w.col === 'left');
  const rightWidgets = orderedWidgets.filter((w) => w.col === 'right');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/contacts')}
            className="mr-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
            <p className="text-gray-600 mt-1">
              {contact.position} at {contact.company}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button
            onClick={handleEditToggle}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {isEditing ? (
              <>
                <X size={16} className="mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Edit size={16} className="mr-1" />
                Edit
              </>
            )}
          </button>
          {isEditing ? (
            <button
              onClick={handleSaveContact}
              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Check size={16} className="mr-1" />
              Save
            </button>
          ) : (
            <button
              onClick={handleDeleteContact}
              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </button>
          )}
        </div>
      </header>

      {saveError && (
        <div role="alert" className="mb-4 text-sm text-red-600">
          {saveError}
        </div>
      )}
      <RecordShell
        objectType="contact"
        recordId={contact.id}
        related={<ContactRelated contactId={contact.id} companyText={contact.company} />}
        overview={
          <>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setCustomizing((c) => !c)}
                className="text-sm text-blue-600"
              >
                {customizing ? 'Done' : 'Customize layout'}
              </button>
            </div>
            {customizing && (
              <div className="mb-4">
                <LayoutCustomizer
                  title="Sections"
                  items={widgetDefs.map((w) => ({ id: w.id, label: w.label }))}
                  layout={layout}
                  onChange={setLayout}
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:flex md:flex-wrap md:-mx-4">
              {/* Left Column - Main Info */}
              <div className="md:w-2/3 md:px-4 mb-8">
                {leftWidgets.map((w) => (
                  <React.Fragment key={w.id}>{w.node}</React.Fragment>
                ))}
              </div>

              {/* Right Column - AI Insights */}
              <div className="md:w-1/3 md:px-4">
                {rightWidgets.map((w) => (
                  <React.Fragment key={w.id}>{w.node}</React.Fragment>
                ))}
              </div>
            </div>
          </>
        }
      />
    </div>
  );
};

export default ContactDetail;
