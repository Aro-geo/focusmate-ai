/**
 * Task model interfaces
 */

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  due_date?: Date | string;
  completed_at?: Date | string;
  created_at: Date | string;
  updated_at?: Date | string;
}

export interface NewTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: Date | string;
}
