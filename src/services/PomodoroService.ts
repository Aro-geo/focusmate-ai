import { PomodoroSession, NewPomodoroSession, PomodoroStats } from '../models/PomodoroSession';
import axios from 'axios';

interface FocusSessionsApiResponse {
  success: boolean;
  sessions?: any[];
  session?: any;
  statistics?: any;
  message?: string;
}

/**
 * Service for Pomodoro session management (real API integration)
 */
export const PomodoroService = {
  apiUrl: process.env.REACT_APP_API_URL || '/.netlify/functions',

  /**
   * Get authentication headers with JWT token
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  },

  /**
   * Get all sessions for current user
   */
  async getAllSessions(userId: number): Promise<PomodoroSession[]> {
    try {
      const response = await axios.get<FocusSessionsApiResponse>(`${this.apiUrl}/focus-sessions`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.sessions) {
        return response.data.sessions.map(session => ({
          id: session.id,
          user_id: session.user_id,
          duration: session.duration_minutes,
          mode: 'focus' as const,
          start_time: new Date(session.started_at),
          end_time: session.completed_at ? new Date(session.completed_at) : undefined,
          created_at: new Date(session.created_at || session.started_at),
          mood: session.notes || undefined,
          task_id: session.task_id || undefined
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  },

  /**
   * Get session by ID
   */
  async getById(id: number): Promise<PomodoroSession | null> {
    const sessions = await this.getAllForUser(1);
    return sessions.find(session => session.id === id) || null;
  },

  /**
   * Create a new session (mock implementation)
   */
  async create(session: NewPomodoroSession): Promise<PomodoroSession> {
    // Mock implementation - in a real app, this would call an API
    const newSession: PomodoroSession = {
      id: Date.now(),
      user_id: session.user_id,
      task_id: session.task_id || null,
      duration: session.duration,
      mode: session.mode,
      mood: session.mood || null,
      start_time: session.start_time,
      end_time: session.end_time || null,
      created_at: new Date()
    };
    return newSession;
  },

  /**
   * Update a session (mock implementation)
   */
  async update(id: number, session: Partial<PomodoroSession>): Promise<PomodoroSession | null> {
    // Mock implementation - in a real app, this would call an API
    const existingSession = await this.getById(id);
    if (!existingSession) return null;
    
    return {
      ...existingSession,
      ...session,
      id: existingSession.id,
      created_at: existingSession.created_at
    };
  },

  /**
   * End a session (mock implementation)
   */
  async endSession(id: number, mood?: string): Promise<PomodoroSession | null> {
    // Mock implementation - in a real app, this would call an API
    const existingSession = await this.getById(id);
    if (!existingSession) return null;
    
    return {
      ...existingSession,
      end_time: new Date(),
      mood: mood || existingSession.mood
    };
  },

  /**
   * Get user's statistics (mock implementation)
   */
  async getUserStats(userId: number): Promise<any> {
    // Mock implementation - in a real app, this would call an API
    return {
      total_sessions: 15,
      total_minutes: 375,
      avg_duration: 25,
      focus_sessions: 12,
      break_sessions: 3
    };
  }
};
