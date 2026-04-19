import React, { useState, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  WorkflowDefinition,
  WorkflowTrigger,
  WorkflowAction,
  TriggerConfig,
  ActionConfig,
  ConditionGroup,
  WorkflowCondition,
  ConditionOperator,
  LogicalOperator,
} from '../../../packages/workflows/src/types';
import { useTheme } from '../../contexts/ThemeContext';

interface WorkflowBuilderProps {
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onCancel: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const TRIGGER_OPTIONS = [
  { value: WorkflowTrigger.CONTACT_CREATED, label: 'Contact Created', icon: '👤' },
  { value: WorkflowTrigger.DEAL_STAGE_CHANGED, label: 'Deal Stage Changed', icon: '📊' },
  { value: WorkflowTrigger.EMAIL_SENT, label: 'Email Sent', icon: '📧' },
  { value: WorkflowTrigger.SCHEDULED, label: 'Scheduled', icon: '⏰' },
  { value: WorkflowTrigger.FORM_SUBMITTED, label: 'Form Submitted', icon: '📝' },
  { value: WorkflowTrigger.MANUAL, label: 'Manual', icon: '▶️' },
];

const ACTION_OPTIONS = [
  { value: WorkflowAction.SEND_EMAIL, label: 'Send Email', icon: '📧' },
  { value: WorkflowAction.UPDATE_FIELD, label: 'Update Field', icon: '✏️' },
  { value: WorkflowAction.CREATE_TASK, label: 'Create Task', icon: '✅' },
  { value: WorkflowAction.WEBHOOK, label: 'Webhook', icon: '🔗' },
  { value: WorkflowAction.NOTIFY, label: 'Notify', icon: '🔔' },
  { value: WorkflowAction.SCORE_CONTACT, label: 'Score Contact', icon: '📈' },
  { value: WorkflowAction.ADD_TAG, label: 'Add Tag', icon: '🏷️' },
  { value: WorkflowAction.UPDATE_DEAL_STAGE, label: 'Update Deal Stage', icon: '📊' },
];

const CONDITION_OPERATORS = [
  { value: ConditionOperator.EQUALS, label: 'Equals' },
  { value: ConditionOperator.NOT_EQUALS, label: 'Not Equals' },
  { value: ConditionOperator.CONTAINS, label: 'Contains' },
  { value: ConditionOperator.NOT_CONTAINS, label: 'Does Not Contain' },
  { value: ConditionOperator.GREATER_THAN, label: 'Greater Than' },
  { value: ConditionOperator.LESS_THAN, label: 'Less Than' },
  { value: ConditionOperator.IS_EMPTY, label: 'Is Empty' },
  { value: ConditionOperator.IS_NOT_EMPTY, label: 'Is Not Empty' },
];

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflow,
  onSave,
  onCancel,
  isOpen = true,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [trigger, setTrigger] = useState<TriggerConfig>(
    workflow?.trigger || { type: WorkflowTrigger.MANUAL }
  );
  const [actions, setActions] = useState<ActionConfig[]>(workflow?.actions || []);
  const [isActive, setIsActive] = useState(workflow?.isActive || false);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionConfig | null>(null);

  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddAction = useCallback(
    (actionType: WorkflowAction) => {
      const newAction: ActionConfig = {
        id: generateId(),
        type: actionType,
        order: actions.length,
        config: getDefaultConfig(actionType),
      };
      setActions((prev) => [...prev, newAction]);
      setEditingAction(newAction);
      setShowActionModal(true);
    },
    [actions.length]
  );

