import { neon } from '@neondatabase/serverless';
import axios from 'axios';

// Define response type for better type safety
interface HostResponseData {
  host: string;
  ttl: number;
}

interface HostResponse {
  success: boolean;
  message?: string;
  data: HostResponseData;
}

/**
 * Safely connect to Neon database from client-side code
 * This is a more secure approach than exposing the full connection string
 */
export class NeonClient {
  private static instance: NeonClient;
  private hostInfo: { host: string; ttl: number; timestamp: number } | null = null;
  private placeholder: string;
  private apiUrl: string;

  private constructor() {
    this.placeholder = process.env.REACT_APP_DATABASE_URL_PLACEHOLDER || '';
    this.apiUrl = process.env.REACT_APP_API_URL || '/.netlify/functions';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NeonClient {
    if (!NeonClient.instance) {
      NeonClient.instance = new NeonClient();
    }
    return NeonClient.instance;
  }

  /**
   * Create a SQL executor function with JWT authentication
   * @param options Connection options
   * @returns SQL executor function or null if not possible
   */
  public async createSqlExecutor(options?: {
    forceRefresh?: boolean;
  }): Promise<any> {
    try {
      // Get host information (if needed)
      if (!this.hostInfo || 
          options?.forceRefresh || 
          Date.now() > this.hostInfo.timestamp + this.hostInfo.ttl * 1000) {
        await this.refreshHostInfo();
      }

      if (!this.hostInfo?.host) {
        console.error('Cannot connect to database: Host information not available');
        return null;
      }

      // Get JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Cannot connect to database: Authentication token not available');
        return null;
      }

      // Complete connection string with host
      const connectionString = this.placeholder.replace(
        '@/', 
        `@${this.hostInfo.host}/`
      );

      // Create SQL executor with JWT token
      const sql = neon(connectionString, {
        authToken: async () => token
      });

      return sql;
    } catch (error) {
      console.error('Error creating SQL executor:', error);
      return null;
    }
  }

  /**
   * Test the database connection
   * @returns True if connection successful
   */
  public async testConnection(): Promise<boolean> {
    try {
      const sql = await this.createSqlExecutor({ forceRefresh: true });
      if (!sql) return false;

      // Try a simple query
      const result = await sql`SELECT 1 as test`;
      return Array.isArray(result) && result.length === 1 && result[0].test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Refresh host information from the server
   */
  private async refreshHostInfo(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await axios.get<HostResponse>(`${this.apiUrl}/get-db-host`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = response.data as HostResponse;
      
      if (responseData.success && responseData.data?.host) {
        this.hostInfo = {
          host: responseData.data.host,
          ttl: responseData.data.ttl || 3600,
          timestamp: Date.now()
        };
      } else {
        throw new Error(responseData.message || 'Failed to get database host');
      }
    } catch (error: any) {
      console.error('Error fetching database host:', error);
      this.hostInfo = null;
      throw error;
    }
  }
}

// Create a default export
export default NeonClient.getInstance();
