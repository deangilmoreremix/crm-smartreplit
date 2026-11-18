import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CampaignStep } from '../../services/leadAutomationApi';

interface Props {
  steps: CampaignStep[];
  onChange: (steps: CampaignStep[]) => void;
}

const CHANNELS: CampaignStep['channel'][] = ['email', 'call', 'sms', 'task'];

/** Edit the steps of a campaign. Each step becomes a task for the contact on its day. */
export default function StepsEditor({ steps, onChange }: Props) {
  const update = (index: number, patch: Partial<CampaignStep>) =>
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-3">
      {steps.length === 0 && <p className="text-sm text-gray-500">No steps yet. Add one or generate them with AI.</p>}
      {steps.map((step, index) => (
        <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2" data-testid="campaign-step">
          <div className="flex gap-2 items-end">
            <div className="w-24">
              <Label className="text-xs">Day</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={step.day}
                onChange={(e) => update(index, { day: Number(e.target.value) })}
                aria-label={`Step ${index + 1} day`}
              />
            </div>
            <div className="w-32">
              <Label className="text-xs">Type</Label>
              <Select value={step.channel} onValueChange={(v) => update(index, { channel: v as CampaignStep['channel'] })}>
                <SelectTrigger aria-label={`Step ${index + 1} type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Title</Label>
              <Input value={step.title} onChange={(e) => update(index, { title: e.target.value })} placeholder="e.g. Intro email" aria-label={`Step ${index + 1} title`} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(steps.filter((_, i) => i !== index))} aria-label={`Remove step ${index + 1}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <Label className="text-xs">Message / notes</Label>
            <Textarea rows={3} value={step.message} onChange={(e) => update(index, { message: e.target.value })} placeholder="The text to send, or talking points for a call" aria-label={`Step ${index + 1} message`} />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...steps, { day: steps.length ? steps[steps.length - 1].day + 2 : 0, channel: 'email', title: '', message: '' }])}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add step
      </Button>
    </div>
  );
}
