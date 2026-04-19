import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Badge } from '../Badge';
import { Modal } from '../Modal';
import { Loader2, Plus, GripVertical, Trash2, Edit, Save, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface WorkflowStep {
  id: string;
  actionType: string;
  configuration: Record<string, unknown>;
  order: number;
  parentId?: string;
  condition?: Record<string, unknown>;
}

export interface Workflow {
  id?: string;
  name: string;
  triggerType: string;
  appSlug: string;
  steps: WorkflowStep[];
}

export interface WorkflowBuilderProps {
  workflow: Workflow;
  onChange: (workflow: Workflow) => void;
  onSave?: (workflow: Workflow) => Promise<void>;
}

const ACTION_TYPES = [
  'SEND_EMAIL',
  'UPDATE_FIELD',
  'CREATE_RECORD',
  'CREATE_TASK',
  'CREATE_NOTE',
  'WEBHOOK',
  'CODE',
  'WAIT',
  'BRANCH',
  'SEND_SMS',
  'CREATE_DEAL',
  'CREATE_CONTACT',
] as const;

const TRIGGER_TYPES = [
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'MANUAL',
  'SCHEDULED',
  'WEBHOOK',
  'AI_COMPLETED',
] as const;

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflow, onChange, onSave }) => {
  const [name, setName] = useState(workflow.name);
  const [triggerType, setTriggerType] = useState(workflow.triggerType);
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow.steps);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setErrors((prev) => ({ ...prev, name: '' }));
  };

  const handleTriggerChange = (value: string) => {
    setTriggerType(value);
  };

  const handleAddStep = () => {
    setIsAddModalOpen(true);
  };

  const handleSelectAction = (actionType: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      actionType: actionType as (typeof ACTION_TYPES)[number],
      configuration: getDefaultConfig(actionType),
      order: steps.length + 1,
    };
    setSteps([...steps, newStep]);
    setIsAddModalOpen(false);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep({ ...step });
  };

  const handleUpdateStep = (updatedStep: WorkflowStep) => {
    setSteps(steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)));
    setEditingStep(null);
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    // Reassign order
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setSteps(newSteps);
  };

  const handleSave = async () => {
    const validationErrors: Record<string, string> = {};
    if (!name.trim()) validationErrors.name = 'Workflow name is required';
    if (steps.length === 0) validationErrors.steps = 'At least one step is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const updatedWorkflow: Workflow = {
        ...workflow,
        name: name.trim(),
        triggerType,
        steps,
      };
      onChange(updatedWorkflow);
      if (onSave) {
        await onSave(updatedWorkflow);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workflow Builder</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleAddStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="workflow-name" className="text-sm font-medium">
                Workflow Name
              </label>
              <Input
                id="workflow-name"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter workflow name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="trigger-type" className="text-sm font-medium">
                Trigger Type
              </label>
              <Select value={triggerType} onValueChange={handleTriggerChange}>
                <SelectTrigger id="trigger-type">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatTriggerType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workflow Steps</h3>
              <span className="text-sm text-muted-foreground">
                {steps.length} step{steps.length !== 1 ? 's' : ''}
              </span>
            </div>

            {steps.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-input bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  No steps yet. Click "Add Step" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <Card
                    key={step.id}
                    className="group relative transition-shadow hover:shadow-md"
                    data-testid="step-card"
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <button
                        type="button"
                        className="cursor-grab text-muted-foreground hover:text-foreground"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{step.actionType}</Badge>
                          <span className="text-sm text-muted-foreground">Order: {step.order}</span>
                        </div>
                        {Object.keys(step.configuration).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {Object.entries(step.configuration)
                              .slice(0, 3)
                              .map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {String(value).slice(0, 30)}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                        >
                          ↓
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditStep(step)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {errors.steps && <p className="text-sm text-destructive">{errors.steps}</p>}
          </div>
        </CardContent>
        {errors.name && <CardFooter className="text-destructive">{errors.name}</CardFooter>}
      </Card>

      {/* Add Action Modal */}
      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add Action Step</ModalTitle>
            <ModalDescription>Select an action type to add to your workflow.</ModalDescription>
          </ModalHeader>
          <div className="grid grid-cols-2 gap-2 p-4">
            {ACTION_TYPES.map((type) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => handleSelectAction(type)}
                className="justify-start"
              >
                {type}
              </Button>
            ))}
          </div>
        </ModalContent>
      </Modal>

      {/* Edit Step Modal */}
      {editingStep && (
        <StepEditor
          step={editingStep}
          onSave={handleUpdateStep}
          onClose={() => setEditingStep(null)}
        />
      )}
    </div>
  );
};

