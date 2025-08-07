import React from 'react';
import { stackAuthService } from '../services/StackAuthService';

interface StackAuthIntegrationProps {
  onAuthSuccess?: (user: any) => void;
  onAuthError?: (error: string) => void;
}

const StackAuthIntegration: React.FC<StackAuthIntegrationProps> = ({ 
  onAuthSuccess, 
  onAuthError 
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [config, setConfig] = React.useState<any>(null);

  React.useEffect(() => {
    // Initialize Stack Auth and get configuration
    stackAuthService.initializeClient();
    setConfig(stackAuthService.getConfig());
  }, []);

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      onAuthError?.('Please enter a token to verify');
      return;
    }

    setIsLoading(true);
    try {
      const result = await stackAuthService.verifyToken(token);
      
      if (result.valid) {
        onAuthSuccess?.(result.payload);
        console.log('Token verified successfully:', result.payload);
      } else {
        onAuthError?.(result.error || 'Token verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      onAuthError?.('Failed to verify token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentUser = async () => {
    if (!token.trim()) {
      onAuthError?.('Please enter a token first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await stackAuthService.getCurrentUser(token);
      
      if (result.success && result.user) {
        onAuthSuccess?.(result.user);
        console.log('Current user retrieved:', result.user);
      } else {
        onAuthError?.(result.message || 'Failed to get current user');
      }
    } catch (error) {
      console.error('Get current user error:', error);
      onAuthError?.('Failed to get current user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Stack Auth Integration
      </h3>
      
      {config && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Configuration:</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div><strong>Project ID:</strong> {config.projectId}</div>
            <div><strong>Publishable Key:</strong> {config.publishableKey?.substring(0, 20)}...</div>
            <div><strong>JWKS URL:</strong> {config.jwksUrl}</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="stack-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stack Auth Token:
          </label>
          <textarea
            id="stack-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Stack Auth token here..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleVerifyToken}
            disabled={isLoading || !token.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Verify the Stack Auth token"
          >
            {isLoading ? 'Verifying...' : 'Verify Token'}
          </button>

          <button
            onClick={handleGetCurrentUser}
            disabled={isLoading || !token.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Get current user from Stack Auth"
          >
            {isLoading ? 'Loading...' : 'Get Current User'}
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Use this component to test Stack Auth token verification.</p>
          <p>JWKS URL: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{config?.jwksUrl}</code></p>
        </div>
      </div>
    </div>
  );
};

export default StackAuthIntegration;
