import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Prompt {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isActive: boolean;
  performance_score?: number;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface PromptFormProps {
  prompt?: Prompt;
  onSave: (prompt: Prompt) => void;
  onCancel: () => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ prompt, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Prompt>({
    title: '',
    content: '',
    category: '',
    tags: [],
    isActive: true,
    ...prompt
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTagChange = (tags: string) => {
    setFormData(prev => ({
      ...prev,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {prompt ? 'Edit Prompt' : 'Create New Prompt'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
            <option value="support">Support</option>
            <option value="content">Content Creation</option>
            <option value="analysis">Analysis</option>
            <option value="communication">Communication</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleTagChange(e.target.value)}
            placeholder="e.g., sales, email, persuasive"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your AI prompt here..."
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Active (available for use)
          </label>
        </div>

        {prompt && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Performance Score:</span>
                <span className="ml-2 font-medium">{prompt.performance_score || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Usage Count:</span>
                <span className="ml-2 font-medium">{prompt.usage_count || 0}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {prompt ? 'Update Prompt' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface PromptLibraryProps {
  onPromptSelect?: (prompt: Prompt) => void;
  selectedPromptId?: string;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onPromptSelect, selectedPromptId }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>();
  const [filter, setFilter] = useState({
    category: '',
    search: '',
    activeOnly: true
  });

  useEffect(() => {
    loadPrompts();
  }, [filter]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filteredPrompts = data || [];

      // Apply filters
      if (filter.category) {
        filteredPrompts = filteredPrompts.filter(p => p.category === filter.category);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredPrompts = filteredPrompts.filter(p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.content.toLowerCase().includes(searchLower) ||
          p.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filter.activeOnly) {
        filteredPrompts = filteredPrompts.filter(p => p.isActive);
      }

      setPrompts(filteredPrompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (promptData: Prompt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const promptToSave = {
        ...promptData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (editingPrompt?.id) {
        // Update existing
        const { error } = await supabase
          .from('custom_prompts')
          .update(promptToSave)
          .eq('id', editingPrompt.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('custom_prompts')
          .insert(promptToSave);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingPrompt(undefined);
      await loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Error saving prompt. Please try again.');
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const { error } = await supabase
        .from('custom_prompts')
        .delete()
        .eq('id', promptId);

      if (error) throw error;

      await loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Error deleting prompt. Please try again.');
    }
  };

  if (showForm) {
    return (
      <PromptForm
        prompt={editingPrompt}
        onSave={handleSavePrompt}
        onCancel={() => {
          setShowForm(false);
          setEditingPrompt(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Prompt Library</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Prompt
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search prompts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="support">Support</option>
              <option value="content">Content Creation</option>
              <option value="analysis">Analysis</option>
              <option value="communication">Communication</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filter.activeOnly}
                onChange={(e) => setFilter(prev => ({ ...prev, activeOnly: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 cursor-pointer transition-all ${
                selectedPromptId === prompt.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onPromptSelect?.(prompt)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{prompt.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  prompt.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {prompt.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-3">{prompt.content}</p>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500 capitalize">{prompt.category}</span>
                <div className="flex space-x-1">
                  {prompt.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                  {prompt.tags && prompt.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{prompt.tags.length - 2}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Used: {prompt.usage_count || 0}</span>
                <span>Score: {prompt.performance_score || 'N/A'}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPrompt(prompt);
                    setShowForm(true);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePrompt(prompt.id!);
                  }}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && prompts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No prompts found. Create your first prompt to get started!</p>
        </div>
      )}
    </div>
  );
};

export { PromptLibrary, PromptForm };
export type { Prompt };