function formatTriggerType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getDefaultConfig(actionType: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    SEND_EMAIL: { to: '', subject: '', body: '' },
    UPDATE_FIELD: { field: '', value: '' },
    CREATE_RECORD: { objectType: 'contact', data: {} },
    CREATE_TASK: { title: '', description: '' },
    CREATE_NOTE: { content: '', recordId: '' },
    WEBHOOK: { url: '', method: 'POST' },
    CODE: { code: '', language: 'javascript' },
    WAIT: { duration: 1000, unit: 'ms' },
    BRANCH: { condition: {}, trueBranch: [], falseBranch: [] },
    SEND_SMS: { to: '', message: '' },
    CREATE_DEAL: { title: '', amount: 0, stage: '' },
    CREATE_CONTACT: { email: '', firstName: '', lastName: '' },
  };
  return defaults[actionType] || {};
}

// Step Editor Modal Component
interface StepEditorProps {
  step: WorkflowStep;
  onSave: (step: WorkflowStep) => void;
  onClose: () => void;
}

const StepEditor: React.FC<StepEditorProps> = ({ step, onSave, onClose }) => {
  const [configuration, setConfiguration] = useState<Record<string, unknown>>(step.configuration);

  const handleChange = (key: string, value: unknown) => {
    setConfiguration({ ...configuration, [key]: value });
  };

  const handleSave = () => {
    onSave({ ...step, configuration });
  };

  return (
    <Modal open onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Edit {step.actionType} Step</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {renderConfigFields(step.actionType, configuration, handleChange)}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Step
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

function renderConfigFields(
  actionType: string,
  config: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void
): React.ReactNode {
  const fields: Record<string, { type: string; label: string }[]> = {
    SEND_EMAIL: [
      { name: 'to', type: 'text', label: 'To Email' },
      { name: 'subject', type: 'text', label: 'Subject' },
      { name: 'body', type: 'textarea', label: 'Body' },
    ],
    CREATE_TASK: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'description', type: 'textarea', label: 'Description' },
    ],
    WEBHOOK: [
      { name: 'url', type: 'text', label: 'URL' },
      {
        name: 'method',
        type: 'select',
        label: 'Method',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    ],
    WAIT: [{ name: 'duration', type: 'number', label: 'Duration (ms)' }],
    UPDATE_FIELD: [
      { name: 'field', type: 'text', label: 'Field Name' },
      { name: 'value', type: 'text', label: 'New Value' },
    ],
    CODE: [
      { name: 'code', type: 'textarea', label: 'Code' },
      { name: 'language', type: 'select', label: 'Language', options: ['javascript', 'python'] },
    ],
  };

  const fieldsToRender =
    fields[actionType] ||
    Object.keys(config).map((key) => ({
      name: key,
      type: 'text',
      label: key,
    }));

  return fieldsToRender.map((field) => (
    <div key={field.name} className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={(config[field.name] as string) || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          rows={3}
        />
      ) : field.type === 'select' && field.options ? (
        <Select
          value={(config[field.name] as string) || ''}
          onValueChange={(value) => onChange(field.name, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={field.type}
          value={(config[field.name] as string) || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      )}
    </div>
  ));
}

// Helper components for Modal (extracted from existing Modal component)
const Modal = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-lg rounded-lg shadow-lg">{children}</div>
    </div>
  );
};

const ModalContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const ModalHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b p-4">{children}</div>
);
const ModalTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);
const ModalDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);
const ModalBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('p-4', className)}>{children}</div>
);
const ModalFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn('flex justify-end space-x-2 border-t p-4', className)}>{children}</div>;
