import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowLog,
  WorkflowStats,
  WorkflowRunStatus,
} from '../../../packages/workflows/src/types';
import { useTheme } from '../../contexts/ThemeContext';

interface WorkflowMonitorProps {
  workflows: WorkflowDefinition[];
  onToggleWorkflow: (workflowId: string, isActive: boolean) => void;
  onEditWorkflow: (workflow: WorkflowDefinition) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

type TabType = 'active' | 'history' | 'logs';

export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  workflows,
  onToggleWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onRefresh,
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  const activeWorkflows = workflows.filter((w) => w.isActive);
  const inactiveWorkflows = workflows.filter((w) => !w.isActive);

  const handleSelectWorkflow = useCallback((workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
  }, []);

  const handleDeleteClick = useCallback((workflowId: string) => {
    setWorkflowToDelete(workflowId);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (workflowToDelete) {
      onDeleteWorkflow(workflowToDelete);
      setShowDeleteModal(false);
      setWorkflowToDelete(null);
    }
  }, [workflowToDelete, onDeleteWorkflow]);

  const getStatusBadge = (status: WorkflowRunStatus | boolean) => {
    if (typeof status === 'boolean') {
      return status ? (
        <Badge variant="success" size="sm">
          Active
        </Badge>
      ) : (
        <Badge variant="default" size="sm">
          Inactive
        </Badge>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm">
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="info" size="sm">
            Running
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="error" size="sm">
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="default" size="sm">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return 'In progress';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const tabs = [
    { id: 'active' as TabType, label: 'Active Workflows', count: activeWorkflows.length },
    { id: 'history' as TabType, label: 'History', count: executions.length },
    { id: 'logs' as TabType, label: 'Logs', count: logs.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Workflow Monitor
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Monitor and manage your workflow automations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onRefresh} disabled={isLoading}>
            <svg
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 p-1 rounded-xl ${
          isDark ? 'bg-gray-800/50' : 'bg-gray-100'
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'active' && (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3
                className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                No Workflows Yet
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Create your first workflow to automate your CRM processes
              </p>
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <GlassCard
                  key={workflow.id}
                  hover
                  onClick={() => handleSelectWorkflow(workflow)}
                  className={`p-4 cursor-pointer ${
                    selectedWorkflow?.id === workflow.id
                      ? isDark
                        ? 'ring-2 ring-blue-500/50'
                        : 'ring-2 ring-blue-400'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                          workflow.isActive
                            ? isDark
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-green-100 text-green-600'
                            : isDark
                              ? 'bg-gray-700/50 text-gray-400'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3
                            className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                          >
                            {workflow.name}
                          </h3>
                          {getStatusBadge(workflow.isActive)}
                        </div>
                        {workflow.description && (
                          <p
                            className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            {workflow.description}
                          </p>
                        )}
                        <div
                          className={`flex items-center gap-4 text-xs ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <span>🔔</span>
                            {workflow.trigger.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>⚡</span>
                            {workflow.actions.length} actions
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📊</span>
                            {workflow.runCount || 0} runs
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🕐</span>
                            {formatDate(workflow.lastRunAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWorkflow(workflow.id!, !workflow.isActive);
                        }}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          workflow.isActive
                            ? 'bg-green-600'
                            : isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            workflow.isActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWorkflow(workflow);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
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
                          handleDeleteClick(workflow.id!);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-red-900/30 text-red-500'
                            : 'hover:bg-red-50 text-red-500'
                        }`}
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
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {executions.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3
                className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                No Execution History
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Workflow execution history will appear here
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <GlassCard
                  key={execution.id}
                  hover
                  onClick={() => setSelectedExecution(execution)}
                  className={`p-4 cursor-pointer ${
                    selectedExecution?.id === execution.id
                      ? isDark
                        ? 'ring-2 ring-blue-500/50'
                        : 'ring-2 ring-blue-400'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          execution.status === 'completed'
                            ? isDark
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-green-100 text-green-600'
                            : execution.status === 'failed'
                              ? isDark
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-red-100 text-red-600'
                              : isDark
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {execution.status === 'completed' ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : execution.status === 'failed' ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                          >
                            {execution.workflowName}
                          </span>
                          {getStatusBadge(execution.status)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDate(execution.startedAt)} • Duration:{' '}
                          {formatDuration(execution.startedAt, execution.completedAt)}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {execution.results.length} actions
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3
                className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                No Logs Yet
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Workflow logs will appear here
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="p-0 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 border-b ${
                      isDark ? 'border-gray-800' : 'border-gray-100'
                    } ${index !== logs.length - 1 ? '' : 'border-b-0'}`}
                  >
                    <span
                      className={`mt-0.5 ${
                        log.level === 'error'
                          ? 'text-red-500'
                          : log.level === 'warn'
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                      }`}
                    >
                      {log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {log.message}
                      </p>
                      {log.metadata && (
                        <p
                          className={`text-xs mt-1 font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                        >
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {selectedExecution && (
        <Modal
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
          title="Execution Details"
        >
          <div className="p-4 space-y-4">
            <div
              className={`flex items-center justify-between p-3 rounded-lg ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}
            >
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                {getStatusBadge(selectedExecution.status)}
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDuration(selectedExecution.startedAt, selectedExecution.completedAt)}
                </p>
              </div>
            </div>

            {selectedExecution.errorMessage && (
              <div
                className={`p-3 rounded-lg ${
                  isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                }`}
              >
                <p className="font-medium">Error</p>
                <p className="text-sm">{selectedExecution.errorMessage}</p>
              </div>
            )}

            <div>
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Action Results ({selectedExecution.results.length})
              </h4>
              <div className="space-y-2">
                {selectedExecution.results.map((result, index) => (
                  <div
                    key={result.actionId}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isDark ? 'bg-gray-800/30' : 'bg-gray-50'
                    }`}
                  >
                    <span className={result.success ? 'text-green-500' : 'text-red-500'}>
                      {result.success ? '✓' : '✗'}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {result.actionType} #{index + 1}
                    </span>
                    {result.error && (
                      <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Workflow"
        >
          <div className="p-4">
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkflowMonitor;
