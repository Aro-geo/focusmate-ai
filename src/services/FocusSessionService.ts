import BaseApiService from './BaseApiService';

export interface FocusSession {
  id: string;
  user_id: string;
  session_type: 'pomodoro' | 'focus' | 'break' | 'custom';
  duration_minutes: number;
  started_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface SessionStatistics {
  total_sessions: number;
  total_minutes: number;
  avg_duration: number;
  completed_sessions: number;
}

interface SessionsResponse {
  sessions: FocusSession[];
  statistics: SessionStatistics;
}

interface SessionResponse {
  session: FocusSession;
}

export interface NewSession {
  session_type: 'pomodoro' | 'focus' | 'break' | 'custom';
  duration_minutes: number;
  started_at?: string;
  notes?: string;
}

export interface SessionUpdate {
  id: string;
  completed_at?: string;
  notes?: string;
}

/**
 * Service for focus session operations
 */
export const FocusSessionService = {
  /**
   * Get all focus sessions for the current user
   */
  async getAll(): Promise<{ sessions: FocusSession[]; statistics: SessionStatistics }> {
    const result = await BaseApiService.get<SessionsResponse>('focus-sessions');
    
    if (result.success && result.data) {
      return {
        sessions: result.data.sessions,
        statistics: result.data.statistics
      };
    }
    
    console.error('Error fetching focus sessions:', result.message);
    return {
      sessions: [],
      statistics: {
        total_sessions: 0,
        total_minutes: 0,
        avg_duration: 0,
        completed_sessions: 0
      }
    };
  },

  /**
   * Start a new focus session
   */
  async start(sessionData: NewSession): Promise<FocusSession | null> {
    const dataWithTimestamp = {
      ...sessionData,
      started_at: sessionData.started_at || new Date().toISOString()
    };

    const result = await BaseApiService.post<SessionResponse>('focus-sessions', dataWithTimestamp);
    
    if (result.success && result.data) {
      return result.data.session;
    }
    
    console.error('Error starting focus session:', result.message);
    return null;
  },

  /**
   * Complete a focus session
   */
  async complete(sessionUpdate: SessionUpdate): Promise<FocusSession | null> {
    const updateData = {
      ...sessionUpdate,
      completed_at: sessionUpdate.completed_at || new Date().toISOString()
    };

    const result = await BaseApiService.put<SessionResponse>('focus-sessions', updateData);
    
    if (result.success && result.data) {
      return result.data.session;
    }
    
    console.error('Error completing focus session:', result.message);
    return null;
  },

  /**
   * Update session notes
   */
  async updateNotes(id: string, notes: string): Promise<FocusSession | null> {
    const result = await BaseApiService.put<SessionResponse>('focus-sessions', { id, notes });
    
    if (result.success && result.data) {
      return result.data.session;
    }
    
    console.error('Error updating session notes:', result.message);
    return null;
  },

  /**
   * Get sessions by type
   */
  async getByType(sessionType: 'pomodoro' | 'focus' | 'break' | 'custom'): Promise<FocusSession[]> {
    const { sessions } = await this.getAll();
    return sessions.filter(session => session.session_type === sessionType);
  },

  /**
   * Get recent sessions (last 7 days)
   */
  async getRecent(days: number = 7): Promise<FocusSession[]> {
    const { sessions } = await this.getAll();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sessions.filter(session => 
      new Date(session.started_at) >= cutoffDate
    );
  },

  /**
   * Get today's sessions
   */
  async getToday(): Promise<FocusSession[]> {
    const { sessions } = await this.getAll();
    const today = new Date().toDateString();
    
    return sessions.filter(session => 
      new Date(session.started_at).toDateString() === today
    );
  },

  /**
   * Calculate productivity metrics
   */
  async getProductivityMetrics(): Promise<{
    todayMinutes: number;
    weekMinutes: number;
    avgSessionLength: number;
    completionRate: number;
    streakDays: number;
  }> {
    const { sessions, statistics } = await this.getAll();
    
    const today = new Date().toDateString();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const todaySessions = sessions.filter(session => 
      new Date(session.started_at).toDateString() === today
    );
    
    const weekSessions = sessions.filter(session => 
      new Date(session.started_at) >= oneWeekAgo
    );
    
    const todayMinutes = todaySessions
      .filter(session => session.completed_at)
      .reduce((total, session) => total + session.duration_minutes, 0);
    
    const weekMinutes = weekSessions
      .filter(session => session.completed_at)
      .reduce((total, session) => total + session.duration_minutes, 0);
    
    const completionRate = statistics.total_sessions > 0 
      ? (statistics.completed_sessions / statistics.total_sessions) * 100 
      : 0;
    
    // Calculate streak (consecutive days with sessions)
    let streakDays = 0;
    const sortedSessions = sessions
      .filter(session => session.completed_at)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    
    if (sortedSessions.length > 0) {
      const sessionDates = new Set(
        sortedSessions.map(session => 
          new Date(session.started_at).toDateString()
        )
      );
      
      const todayDate = new Date();
      let currentDate = new Date(todayDate);
      
      while (sessionDates.has(currentDate.toDateString())) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }
    
    return {
      todayMinutes,
      weekMinutes,
      avgSessionLength: Math.round(statistics.avg_duration || 0),
      completionRate: Math.round(completionRate),
      streakDays
    };
  }
};
