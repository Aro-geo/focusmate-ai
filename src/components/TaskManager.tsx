import React, { useState, useEffect } from 'react';
import { TaskService } from '../services/NewTaskService';
import { Task, NewTask } from '../models/Task';

interface TaskManagerProps {
  className?: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ className = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedTasks = await TaskService.getAllForUser();
      setTasks(loadedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const newTask: NewTask = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: 'medium',
        status: 'pending'
      };

      const createdTask = await TaskService.create(newTask);
      
      if (createdTask) {
        setTasks(prev => [createdTask, ...prev]);
        setNewTaskTitle('');
        setNewTaskDescription('');
      } else {
        setError('Failed to create task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updatedTask = await TaskService.update(task.id, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
      });

      if (updatedTask) {
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const success = await TaskService.delete(taskId);
      
      if (success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        setError('Failed to delete task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏳';
      default: return '📝';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <button
            onClick={loadTasks}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            {isLoading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">❌ {error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* New Task Form */}
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            disabled={isCreating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
          <textarea
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Description (optional)..."
            disabled={isCreating}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
          <div className="flex justify-end">
            <button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || isCreating}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? '⏳ Creating...' : '+ Add Task'}
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-4">
        {isLoading && tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">📝 No tasks yet</p>
            <p className="text-sm mt-2">Create your first task above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 border rounded-lg ${
                  task.status === 'completed' ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="mt-1 text-lg hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.estimated_duration && (
                          <span className="text-xs text-gray-500">
                            🕒 {task.estimated_duration}min
                          </span>
                        )}
                        {task.created_at && (
                          <span className="text-xs text-gray-400">
                            Created: {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {tasks.length > 0 && (
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total: {tasks.length} tasks</span>
            <span>
              Completed: {tasks.filter(t => t.status === 'completed').length} | 
              Pending: {tasks.filter(t => t.status === 'pending').length} | 
              In Progress: {tasks.filter(t => t.status === 'in_progress').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
