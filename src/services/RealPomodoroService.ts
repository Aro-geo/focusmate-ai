import axios from 'axios';

export interface PomodoroSession {
  id?: number;
  task: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  mode: 'focus' | 'short-break' | 'long-break';
  mood?: string;
  feedback?: string;
  completed: boolean;
}

export interface PomodoroAnalytics {
  totalSessions: number;
  totalFocusMinutes: number;
  averageSessionLength: number;
  dailyStats: Array<{
    date: string;
    sessions: number;
    focusMinutes: number;
    moods: string[];
  }>;
}

export class RealPomodoroService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  }

  /**
   * Create a new pomodoro session
   */
  async createSession(session: Omit<PomodoroSession, 'id'>): Promise<PomodoroSession> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<PomodoroSession>(
        `${this.apiUrl}/api/pomodoro`,
        session,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create session error:', error);
      throw new Error('Failed to create pomodoro session');
    }
  }

  /**
   * Get all pomodoro sessions
   */
  async getSessions(limit?: number): Promise<PomodoroSession[]> {
    try {
      const token = localStorage.getItem('token');
      const params = limit ? { limit } : {};
      
      const response = await axios.get<PomodoroSession[]>(
        `${this.apiUrl}/api/pomodoro`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw new Error('Failed to fetch pomodoro sessions');
    }
  }

  /**
   * Get session analytics
   */
  async getAnalytics(timeFrame: 'week' | 'month' | 'quarter' = 'week'): Promise<PomodoroAnalytics> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<PomodoroAnalytics>(
        `${this.apiUrl}/api/pomodoro/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { timeFrame }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get analytics error:', error);
      throw new Error('Failed to fetch pomodoro analytics');
    }
  }

  /**
   * Start a new pomodoro session (client-side tracking)
   */
  startSession(task: string, mode: 'focus' | 'short-break' | 'long-break' = 'focus'): PomodoroSession {
    const session: PomodoroSession = {
      task,
      startTime: new Date(),
      duration: this.getSessionDuration(mode),
      mode,
      completed: false
    };

    // Store in localStorage for client-side tracking
    localStorage.setItem('currentPomodoroSession', JSON.stringify(session));
    
    return session;
  }

  /**
   * Complete current session
   */
  async completeSession(mood?: string, feedback?: string): Promise<PomodoroSession | null> {
    try {
      const currentSessionData = localStorage.getItem('currentPomodoroSession');
      if (!currentSessionData) return null;

      const session: PomodoroSession = JSON.parse(currentSessionData);
      session.endTime = new Date();
      session.completed = true;
      session.mood = mood;
      session.feedback = feedback;

      // Save to backend
      const savedSession = await this.createSession(session);

      // Clear from localStorage
      localStorage.removeItem('currentPomodoroSession');

      return savedSession;
    } catch (error) {
      console.error('Complete session error:', error);
      throw new Error('Failed to complete pomodoro session');
    }
  }

  /**
   * Get current active session
   */
  getCurrentSession(): PomodoroSession | null {
    const currentSessionData = localStorage.getItem('currentPomodoroSession');
    if (!currentSessionData) return null;

    return JSON.parse(currentSessionData);
  }

  /**
   * Cancel current session
   */
  cancelSession(): void {
    localStorage.removeItem('currentPomodoroSession');
  }

  /**
   * Get default duration for session type
   */
  private getSessionDuration(mode: 'focus' | 'short-break' | 'long-break'): number {
    switch (mode) {
      case 'focus':
        return 25; // 25 minutes
      case 'short-break':
        return 5;  // 5 minutes
      case 'long-break':
        return 15; // 15 minutes
      default:
        return 25;
    }
  }
}

// Export singleton instance
export const realPomodoroService = new RealPomodoroService();