import { Task, NewTask } from '../models/Task';
import BaseApiService from './BaseApiService';

interface TasksResponse {
  tasks: Task[];
  total?: number;
}

interface TaskResponse {
  task: Task;
}

/**
 * Service for task-related operations (real API integration)
 */
export const TaskService = {
  /**
   * Get all tasks for the current user
   */
  async getAllForUser(): Promise<Task[]> {
    const result = await BaseApiService.get<TasksResponse>('tasks');
    
    if (result.success && result.data) {
      return result.data.tasks;
    }
    
    console.error('Error fetching tasks:', result.message);
    return [];
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task | null> {
    const result = await BaseApiService.get<TaskResponse>(`tasks?id=${id}`);
    
    if (result.success && result.data) {
      return result.data.task;
    }
    
    console.error('Error fetching task:', result.message);
    return null;
  },

  /**
   * Create a new task
   */
  async create(task: NewTask): Promise<Task | null> {
    const result = await BaseApiService.post<TaskResponse>('tasks', task);
    
    if (result.success && result.data) {
      return result.data.task;
    }
    
    console.error('Error creating task:', result.message);
    return null;
  },

  /**
   * Update an existing task
   */
  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    const result = await BaseApiService.put<TaskResponse>('tasks', { id, ...updates });
    
    if (result.success && result.data) {
      return result.data.task;
    }
    
    console.error('Error updating task:', result.message);
    return null;
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<boolean> {
    const result = await BaseApiService.delete('tasks', { id });
    
    if (result.success) {
      return true;
    }
    
    console.error('Error deleting task:', result.message);
    return false;
  },

  /**
   * Mark task as completed
   */
  async markCompleted(id: string): Promise<Task | null> {
    return this.update(id, { 
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status: 'pending' | 'in_progress' | 'completed'): Promise<Task[]> {
    const allTasks = await this.getAllForUser();
    return allTasks.filter(task => task.status === status);
  },

  /**
   * Get tasks by priority
   */
  async getByPriority(priority: 'low' | 'medium' | 'high'): Promise<Task[]> {
    const allTasks = await this.getAllForUser();
    return allTasks.filter(task => task.priority === priority);
  },

  /**
   * Search tasks by title or description
   */
  async search(query: string): Promise<Task[]> {
    const allTasks = await this.getAllForUser();
    const lowerQuery = query.toLowerCase();
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description && task.description.toLowerCase().includes(lowerQuery))
    );
  }
};
