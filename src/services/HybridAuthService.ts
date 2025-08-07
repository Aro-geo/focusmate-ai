import axios from 'axios';
import { realAuthService, LoginData, RegisterData, User } from './RealAuthService';
import { stackAuthService, StackUser } from './StackAuthService';

export interface HybridAuthUser extends User {
  provider?: 'local' | 'stack-auth';
  stackAuthId?: string;
  profileImageUrl?: string;
}

export interface HybridAuthResponse {
  success: boolean;
  user?: HybridAuthUser;
  token?: string;
  message?: string;
  provider?: 'local' | 'stack-auth';
}

export class HybridAuthService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/.netlify/functions';
  }

  /**
   * Login with email/password (existing system)
   */
  async loginWithCredentials(credentials: LoginData): Promise<HybridAuthResponse> {
    try {
      const result = await realAuthService.login(credentials);
      return {
        ...result,
        provider: 'local'
      };
    } catch (error) {
      console.error('Credentials login error:', error);
      return {
        success: false,
        message: 'Login failed',
        provider: 'local'
      };
    }
  }

  /**
   * Register with email/password (existing system)
   */
  async registerWithCredentials(userData: RegisterData): Promise<HybridAuthResponse> {
    try {
      const result = await realAuthService.register(userData);
      return {
        ...result,
        provider: 'local'
      };
    } catch (error) {
      console.error('Credentials registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        provider: 'local'
      };
    }
  }

  /**
   * Verify Stack Auth token and optionally link to local account
   */
  async loginWithStackAuth(stackToken: string, linkToLocal = false): Promise<HybridAuthResponse> {
    try {
      // First verify the Stack Auth token
      const verification = await stackAuthService.verifyToken(stackToken);
      
      if (!verification.valid) {
        return {
          success: false,
          message: verification.error || 'Invalid Stack Auth token',
          provider: 'stack-auth'
        };
      }

      // Get user details from Stack Auth
      const stackUserResult = await stackAuthService.getCurrentUser(stackToken);
      
      if (!stackUserResult.success || !stackUserResult.user) {
        return {
          success: false,
          message: 'Failed to get user from Stack Auth',
          provider: 'stack-auth'
        };
      }

      // Check if we should link to local account or create a hybrid user
      if (linkToLocal) {
        const result = await this.linkStackAuthToLocal(stackUserResult.user, stackToken);
        return result;
      }

      // Return Stack Auth user as hybrid user
      const hybridUser: HybridAuthUser = {
        id: parseInt(stackUserResult.user.id) || 0,
        username: stackUserResult.user.displayName || stackUserResult.user.email?.split('@')[0] || '',
        email: stackUserResult.user.email || '',
        created_at: stackUserResult.user.createdAt,
        provider: 'stack-auth',
        stackAuthId: stackUserResult.user.id,
        profileImageUrl: stackUserResult.user.profileImageUrl
      };

      return {
        success: true,
        user: hybridUser,
        token: stackToken,
        provider: 'stack-auth'
      };

    } catch (error) {
      console.error('Stack Auth login error:', error);
      return {
        success: false,
        message: 'Stack Auth login failed',
        provider: 'stack-auth'
      };
    }
  }

  /**
   * Link Stack Auth account to existing local account
   */
  async linkStackAuthToLocal(stackUser: StackUser, stackToken: string): Promise<HybridAuthResponse> {
    try {
      const response = await axios.post<HybridAuthResponse>(`${this.apiUrl}/link-stack-auth`, {
        stackUser,
        stackToken
      });

      return {
        ...response.data,
        provider: 'local'
      };
    } catch (error: any) {
      console.error('Link Stack Auth error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to link Stack Auth account',
        provider: 'local'
      };
    }
  }

  /**
   * Verify any token (JWT or Stack Auth)
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: HybridAuthUser; provider?: string }> {
    try {
      // Try Stack Auth first (tokens usually start with specific prefixes)
      if (token.length > 100) { // Stack Auth tokens are typically longer
        const stackResult = await stackAuthService.verifyToken(token);
        if (stackResult.valid) {
          return {
            valid: true,
            provider: 'stack-auth',
            user: {
              id: 0, // Will be mapped
              username: stackResult.payload?.name || stackResult.payload?.email?.split('@')[0] || '',
              email: stackResult.payload?.email || '',
              created_at: new Date().toISOString(),
              provider: 'stack-auth',
              stackAuthId: stackResult.payload?.sub
            }
          };
        }
      }

      // Try local JWT verification via backend
      const response = await axios.post(`${this.apiUrl}/verify-token`, { token });
      
      if (response.data.valid) {
        return {
          valid: true,
          provider: 'local',
          user: {
            ...response.data.user,
            provider: 'local'
          }
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  }

  /**
   * Get current user regardless of auth provider
   */
  async getCurrentUser(): Promise<HybridAuthResponse> {
    const token = this.getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found'
      };
    }

    const verification = await this.verifyToken(token);
    
    if (verification.valid && verification.user) {
      return {
        success: true,
        user: verification.user,
        provider: verification.provider as 'local' | 'stack-auth'
      };
    }

    return {
      success: false,
      message: 'Invalid or expired token'
    };
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('stackAuthToken');
  }

  /**
   * Store token
   */
  setToken(token: string, provider: 'local' | 'stack-auth' = 'local'): void {
    if (provider === 'stack-auth') {
      localStorage.setItem('stackAuthToken', token);
      localStorage.removeItem('authToken');
    } else {
      localStorage.setItem('authToken', token);
      localStorage.removeItem('stackAuthToken');
    }
  }

  /**
   * Logout from both systems
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('stackAuthToken');
    realAuthService.logout();
  }

  /**
   * Check if user is authenticated with any provider
   */
  isAuthenticated(): boolean {
    return !!(this.getToken());
  }
}

export const hybridAuthService = new HybridAuthService();
