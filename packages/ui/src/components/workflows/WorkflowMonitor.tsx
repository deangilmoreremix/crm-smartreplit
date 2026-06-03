import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Loader2, ChevronDown, ChevronRight, Play, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggeredBy: Record<string, unknown>;
  context: Record<string, unknown>;
  results?: Record<string, unknown>;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  triggerType: string;
  enabled: boolean;
}

export interface WorkflowMonitorProps {
  workflowId: string;
  onRunWorkflow?: (workflowId: string) => Promise<void>;
  onDeleteRun?: (runId: string) => Promise<void>;
}

export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  workflowId,
  onRunWorkflow,
  onDeleteRun,
}) => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/runs`);
      const data = await response.json();
      setRuns(data.runs || []);
    } catch (error) {
      console.error('Failed to fetch workflow runs:', error);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [workflowId]);

  const handleRun = async () => {
    if (onRunWorkflow) {
      await onRunWorkflow(workflowId);
      fetchRuns();
    }
  };

  const handleDelete = async (runId: string) => {
    if (onDeleteRun) {
      await onDeleteRun(runId);
      fetchRuns();
    }
  };

  const toggleExpand = (runId: string) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  const getStatusBadgeVariant = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'default';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  const calculateDuration = (startedAt: Date, completedAt?: Date) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const duration = end - start;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Workflow Runs</CardTitle>
          <Button onClick={handleRun} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Play className="mr-2 h-4 w-4" />
            Test Run
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No workflow runs yet.</p>
            <p className="text-sm">Click "Test Run" to test this workflow.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleExpand(run.id)}
                >
                  <div className="flex items-center gap-4">
                    {expandedRun === run.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(run.status)}>
                          {run.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{formatDate(run.startedAt)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {calculateDuration(run.startedAt, run.completedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {onDeleteRun && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(run.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>

                {expandedRun === run.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Trigger Context</h4>
                        <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                          {JSON.stringify(run.triggeredBy, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Workflow Context</h4>
                        <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                          {JSON.stringify(run.context, null, 2)}
                        </pre>
                      </div>
                    </div>
                    {run.results && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Results</h4>
                        <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                          {JSON.stringify(run.results, null, 2)}
                        </pre>
                      </div>
                    )}
                    {run.errorMessage && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2 text-red-600">Error</h4>
                        <pre className="text-xs bg-red-50 p-2 rounded border border-red-200 text-red-700">
                          {run.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