  const getDefaultConfig = (actionType: WorkflowAction): Record<string, unknown> => {
    switch (actionType) {
      case WorkflowAction.SEND_EMAIL:
        return { to: '{{contact.email}}', subject: '', body: '' };
      case WorkflowAction.UPDATE_FIELD:
        return { objectType: 'contact', field: '', value: '' };
      case WorkflowAction.CREATE_TASK:
        return { title: '', description: '', status: 'pending', priority: 'medium' };
      case WorkflowAction.WEBHOOK:
        return { url: '', method: 'POST', headers: {}, body: {} };
      case WorkflowAction.NOTIFY:
        return { type: 'in_app', recipient: '', message: '' };
      case WorkflowAction.SCORE_CONTACT:
        return { scoreType: 'lead', increment: 10 };
      case WorkflowAction.ADD_TAG:
      case WorkflowAction.REMOVE_TAG:
        return { tag: '' };
      case WorkflowAction.UPDATE_DEAL_STAGE:
        return { stage: '', probability: 0 };
      default:
        return {};
    }
  };

  const handleUpdateAction = useCallback((updatedAction: ActionConfig) => {
    setActions((prev) => prev.map((a) => (a.id === updatedAction.id ? updatedAction : a)));
    setShowActionModal(false);
    setEditingAction(null);
  }, []);

  const handleDeleteAction = useCallback((actionId: string) => {
    setActions((prev) => prev.filter((a) => a.id !== actionId));
    setSelectedActionIndex(null);
  }, []);

