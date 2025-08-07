// Base API service for handling authentication and common functionality
class BaseApiService {
  private static readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-app-name.netlify.app/.netlify/functions'
    : 'http://localhost:8888/.netlify/functions';

  private static authToken: string | null = null;

  static setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  static getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('authToken');
    }
    return this.authToken;
  }

  static clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message: string }> {
    const url = `${this.BASE_URL}/${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.clearAuthToken();
          // Redirect to login or dispatch auth error event
          window.dispatchEvent(new CustomEvent('auth-error'));
        }
        
        return {
          success: false,
          message: result.message || `HTTP ${response.status}`,
          data: undefined
        };
      }

      return result;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  static async get<T>(endpoint: string): Promise<{ success: boolean; data?: T; message: string }> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(
    endpoint: string, 
    data?: any
  ): Promise<{ success: boolean; data?: T; message: string }> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(
    endpoint: string, 
    data?: any
  ): Promise<{ success: boolean; data?: T; message: string }> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(
    endpoint: string, 
    data?: any
  ): Promise<{ success: boolean; data?: T; message: string }> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export default BaseApiService;
