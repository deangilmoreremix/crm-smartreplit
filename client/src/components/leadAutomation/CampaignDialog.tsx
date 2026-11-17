import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateAI } from '../../services/aiGenerate';
import {
  contactMatchesAudience,
  createCampaign,
  normalizeSteps,
  STEP_SCHEMA,
  type CampaignAudience,
  type CampaignStep,
} from '../../services/leadAutomationApi';
import StepsEditor from './StepsEditor';

interface ContactLike {
  status?: string;
  source?: string;
  tags?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: ContactLike[];
  initial?: { name?: string; description?: string; steps?: CampaignStep[] };
  onCreated: (result: { name: string; enrolled: number; tasksCreated: number }) => void;
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export default function CampaignDialog({ open, onOpenChange, contacts, initial, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [tagsText, setTagsText] = useState('');
  const [steps, setSteps] = useState<CampaignStep[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start fresh (or from the generated sequence) each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setDescription(initial?.description || '');
    setSteps(initial?.steps || []);
    setStatuses([]);
    setSources([]);
    setTagsText('');
    setError(null);
  }, [open, initial]);

  const statusOptions = useMemo(() => Array.from(new Set(contacts.map((c) => c.status).filter(Boolean) as string[])).sort(), [contacts]);
  const sourceOptions = useMemo(() => Array.from(new Set(contacts.map((c) => c.source).filter(Boolean) as string[])).sort(), [contacts]);
  const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
  const audience: CampaignAudience = { statuses, sources, tags };
  const matchCount = contacts.filter((c) => contactMatchesAudience(c, audience)).length;

  const generateSteps = async () => {
    if (!name.trim() && !description.trim()) {
      setError('Enter a campaign name or goal first so the AI knows what to write.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await generateAI({
        system: 'You design lead-nurturing sequences for a CRM. Each step becomes a task for a salesperson, so write the exact message to send.',
        prompt: `Create a 4-6 step nurturing sequence.\nCampaign: ${name || 'Untitled'}\nGoal / audience: ${description || 'Not specified'}\nUse a mix of channels and spread the steps over about 2 weeks.`,
        schema: STEP_SCHEMA as unknown as Record<string, unknown>,
        schemaName: 'campaign_steps',
      });
      const generated = normalizeSteps(result.data?.steps);
      if (!generated.length) throw new Error('The AI did not return any steps. Try again.');
      setSteps(generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate steps');
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!name.trim()) return setError('Give the campaign a name.');
    if (!steps.length || steps.some((s) => !s.title.trim())) return setError('Add at least one step and give every step a title.');
    setSaving(true);
    try {
      const result = await createCampaign({ name: name.trim(), description: description.trim() || undefined, audience, steps });
      onCreated({ name: name.trim(), enrolled: result.enrolled, tasksCreated: result.tasksCreated });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Each step becomes a task for every contact in the audience, due on its day. Nothing is sent automatically.
          </p>
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Name</Label>
            <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New lead welcome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-goal">Goal / audience description (used by AI)</Label>
            <Textarea id="campaign-goal" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Warm up new website leads and book a demo" />
          </div>

          <div className="space-y-3">
            <Label>Audience (leave empty for all contacts)</Label>
            {statusOptions.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                {statusOptions.map((s) => (
                  <label key={s} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={statuses.includes(s)} onChange={() => setStatuses(toggle(statuses, s))} />
                    {s}
                  </label>
                ))}
              </div>
            )}
            {sourceOptions.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Source:</span>
                {sourceOptions.map((s) => (
                  <label key={s} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={sources.includes(s)} onChange={() => setSources(toggle(sources, s))} />
                    {s}
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tags:</span>
              <Input className="max-w-xs" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="comma separated" aria-label="Audience tags" />
            </div>
            <p className="text-sm font-medium" data-testid="audience-count">
              {matchCount} contact{matchCount === 1 ? '' : 's'} match
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={generateSteps} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate steps with AI'}
              </Button>
            </div>
            <StepsEditor steps={steps} onChange={setSteps} />
          </div>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Creating...' : 'Create campaign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
