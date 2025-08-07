import axios from 'axios';
// DO NOT import: bcrypt, jsonwebtoken, pg

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  statusCode?: number; // Add status code for better error handling
}

export class RealAuthService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/.netlify/functions';
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await axios.post<RegisterResponse>(`${this.apiUrl}/auth-register`, {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Extract error message from response
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  async login(credentials: LoginData): Promise<LoginResponse> {
    try {
      console.log('Attempting login with:', {
        email: credentials.email,
        apiUrl: this.apiUrl
      });
      
      const response = await axios.post<LoginResponse>(`${this.apiUrl}/auth-login`, credentials);
      console.log('Login API response:', response);
      
      // Check if response status is 200 and contains token
      if (response.status === 200 && response.data.success && response.data.token) {
        console.log('Login successful, storing token and user data');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        console.warn('Login response missing success or token:', response.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle 401 specifically - return error info for alert
      if (error.response?.status === 401) {
        return {
          success: false,
          message: error.response?.data?.error || error.response?.data?.message || 'Invalid email or password',
          statusCode: 401
        };
      }
      
      // Extract error message from other error responses
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message,
          statusCode: error.response.status
        };
      }
      
      return {
        success: false,
        message: 'Login failed. Please try again.',
        statusCode: error.response?.status || 500
      };
    }
  }

  async logout(): Promise<void> {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out successfully - cleared token and user data');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.debug('No user data found in localStorage');
      return null;
    }
    try {
      const userData = JSON.parse(userStr);
      console.debug('Retrieved current user:', { id: userData.id, email: userData.email });
      return userData;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      return null;
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.debug('Token retrieved from storage:', token ? 'Token exists' : 'No token found');
    return token;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    
    if (!token) {
      console.debug('No token found, user is not authenticated');
      return false;
    }
    
    // Basic token structure validation (without using JWT library)
    try {
      // Check if the token has the correct JWT structure (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Token has invalid format, clearing invalid token');
        localStorage.removeItem('token');
        return false;
      }
      
      // Try to decode the payload to check basic validity
      // Note: This doesn't verify the signature, just checks if it's valid base64
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is expired based on exp claim
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token has expired, clearing expired token');
        this.logout(); // Clear all auth data
        return false;
      }
      
      console.debug('Token validated successfully, user is authenticated');
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('token');
      return false;
    }
  }
}

export const realAuthService = new RealAuthService();