// Shared Worker for heavy computations
// This file should be placed in public/ directory as shared-worker.js

/*
export const sharedWorkerCode = `
class SharedWorkerManager {
  private static instance: SharedWorkerManager;
  private workers: Map<string, SharedWorker> = new Map();
  private taskQueue: Map<string, any[]> = new Map();
  private activeTasks: Map<string, any> = new Map();

  static getInstance(): SharedWorkerManager {
    if (!SharedWorkerManager.instance) {
      SharedWorkerManager.instance = new SharedWorkerManager();
    }
    return SharedWorkerManager.instance;
  }

  private constructor() {
    this.initializeDefaultWorkers();
  }

  private initializeDefaultWorkers(): void {
    // Data processing worker
    this.createWorker('data-processor', '/shared-worker.js');

    // AI computation worker
    this.createWorker('ai-processor', '/ai-worker.js');

    // Analytics worker
    this.createWorker('analytics-processor', '/analytics-worker.js');
  }

  private createWorker(name: string, scriptUrl: string): SharedWorker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new SharedWorker(scriptUrl, { name });
    this.workers.set(name, worker);
    this.taskQueue.set(name, []);
    this.activeTasks.set(name, null);

    worker.port.onmessage = (event) => {
      this.handleWorkerMessage(name, event.data);
    };

    worker.port.onmessageerror = (error) => {
      console.error(\`Worker \${name} message error:\`, error);
    };

    // Start the worker
    worker.port.start();

    return worker;
  }

  private handleWorkerMessage(workerName: string, message: any): void {
    const { type, taskId, result, error } = message;

    if (type === 'TASK_COMPLETE') {
      this.completeTask(workerName, taskId, result);
    } else if (type === 'TASK_ERROR') {
      this.failTask(workerName, taskId, error);
    } else if (type === 'WORKER_READY') {
      this.processQueue(workerName);
    }
  }

  private completeTask(workerName: string, taskId: string, result: any): void {
    const activeTask = this.activeTasks.get(workerName);
    if (activeTask && activeTask.id === taskId) {
      activeTask.resolve(result);
      this.activeTasks.set(workerName, null);
      this.processQueue(workerName);
    }
  }

  private failTask(workerName: string, taskId: string, error: any): void {
    const activeTask = this.activeTasks.get(workerName);
    if (activeTask && activeTask.id === taskId) {
      activeTask.reject(error);
      this.activeTasks.set(workerName, null);
      this.processQueue(workerName);
    }
  }

  private processQueue(workerName: string): void {
    const queue = this.taskQueue.get(workerName) || [];
    const activeTask = this.activeTasks.get(workerName);

    if (!activeTask && queue.length > 0) {
      const task = queue.shift();
      this.activeTasks.set(workerName, task);
      this.sendToWorker(workerName, task.message);
    }
  }

  private sendToWorker(workerName: string, message: any): void {
    const worker = this.workers.get(workerName);
    if (worker) {
      worker.port.postMessage(message);
    }
  }

  // Public API
  async executeTask(workerName: string, task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      const taskMessage = { ...task, id: taskId };

      const queuedTask = {
        id: taskId,
        message: taskMessage,
        resolve,
        reject
      };

      const queue = this.taskQueue.get(workerName) || [];
      queue.push(queuedTask);
      this.taskQueue.set(workerName, queue);

      this.processQueue(workerName);
    });
  }

  // Convenience methods for common tasks
  async processContacts(contacts: any[]): Promise<any> {
    return this.executeTask('data-processor', {
      type: 'PROCESS_CONTACTS',
      data: contacts
    });
  }

  async analyzeData(data: any, analysisType: string): Promise<any> {
    return this.executeTask('analytics-processor', {
      type: 'ANALYZE_DATA',
      data,
      analysisType
    });
  }

  async runAIInference(model: string, input: any): Promise<any> {
    return this.executeTask('ai-processor', {
      type: 'AI_INFERENCE',
      model,
      input
    });
  }

  async calculateEmbeddings(texts: string[]): Promise<any> {
    return this.executeTask('ai-processor', {
      type: 'CALCULATE_EMBEDDINGS',
      texts
    });
  }

  async processBulkData(data: any[], operation: string): Promise<any> {
    return this.executeTask('data-processor', {
      type: 'BULK_PROCESS',
      data,
      operation
    });
  }

  getWorkerStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, queue] of this.taskQueue) {
      const activeTask = this.activeTasks.get(name);
      stats[name] = {
        queueLength: queue.length,
        hasActiveTask: !!activeTask,
        activeTaskId: activeTask?.id || null
      };
    }

    return stats;
  }

  terminateWorker(workerName: string): void {
    const worker = this.workers.get(workerName);
    if (worker) {
      worker.port.postMessage({ type: 'TERMINATE' });
      this.workers.delete(workerName);
      this.taskQueue.delete(workerName);
      this.activeTasks.delete(workerName);
    }
  }

  terminateAllWorkers(): void {
    for (const name of this.workers.keys()) {
      this.terminateWorker(name);
    }
  }

  private generateTaskId(): string {
    return \`task_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
}

// Create singleton instance
export const sharedWorkerManager = SharedWorkerManager.getInstance();

// React hook for using shared workers
import { useCallback } from 'react';

export function useSharedWorker() {
  const executeTask = useCallback((workerName: string, task: any) => {
    return sharedWorkerManager.executeTask(workerName, task);
  }, []);

  const processContacts = useCallback((contacts: any[]) => {
    return sharedWorkerManager.processContacts(contacts);
  }, []);

  const analyzeData = useCallback((data: any, analysisType: string) => {
    return sharedWorkerManager.analyzeData(data, analysisType);
  }, []);

  const runAIInference = useCallback((model: string, input: any) => {
    return sharedWorkerManager.runAIInference(model, input);
  }, []);

  return {
    executeTask,
    processContacts,
    analyzeData,
    runAIInference,
    calculateEmbeddings: sharedWorkerManager.calculateEmbeddings.bind(sharedWorkerManager),
    processBulkData: sharedWorkerManager.processBulkData.bind(sharedWorkerManager),
    getStats: sharedWorkerManager.getWorkerStats.bind(sharedWorkerManager)
  };
}
`;

// Export the code as a string for creating the actual worker file
export { sharedWorkerCode };
*/