  const handleMoveAction = useCallback((index: number, direction: 'up' | 'down') => {
    setActions((prev) => {
      const newActions = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newActions.length) {
        [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
        return newActions.map((a, i) => ({ ...a, order: i }));
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(() => {
    const workflowDefinition: WorkflowDefinition = {
      id: workflow?.id,
      name,
      description,
      trigger,
      actions,
      isActive,
      workspaceId: workflow?.workspaceId,
      createdBy: workflow?.createdBy,
      createdAt: workflow?.createdAt,
      updatedAt: new Date(),
      lastRunAt: workflow?.lastRunAt,
      runCount: workflow?.runCount,
    };
    onSave(workflowDefinition);
  }, [workflow, name, description, trigger, actions, isActive, onSave]);

  const selectedAction = selectedActionIndex !== null ? actions[selectedActionIndex] : null;

  const getActionIcon = (actionType: WorkflowAction) => {
    const option = ACTION_OPTIONS.find((o) => o.value === actionType);
    return option?.icon || '⚡';
  };

  const getActionLabel = (actionType: WorkflowAction) => {
    const option = ACTION_OPTIONS.find((o) => o.value === actionType);
    return option?.label || actionType;
  };

  const getTriggerIcon = (triggerType: WorkflowTrigger | string) => {
    const option = TRIGGER_OPTIONS.find((o) => o.value === triggerType);
    return option?.icon || '⚡';
  };

  const getTriggerLabel = (triggerType: WorkflowTrigger | string) => {
    const option = TRIGGER_OPTIONS.find((o) => o.value === triggerType);
    return option?.label || triggerType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          isDark ? 'bg-gray-900/90' : 'bg-white/90'
        } backdrop-blur-xl`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200/20 dark:border-gray-700/30">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {workflow ? 'Edit Workflow' : 'Create Workflow'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Build automation workflows with triggers, conditions, and actions
            </p>
          </div>
          <button
            onClick={onClose || onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          <div className="w-80 border-r border-gray-200/20 dark:border-gray-700/30 overflow-y-auto p-4">
            <div className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Workflow Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome New Contacts"
                  className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Trigger
                </label>
                <div className="space-y-2">
                  {TRIGGER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTrigger({ type: option.value as WorkflowTrigger })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        trigger.type === option.value
                          ? isDark
                            ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                            : 'bg-blue-50 border border-blue-200 text-blue-700'
                          : isDark
                            ? 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-gray-600'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Active
                </label>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Actions ({actions.length})
                </h3>
                <div className="relative group">
                  <Button variant="primary" size="sm">
                    + Add Action
                  </Button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="p-2">
                      {ACTION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAddAction(option.value)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {actions.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center h-full ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  <div className="text-6xl mb-4">⚡</div>
                  <p className="text-lg font-medium">No actions yet</p>
                  <p className="text-sm">Add actions to automate your workflow</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <GlassCard
                      key={action.id}
                      hover
                      onClick={() => setSelectedActionIndex(index)}
                      className={`p-4 ${
                        selectedActionIndex === index
                          ? isDark
                            ? 'ring-2 ring-blue-500/50'
                            : 'ring-2 ring-blue-400'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                            isDark ? 'bg-gray-800' : 'bg-gray-100'
                          }`}
                        >
                          <span className="text-xl">{getActionIcon(action.type)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                            >
                              {getActionLabel(action.type)}
                            </span>
                            <Badge
                              variant={action.success !== false ? 'success' : 'error'}
                              size="sm"
                            >
                              Step {index + 1}
                            </Badge>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {getActionSummary(action)}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveAction(index, 'up');
                            }}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveAction(index, 'down');
                            }}
                            disabled={index === actions.length - 1}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAction(action);
                              setShowActionModal(true);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAction(action.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedAction && (
            <div className="w-96 border-l border-gray-200/20 dark:border-gray-700/30 overflow-y-auto p-4">
              <h3
                className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Action Details
              </h3>
              <ActionConfigPanel
                action={selectedAction}
                onUpdate={handleUpdateAction}
                isDark={isDark}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/20 dark:border-gray-700/30">
          <Button variant="ghost" onClick={onClose || onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {workflow ? 'Update Workflow' : 'Create Workflow'}
          </Button>
        </div>
      </div>

      {showActionModal && editingAction && (
        <Modal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setEditingAction(null);
          }}
          title={`Configure ${getActionLabel(editingAction.type)}`}
        >
          <ActionConfigForm
            action={editingAction}
            onSave={(updatedAction) => {
              handleUpdateAction(updatedAction);
              setShowActionModal(false);
              setEditingAction(null);
            }}
            onCancel={() => {
              setShowActionModal(false);
              setEditingAction(null);
            }}
            isDark={isDark}
          />
        </Modal>
      )}
    </div>
  );
};

interface ActionConfigPanelProps {
  action: ActionConfig;
  onUpdate: (action: ActionConfig) => void;
  isDark: boolean;
}

const ActionConfigPanel: React.FC<ActionConfigPanelProps> = ({ action, onUpdate, isDark }) => {
  const renderConfig = () => {
    const config = action.config as Record<string, unknown>;

    switch (action.type) {
      case WorkflowAction.SEND_EMAIL:
        return (
          <div className="space-y-3">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                To
              </label>
              <Input
                value={(config.to as string) || ''}
                onChange={(e) => onUpdate({ ...action, config: { ...config, to: e.target.value } })}
                placeholder="{{contact.email}}"
                className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Subject
              </label>
              <Input
                value={(config.subject as string) || ''}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, subject: e.target.value } })
                }
                className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Body
              </label>
              <textarea
                value={(config.body as string) || ''}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, body: e.target.value } })
                }
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>
          </div>
        );

      case WorkflowAction.CREATE_TASK:
        return (
          <div className="space-y-3">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Title
              </label>
              <Input
                value={(config.title as string) || ''}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, title: e.target.value } })
                }
                className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Description
              </label>
              <textarea
                value={(config.description as string) || ''}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, description: e.target.value } })
                }
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Status
                </label>
                <select
                  value={(config.status as string) || 'pending'}
                  onChange={(e) =>
                    onUpdate({ ...action, config: { ...config, status: e.target.value } })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Priority
                </label>
                <select
                  value={(config.priority as string) || 'medium'}
                  onChange={(e) =>
                    onUpdate({ ...action, config: { ...config, priority: e.target.value } })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        );

      case WorkflowAction.WEBHOOK:
        return (
          <div className="space-y-3">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                URL
              </label>
              <Input
                value={(config.url as string) || ''}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, url: e.target.value } })
                }
                placeholder="https://api.example.com/webhook"
                className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Method
              </label>
              <select
                value={(config.method as string) || 'POST'}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, method: e.target.value } })
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        );

      case WorkflowAction.NOTIFY:
        return (
          <div className="space-y-3">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Type
              </label>
              <select
                value={(config.type as string) || 'in_app'}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, type: e.target.value } })
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              >
                <option value="in_app">In App</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Message
              </label>
              <textarea
                value={(config.message as string) || ''}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, message: e.target.value } })
                }
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>
          </div>
        );

      case WorkflowAction.SCORE_CONTACT:
        return (
          <div className="space-y-3">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Score Type
              </label>
              <select
                value={(config.scoreType as string) || 'lead'}
                onChange={(e) =>
                  onUpdate({ ...action, config: { ...config, scoreType: e.target.value } })
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              >
                <option value="lead">Lead Score</option>
                <option value="engagement">Engagement Score</option>
                <option value="health">Health Score</option>
              </select>
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Increment By
              </label>
              <Input
                type="number"
                value={(config.increment as number) || 10}
                onChange={(e) =>
                  onUpdate({
                    ...action,
                    config: { ...config, increment: parseInt(e.target.value) },
                  })
                }
                className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
              />
            </div>
          </div>
        );

      default:
        return (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Configure {action.type} action
          </p>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderConfig()}
      <div>
        <label
          className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Delay (ms)
        </label>
        <Input
          type="number"
          value={action.delay || 0}
          onChange={(e) => onUpdate({ ...action, delay: parseInt(e.target.value) || 0 })}
          placeholder="0"
          className={isDark ? 'bg-gray-800/50 border-gray-700 text-white' : ''}
        />
      </div>
    </div>
  );
};

interface ActionConfigFormProps {
  action: ActionConfig;
  onSave: (action: ActionConfig) => void;
  onCancel: () => void;
  isDark: boolean;
}

const ActionConfigForm: React.FC<ActionConfigFormProps> = ({
  action,
  onSave,
  onCancel,
  isDark,
}) => {
  const [config, setConfig] = useState(action.config as Record<string, unknown>);

  const handleSave = () => {
    onSave({ ...action, config });
  };

  return (
    <div className="p-4">
      <ActionConfigPanel
        action={{ ...action, config }}
        onUpdate={(a) => setConfig(a.config as Record<string, unknown>)}
        isDark={isDark}
      />
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

function getActionSummary(action: ActionConfig): string {
  const config = action.config as Record<string, unknown>;
  switch (action.type) {
    case WorkflowAction.SEND_EMAIL:
      return `To: ${config.to || '{{contact.email}}'} | Subject: ${config.subject || 'Untitled'}`;
    case WorkflowAction.CREATE_TASK:
      return `Title: ${config.title || 'Untitled Task'}`;
    case WorkflowAction.WEBHOOK:
      return `${config.method || 'POST'} ${config.url || 'No URL'}`;
    case WorkflowAction.NOTIFY:
      return `${config.type || 'in_app'}: ${(config.message as string)?.slice(0, 30) || 'No message'}...`;
    case WorkflowAction.SCORE_CONTACT:
      return `${config.scoreType || 'lead'} score ${config.increment ? `+${config.increment}` : ''}`;
    case WorkflowAction.ADD_TAG:
      return `Add tag: ${config.tag || 'No tag'}`;
    case WorkflowAction.REMOVE_TAG:
      return `Remove tag: ${config.tag || 'No tag'}`;
    case WorkflowAction.UPDATE_DEAL_STAGE:
      return `Stage: ${config.stage || 'Not set'}`;
    case WorkflowAction.UPDATE_FIELD:
      return `${config.field || 'Field'}: ${config.value || 'Not set'}`;
    default:
      return 'Configure this action';
  }
}

export default WorkflowBuilder;
