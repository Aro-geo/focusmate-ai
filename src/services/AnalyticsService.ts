export interface AnalyticsData {
  productivity: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    labels: string[];
  };
  pomodoro: {
    sessionsCompleted: number[];
    averageFocusTime: number[];
    breakTimeUsed: number[];
    labels: string[];
  };
  mood: {
    data: { mood: string; count: number; percentage: number }[];
    trends: number[];
    labels: string[];
  };
  tasks: {
    completed: number[];
    created: number[];
    overdue: number[];
    labels: string[];
  };
  insights: {
    mostProductiveTime: string;
    averageSessionLength: number;
    totalFocusTime: number;
    streakDays: number;
    improvementPercentage: number;
  };
  // Added for Stats page compatibility
  dailyStats?: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
    completedTasks: number;
    mood: string;
  }>;
  totalCompletedTasks?: number;
  totalFocusMinutes?: number;
  totalSessions?: number;
  taskCategories?: Array<{
    name: string;
    totalMinutes: number;
    percentage: number;
  }>;
}

class AnalyticsService {
  private generateMockData(): AnalyticsData {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const last4Weeks = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
    
    return {
      productivity: {
        daily: [65, 72, 58, 81, 76, 69, 84],
        weekly: [68, 72, 75, 79],
        monthly: [70, 73, 76, 78, 75, 80],
        labels: last7Days
      },
      pomodoro: {
        sessionsCompleted: [4, 6, 3, 8, 5, 4, 7],
        averageFocusTime: [23, 25, 20, 27, 24, 22, 26],
        breakTimeUsed: [15, 18, 12, 20, 16, 14, 19],
        labels: last7Days
      },
      mood: {
        data: [
          { mood: 'Energetic', count: 12, percentage: 30 },
          { mood: 'Productive', count: 15, percentage: 37.5 },
          { mood: 'Focused', count: 8, percentage: 20 },
          { mood: 'Neutral', count: 3, percentage: 7.5 },
          { mood: 'Tired', count: 2, percentage: 5 }
        ],
        trends: [3.2, 3.8, 3.5, 4.1, 3.9, 3.7, 4.2],
        labels: last7Days
      },
      tasks: {
        completed: [8, 12, 6, 15, 10, 8, 14],
        created: [10, 14, 8, 16, 12, 10, 15],
        overdue: [1, 2, 2, 1, 2, 2, 1],
        labels: last7Days
      },
      insights: {
        mostProductiveTime: '9:00 AM - 11:00 AM',
        averageSessionLength: 24.5,
        totalFocusTime: 1250, // minutes this week
        streakDays: 5,
        improvementPercentage: 12.5
      }
    };
  }

  async getAnalyticsData(timeRange: 'week' | 'month' | 'quarter' = 'week'): Promise<AnalyticsData> {
    // In a real app, this would fetch from your database
    // For now, return mock data that adapts to time range
    const baseData = this.generateMockData();
    
    if (timeRange === 'month') {
      // Adjust data for monthly view
      const monthlyLabels = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.getDate().toString();
      });
      
      return {
        ...baseData,
        productivity: {
          ...baseData.productivity,
          daily: Array.from({ length: 30 }, () => Math.floor(Math.random() * 40) + 60),
          labels: monthlyLabels
        }
      };
    }
    
    return baseData;
  }

  async getProductivityScore(timeRange: 'week' | 'month' = 'week'): Promise<number> {
    const data = await this.getAnalyticsData(timeRange);
    const avgProductivity = data.productivity.daily.reduce((a, b) => a + b, 0) / data.productivity.daily.length;
    return Math.round(avgProductivity);
  }

  async getWeeklyReport(): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    averageProductivity: number;
    mostProductiveDay: string;
    improvementFromLastWeek: number;
  }> {
    const data = await this.getAnalyticsData('week');
    
    const totalSessions = data.pomodoro.sessionsCompleted.reduce((a, b) => a + b, 0);
    const totalFocusTime = data.insights.totalFocusTime;
    const averageProductivity = Math.round(
      data.productivity.daily.reduce((a, b) => a + b, 0) / data.productivity.daily.length
    );
    
    const maxProductivityIndex = data.productivity.daily.indexOf(
      Math.max(...data.productivity.daily)
    );
    const mostProductiveDay = data.productivity.labels[maxProductivityIndex];
    
    return {
      totalSessions,
      totalFocusTime,
      averageProductivity,
      mostProductiveDay,
      improvementFromLastWeek: data.insights.improvementPercentage
    };
  }
}

export const analyticsService = new AnalyticsService();