// Client-side Shared Worker Manager
import { unifiedEventSystem } from './unifiedEventSystem';

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

class SharedWorkerManager {
  private static instance: SharedWorkerManager;
  private workers: Map<string, SharedWorker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private processingTasks: Set<string> = new Set();
  private taskCallbacks: Map<string, { resolve: Function; reject: Function }> = new Map();

  static getInstance(): SharedWorkerManager {
    if (!SharedWorkerManager.instance) {
      SharedWorkerManager.instance = new SharedWorkerManager();
    }
    return SharedWorkerManager.instance;
  }

  private constructor() {
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Create data processing worker
    this.createWorker('data-processor', '/shared-data-worker.js');

    // Create AI processing worker
    this.createWorker('ai-processor', '/shared-ai-worker.js');

    // Create analytics worker
    this.createWorker('analytics-processor', '/shared-analytics-worker.js');
  }

  private createWorker(name: string, scriptUrl: string): void {
    try {
      const worker = new SharedWorker(scriptUrl, { name });
      this.workers.set(name, worker);

      worker.port.onmessage = (event) => {
        this.handleWorkerMessage(name, event.data);
      };

      worker.port.onmessageerror = (error) => {
        console.error(`Worker ${name} message error:`, error);
        this.handleWorkerError(name, error);
      };

      worker.port.start();

      // Notify worker that it's ready
      worker.port.postMessage({ type: 'WORKER_INIT', workerName: name });
    } catch (error) {
      console.error(`Failed to create worker ${name}:`, error);
      unifiedEventSystem.emit({
        type: 'WORKER_CREATION_FAILED',
        source: 'sharedWorkerManager',
        data: { workerName: name, error: error instanceof Error ? error.message : String(error) },
        priority: 'high'
      });
    }
  }

  private handleWorkerMessage(workerName: string, message: any): void {
    const { type, taskId, result, error, executionTime } = message;

    if (type === 'TASK_COMPLETE') {
      this.completeTask(taskId, result, executionTime);
    } else if (type === 'TASK_ERROR') {
      this.failTask(taskId, error);
    } else if (type === 'WORKER_READY') {
      this.processQueue();
    } else if (type === 'WORKER_STATUS') {
      unifiedEventSystem.emit({
        type: 'WORKER_STATUS_UPDATE',
        source: 'sharedWorkerManager',
        data: { workerName, status: message.status },
        priority: 'low'
      });
    }
  }

  private handleWorkerError(workerName: string, error: any): void {
    unifiedEventSystem.emit({
      type: 'WORKER_ERROR',
      source: 'sharedWorkerManager',
      data: { workerName, error: error instanceof Error ? error.message : String(error) },
      priority: 'high'
    });
  }

  private completeTask(taskId: string, result: any, executionTime: number): void {
    const callback = this.taskCallbacks.get(taskId);
    if (callback) {
      this.processingTasks.delete(taskId);
      this.taskCallbacks.delete(taskId);
      callback.resolve({ taskId, success: true, data: result, executionTime });

      unifiedEventSystem.emit({
        type: 'WORKER_TASK_COMPLETED',
        source: 'sharedWorkerManager',
        data: { taskId, executionTime },
        priority: 'low'
      });

      this.processQueue();
    }
  }

