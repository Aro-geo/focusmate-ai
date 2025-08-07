/**
 * Pomodoro session model interfaces
 */

export interface PomodoroSession {
  id: number;
  user_id: number;
  task_id?: number;
  duration: number;
  mode: 'focus' | 'break' | 'long-break';
  mood?: string;
  start_time: Date;
  end_time?: Date;
  created_at: Date;
}

export interface NewPomodoroSession {
  user_id: number;
  task_id?: number;
  duration: number;
  mode: 'focus' | 'break' | 'long-break';
  mood?: string;
  start_time: Date;
  end_time?: Date;
}

export interface PomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  averageSession: number;
  completedSessions: number;
  streakDays: number;
  productivity: number;
}
