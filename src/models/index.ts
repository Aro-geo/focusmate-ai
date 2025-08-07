// Re-export all model interfaces for convenient importing
export * from './User';
export * from './Task';
export * from './PomodoroSession';
export * from './JournalEntry';

// Legacy interfaces for backward compatibility
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  completed: boolean;
  created_at: Date;
}

export interface PomodoroSession {
  id: number;
  user_id: number;
  task_id?: number;
  duration: number;
  mode: string;
  mood?: string;
  start_time: Date;
  end_time?: Date;
}

export interface JournalEntry {
  id: number;
  user_id: number;
  content: string;
  mood?: string;
  tags?: string[];
  created_at: Date;
}
