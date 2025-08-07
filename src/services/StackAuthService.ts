import axios from 'axios';

export interface StackAuthConfig {
  projectId: string;
  publishableKey: string;
  jwksUrl: string;
}

export interface StackUser {
  id: string;
  email: string;
  displayName?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StackAuthResponse {
  success: boolean;
  user?: StackUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export class StackAuthService {
  private config: StackAuthConfig;
  
  constructor() {
    this.config = {
      projectId: process.env.VITE_STACK_PROJECT_ID || '',
      publishableKey: process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || '',
      jwksUrl: process.env.STACK_AUTH_JWKS_URL || `https://api.stack-auth.com/api/v1/projects/${process.env.VITE_STACK_PROJECT_ID}/.well-known/jwks.json`
    };
  }

  /**
   * Get the JWKS URL for token verification
   */
  getJwksUrl(): string {
    return this.config.jwksUrl;
  }

  /**
   * Get Stack Auth configuration
   */
  getConfig(): StackAuthConfig {
    return this.config;
  }

  /**
   * Verify a Stack Auth token by fetching JWKS keys
   */
  async verifyToken(token: string): Promise<{ valid: boolean; payload?: any; error?: string }> {
    try {
      // For production use, you'd want to cache JWKS keys and use a proper JWT library
      // This is a basic implementation for demonstration
      const response = await axios.get(this.config.jwksUrl);
      const jwks = response.data;
      
      // In a real implementation, you'd use the JWKS to verify the JWT
      // For now, we'll just check if the token exists and is properly formatted
      if (!token || typeof token !== 'string' || !token.includes('.')) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Basic JWT structure validation (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid JWT structure' };
      }

      try {
        // Decode payload (without verification for demo - in production use proper JWKS verification)
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return { valid: false, error: 'Token expired' };
        }

        return { valid: true, payload };
      } catch (decodeError) {
        return { valid: false, error: 'Failed to decode token payload' };
      }

    } catch (error) {
      console.error('Error verifying Stack Auth token:', error);
      return { valid: false, error: 'Failed to fetch JWKS or verify token' };
    }
  }

  /**
   * Get current user from Stack Auth (if integrated)
   */
  async getCurrentUser(accessToken: string): Promise<StackAuthResponse> {
    try {
      // This would be a call to Stack Auth API to get user details
      // For now, returning a placeholder response
      const verification = await this.verifyToken(accessToken);
      
      if (!verification.valid) {
        return {
          success: false,
          message: verification.error || 'Invalid token'
        };
      }

      // In a real implementation, you'd make an API call to Stack Auth
      return {
        success: true,
        user: {
          id: verification.payload?.sub || '',
          email: verification.payload?.email || '',
          displayName: verification.payload?.name || '',
          profileImageUrl: verification.payload?.picture || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting current user from Stack Auth:', error);
      return {
        success: false,
        message: 'Failed to get current user'
      };
    }
  }

  /**
   * Initialize Stack Auth client-side SDK
   */
  initializeClient(): void {
    // This would initialize the Stack Auth client-side SDK
    // Add the Stack Auth script to your index.html if using client-side integration
    console.log('Stack Auth Service initialized with config:', {
      projectId: this.config.projectId,
      publishableKey: this.config.publishableKey?.substring(0, 10) + '...',
      jwksUrl: this.config.jwksUrl
    });
  }
}

export const stackAuthService = new StackAuthService();
