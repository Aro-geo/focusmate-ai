import { User, NewUser } from '../models/User';
import axios from 'axios';

interface ApiResponse<T> {
  success: boolean;
  user?: T;
  message?: string;
}

/**
 * Service for user-related operations (real API integration)
 */
export const UserService = {
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
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await axios.get<ApiResponse<User>>(`${this.apiUrl}/user-profile`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.user) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(userData: { username: string; email: string }): Promise<User | null> {
    try {
      const response = await axios.put<ApiResponse<User>>(`${this.apiUrl}/user-profile`, userData, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.user) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  /**
   * Get all users (deprecated - kept for compatibility)
   */
  async getAll(): Promise<User[]> {
    // For security reasons, we don't expose all users
    // Return current user only
    const currentUser = await this.getCurrentUser();
    return currentUser ? [currentUser] : [];
  },

  /**
   * Get user by ID (deprecated - kept for compatibility)
   */
  async getById(id: number): Promise<User | null> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.id === id ? currentUser : null;
  },

  /**
   * Get user by email (deprecated - kept for compatibility)
   */
  async getByEmail(email: string): Promise<User | null> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.email === email ? currentUser : null;
  },

  /**
   * Create a new user (handled by authentication service)
   */
  async create(user: NewUser): Promise<User> {
    throw new Error('User creation is handled by the authentication service');
  },

  /**
   * Update a user (redirect to updateProfile)
   */
  async update(id: number, user: Partial<User>): Promise<User | null> {
    if (user.username && user.email) {
      return this.updateProfile({ username: user.username, email: user.email });
    }
    throw new Error('Username and email are required for updates');
  },

  /**
   * Delete a user (not implemented for security)
   */
  async delete(id: number): Promise<boolean> {
    throw new Error('User deletion is not supported through this interface');
  },

  /**
   * Check if user exists (based on current user)
   */
  async exists(email: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    return user !== null;
  }
};
