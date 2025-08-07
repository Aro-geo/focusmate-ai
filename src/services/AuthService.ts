import { realAuthService, LoginData, RegisterData } from './RealAuthService';

// Enhanced AuthService that wraps RealAuthService with additional functionality
export class AuthService {
  static async login(credentials: LoginData) {
    try {
      const result = await realAuthService.login(credentials);
      
      if (result.success) {
        // Dispatch authentication success event
        window.dispatchEvent(new CustomEvent('auth-success', { 
          detail: { user: result.user, type: 'login' } 
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Auth login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  static async register(userData: RegisterData) {
    try {
      const result = await realAuthService.register(userData);
      
      if (result.success) {
        // Dispatch authentication success event
        window.dispatchEvent(new CustomEvent('auth-success', { 
          detail: { user: result.user, type: 'register' } 
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Auth register error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  static async logout() {
    await realAuthService.logout();
    // Dispatch authentication logout event
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }

  static async getCurrentUser() {
    const user = realAuthService.getCurrentUser();
    return {
      success: !!user,
      data: user
    };
  }

  static isAuthenticated(): boolean {
    return realAuthService.isAuthenticated();
  }

  static getToken(): string | null {
    return realAuthService.getToken();
  }

  // Event handlers for auth state changes
  static onAuthError(callback: () => void) {
    window.addEventListener('auth-error', callback);
  }

  static offAuthError(callback: () => void) {
    window.removeEventListener('auth-error', callback);
  }
}

export default AuthService;