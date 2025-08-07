import axios from 'axios';
import { realAuthService } from './RealAuthService';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  user_id: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface UserData {
  id: number;
  username: string;
  email: string;
  created_at: string;
  tasks: Task[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  };
}

export interface UserDataResponse {
  success: boolean;
  data?: UserData;
  message?: string;
}

export class UserDataService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/.netlify/functions';
  }

  async fetchUserData(): Promise<UserDataResponse> {
    try {
      const token = realAuthService.getToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No authentication token found'
        };
      }

      const response = await axios.get<UserDataResponse>(`${this.apiUrl}/get-user-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Fetch user data error:', error);
      
      // Handle 401 specifically - token expired or invalid
      if (error.response?.status === 401) {
        // Clear invalid token
        realAuthService.logout();
        return {
          success: false,
          message: 'Authentication expired. Please login again.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user data'
      };
    }
  }

  async addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<{success: boolean, message?: string, task?: any}> {
    try {
      const token = realAuthService.getToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No authentication token found'
        };
      }

      const response = await axios.post<{success: boolean, message?: string, task?: any}>(`${this.apiUrl}/add-task`, {
        title,
        priority
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Add task error:', error);
      
      if (error.response?.status === 401) {
        realAuthService.logout();
        return {
          success: false,
          message: 'Authentication expired. Please login again.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add task'
      };
    }
  }

  async toggleTask(taskId: number): Promise<{success: boolean, message?: string, task?: any}> {
    try {
      const token = realAuthService.getToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No authentication token found'
        };
      }

      const response = await axios.put<{success: boolean, message?: string, task?: any}>(`${this.apiUrl}/toggle-task`, {
        taskId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Toggle task error:', error);
      
      if (error.response?.status === 401) {
        realAuthService.logout();
        return {
          success: false,
          message: 'Authentication expired. Please login again.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle task'
      };
    }
  }

  // Dynamic greeting based on time of day
  static getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  // Format user display name
  static formatUserDisplayName(user: UserData): string {
    return user.username || user.email.split('@')[0];
  }
}

export const userDataService = new UserDataService();