  private failTask(taskId: string, error: any): void {
    const callback = this.taskCallbacks.get(taskId);
    if (callback) {
      this.processingTasks.delete(taskId);
      this.taskCallbacks.delete(taskId);
      callback.reject({ taskId, success: false, error: error instanceof Error ? error.message : String(error) });

      unifiedEventSystem.emit({
        type: 'WORKER_TASK_FAILED',
        source: 'sharedWorkerManager',
        data: { taskId, error: error instanceof Error ? error.message : String(error) },
        priority: 'medium'
      });

      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0 || this.processingTasks.size >= 3) {
      return;
    }

    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const task = this.taskQueue.shift();
    if (task) {
      this.executeTaskInternal(task);
    }
  }


  private getWorkerForTask(taskType: string): string {
    if (taskType.startsWith('AI_') || taskType.includes('EMBEDDING')) {
      return 'ai-processor';
    } else if (taskType.startsWith('ANALYTICS_') || taskType.includes('CHART')) {
      return 'analytics-processor';
    } else {
      return 'data-processor';
    }
  }

  private executeTaskInternal(task: WorkerTask): void {
    // Find available worker for this task type
    const workerName = this.getWorkerForTask(task.type);
    const worker = this.workers.get(workerName);

    if (!worker) {
      console.error(`No worker available for task type: ${task.type}`);
      this.failTask(task.id, `No worker available for task type: ${task.type}`);
      return;
    }

    this.processingTasks.add(task.id);

    try {
      worker.port.postMessage({
        type: 'EXECUTE_TASK',
        taskId: task.id,
        taskType: task.type,
        data: task.data
      });
    } catch (error) {
      console.error('Failed to send task to worker:', error);
      this.failTask(task.id, error instanceof Error ? error.message : String(error));
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  public async executeTask(type: string, data: any, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      const task: WorkerTask = { id: taskId, type, data, priority };

      this.taskCallbacks.set(taskId, { resolve, reject });
      this.taskQueue.push(task);

      this.processQueue();
    });
  }

  // Convenience methods
  async processContacts(contacts: any[]): Promise<WorkerResult> {
    return this.executeTask('PROCESS_CONTACTS', contacts, 'high');
  }

  async analyzeData(data: any, analysisType: string): Promise<WorkerResult> {
    return this.executeTask(`ANALYTICS_${analysisType.toUpperCase()}`, data, 'medium');
  }

  async runAIInference(model: string, input: any): Promise<WorkerResult> {
    return this.executeTask('AI_INFERENCE', { model, input }, 'high');
  }

  async calculateEmbeddings(texts: string[]): Promise<WorkerResult> {
    return this.executeTask('CALCULATE_EMBEDDINGS', texts, 'high');
  }

  async processBulkData(data: any[], operation: string): Promise<WorkerResult> {
    return this.executeTask('BULK_PROCESS', { data, operation }, 'medium');
  }

  async generateChart(data: any, chartType: string): Promise<WorkerResult> {
    return this.executeTask('GENERATE_CHART', { data, chartType }, 'low');
  }

  getStats(): {
    queueLength: number;
    processingTasks: number;
    availableWorkers: number;
    workerStatus: Record<string, boolean>;
  } {
    const workerStatus: Record<string, boolean> = {};
    Array.from(this.workers.entries()).forEach(([name, worker]) => {
      workerStatus[name] = true; // Assume alive if exists
    });

    return {
      queueLength: this.taskQueue.length,
      processingTasks: this.processingTasks.size,
      availableWorkers: this.workers.size,
      workerStatus
    };
  }

  terminateWorker(workerName: string): void {
    const worker = this.workers.get(workerName);
    if (worker) {
      worker.port.postMessage({ type: 'TERMINATE' });
      this.workers.delete(workerName);
    }
  }

  terminateAllWorkers(): void {
    Array.from(this.workers.keys()).forEach(name => {
      this.terminateWorker(name);
    });
  }
}

// Create singleton instance
export const sharedWorkerManager = SharedWorkerManager.getInstance();

// React hook for using shared workers
import { useCallback } from 'react';

export function useSharedWorker() {
  const executeTask = useCallback((type: string, data: any, priority?: 'low' | 'medium' | 'high') => {
    return sharedWorkerManager.executeTask(type, data, priority);
  }, []);

  const processContacts = useCallback((contacts: any[]) => {
    return sharedWorkerManager.processContacts(contacts);
  }, []);

  const analyzeData = useCallback((data: any, analysisType: string) => {
    return sharedWorkerManager.analyzeData(data, analysisType);
  }, []);

  const runAIInference = useCallback((model: string, input: any) => {
    return sharedWorkerManager.runAIInference(model, input);
  }, []);

  return {
    executeTask,
    processContacts,
    analyzeData,
    runAIInference,
    calculateEmbeddings: sharedWorkerManager.calculateEmbeddings.bind(sharedWorkerManager),
    processBulkData: sharedWorkerManager.processBulkData.bind(sharedWorkerManager),
    generateChart: sharedWorkerManager.generateChart.bind(sharedWorkerManager),
    getStats: sharedWorkerManager.getStats.bind(sharedWorkerManager)
  };
}