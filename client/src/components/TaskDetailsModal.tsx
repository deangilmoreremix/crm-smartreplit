import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Copy,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Tag,
  Link as LinkIcon,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTaskStore } from '../store/taskStore';
import { Task, SubTask, TaskAttachment } from '../types/task';

interface TaskDetailsModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: Task['status'];
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  defaultStatus,
}) => {
  const {
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    completeSubtask,
    addActivity,
    getActivitiesForEntity,
    templates,
    createTaskFromTemplate,
  } = useTaskStore();

  const [isEditing, setIsEditing] = useState(!task);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'other',
        status: defaultStatus || 'pending',
        priority: 'medium',
        assignedUserId: '',
        assignedUserName: '',
        contactId: '',
        dealId: '',
        dueDate: undefined,
        estimatedDuration: undefined,
        tags: [],
        attachments: [],
        subtasks: [],
        dependencies: [],
        reminders: [],
        customFields: {},
      });
    }
  }, [task, defaultStatus]);

  const activities = task ? getActivitiesForEntity('task', task.id) : [];

  const handleSave = async () => {
    if (!formData.title?.trim()) return;

    setIsLoading(true);
    try {
      if (task) {
        await updateTask(task.id, formData);
      } else {
        await addTask(formData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    setIsLoading(true);
    try {
      await deleteTask(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!task) return;
    
    setIsLoading(true);
    try {
      await duplicateTask(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to duplicate task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;

    try {
      await addSubtask(task.id, {
        title: newSubtask,
        status: 'pending',
      });
      setNewSubtask('');
      // Refresh task data
      const updatedTask = { ...task };
      setFormData(updatedTask);
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtask: SubTask) => {
    if (!task) return;

    try {
      if (subtask.status === 'completed') {
        await updateSubtask(task.id, subtask.id, { 
          status: 'pending',
          completedDate: undefined 
        });
      } else {
        await completeSubtask(task.id, subtask.id);
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;

    try {
      await deleteSubtask(task.id, subtaskId);
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const currentTags = formData.tags || [];
    if (!currentTags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...currentTags, newTag],
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    setFormData({
      ...formData,
      tags: currentTags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      await createTaskFromTemplate(templateId, {
        status: defaultStatus || 'pending',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create task from template:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {task ? (isEditing ? 'Edit Task' : 'Task Details') : 'Create New Task'}
            </DialogTitle>
            
            {task && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleDuplicate}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {!task && templates.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Quick Start Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="subtasks">
                Subtasks {task?.subtasks.length ? `(${task.subtasks.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="activity">
                Activity {activities.length ? `(${activities.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="attachments">
                Files {formData.attachments?.length ? `(${formData.attachments.length})` : ''}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as Task['type'] })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="administrative">Administrative</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignee">Assignee</Label>
                    <Input
                      id="assignee"
                      value={formData.assignedUserName || ''}
                      onChange={(e) => setFormData({ ...formData, assignedUserName: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter assignee name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-1 justify-start text-left font-normal"
                          disabled={!isEditing}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? 
                            format(formData.dueDate, 'PPP') : 
                            <span>Pick a date</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => {
                            setFormData({ ...formData, dueDate: date });
                            setShowCalendar(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      value={formData.estimatedDuration || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        estimatedDuration: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              {task && (
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  {task.createdAt && (
                    <div className="text-sm text-gray-500">
                      Created {format(task.createdAt, 'PPP')}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="subtasks" className="mt-6">
              <div className="space-y-4">
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add a subtask..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {(task?.subtasks || []).map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleSubtask(subtask)}
                          disabled={!isEditing}
                        >
                          {subtask.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        <span className={`${
                          subtask.status === 'completed' 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900'
                        }`}>
                          {subtask.title}
                        </span>
                      </div>

                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {(!task?.subtasks || task.subtasks.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Circle className="h-8 w-8 mx-auto mb-2" />
                      <p>No subtasks yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        by {activity.userName} • {format(activity.createdAt, 'PPp')}
                      </p>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>No activity yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              <div className="space-y-4">
                {isEditing && (
                  <Button variant="outline" className="w-full">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Add Attachment
                  </Button>
                )}

                <div className="space-y-2">
                  {(formData.attachments || []).map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.size} • {format(attachment.uploadedAt, 'PPp')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!formData.attachments || formData.attachments.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Paperclip className="h-8 w-8 mx-auto mb-2" />
                      <p>No attachments</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isEditing && (
            <Button 
              onClick={handleSave} 
              disabled={!formData.title?.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
