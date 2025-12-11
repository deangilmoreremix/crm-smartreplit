import React, { useState } from 'react';
import { useGemini } from '../../services/geminiService';
import AIToolContent from '../shared/AIToolContent';
import { Calendar, Users, FileText, RefreshCw, Copy, Check, Plus, Trash2, Clock } from 'lucide-react';
import ReasoningToggle from '../shared/ReasoningToggle';

const MeetingAgendaContent: React.FC = () => {
  const [formData, setFormData] = useState({
    meetingPurpose: '',
    attendees: ['', ''],
    previousMeetingNotes: '',
    meetingDuration: '30'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reasoning, setReasoning] = useState<string | null>(null);

  const gemini = useGemini();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAttendeeChange = (index: number, value: string) => {
    const newAttendees = [...formData.attendees];
    newAttendees[index] = value;
    setFormData({
      ...formData,
      attendees: newAttendees
    });
  };

  const addAttendee = () => {
    setFormData({
      ...formData,
      attendees: [...formData.attendees, '']
    });
  };

  const removeAttendee = (index: number) => {
    if (formData.attendees.length <= 1) return;
    const newAttendees = [...formData.attendees];
    newAttendees.splice(index, 1);
    setFormData({
      ...formData,
      attendees: newAttendees
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meetingPurpose) return;

    // Filter out empty attendees
    const validAttendees = formData.attendees.filter(att => att.trim() !== '');
    if (validAttendees.length === 0) {
      setError("Please add at least one attendee");
      return;
    }

    setIsLoading(true);
    setError(null);
    setReasoning(null);
    
    try {
      const agenda = await gemini.generateMeetingAgenda(
        formData.meetingPurpose,
        validAttendees,
        formData.previousMeetingNotes || undefined
      );

      const reasoningPrompt = `Outline the reasoning behind this meeting agenda for ${formData.meetingPurpose}. Include why each section is important.`;
      const reasonText = await gemini.generateReasoning(reasoningPrompt);

      setResult(agenda);
      setReasoning(reasonText);
      setCopied(false);
    } catch (err) {
      console.error('Error generating meeting agenda:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the meeting agenda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Meeting purposes
  const meetingPurposes = [
    'Sales Discovery Call',
    'Product Demo',
    'Proposal Presentation',
    'Contract Negotiation',
    'Quarterly Business Review',
    'Project Kickoff',
    'Status Update',
    'Problem Solving Session'
  ];
  
  // Meeting durations
  const meetingDurations = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <div className="flex items-start">
          <Calendar className="text-amber-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-amber-800">Meeting Agenda Generator</h3>
            <p className="text-sm text-amber-700 mt-1">
              Create structured, effective meeting agendas to keep your sales meetings focused and productive. Toggle reasoning after generation to see how the agenda was planned.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Creating meeting agenda..."
        resultTitle="Meeting Agenda"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="meetingPurpose" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Purpose/Type
            </label>
            <div className="relative">
              <input
                list="meeting-purpose-options"
                id="meetingPurpose"
                name="meetingPurpose"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g. Sales Discovery Call, Product Demo"
                value={formData.meetingPurpose}
                onChange={handleChange}
                required
              />
              <datalist id="meeting-purpose-options">
                {meetingPurposes.map((purpose, index) => (
                  <option key={index} value={purpose} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Attendees
              </label>
              <button
                type="button"
                onClick={addAttendee}
                className="text-xs flex items-center text-amber-600 hover:text-amber-800"
              >
                <Plus size={14} className="mr-1" />
                Add Attendee
              </button>
            </div>
            
            {formData.attendees.map((attendee, index) => (
              <div key={index} className="flex mb-2">
                <div className="flex-grow flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <div className="bg-gray-100 p-2">
                    <Users size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={attendee}
                    onChange={(e) => handleAttendeeChange(index, e.target.value)}
                    placeholder={`Attendee ${index + 1} (name and role)`}
                    className="flex-1 p-2 border-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                {formData.attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttendee(index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-800 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {error && formData.attendees.every(a => !a.trim()) && (
              <p className="text-red-600 text-sm mt-1">Please add at least one attendee</p>
            )}
          </div>
          
          <div>
            <label htmlFor="meetingDuration" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              Meeting Duration
            </label>
            <select
              id="meetingDuration"
              name="meetingDuration"
              value={formData.meetingDuration}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
            >
              {meetingDurations.map(duration => (
                <option key={duration.value} value={duration.value}>{duration.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="previousMeetingNotes" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FileText className="h-4 w-4 mr-1 text-gray-500" />
              Previous Meeting Notes (Optional)
            </label>
            <textarea
              id="previousMeetingNotes"
              name="previousMeetingNotes"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              placeholder="Add any notes from previous meetings to provide context"
              value={formData.previousMeetingNotes}
              onChange={handleChange}
            ></textarea>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.meetingPurpose.trim() || formData.attendees.every(a => !a.trim())}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar size={18} className="mr-2" />
                  Generate Agenda
                </>
              )}
            </button>
          </div>
        </form>
      </AIToolContent>

      {result && !isLoading && !error && (
        <>
          <div className="mt-6">
            <div className="flex justify-end space-x-2 mb-2">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
          <ReasoningToggle reasoning={reasoning} />
        </>
      )}
    </div>
  );
};

export default MeetingAgendaContent;