import React from 'react';
import AIIntegrationDemo from '../components/AIIntegrationDemo';
import TaskManager from '../components/TaskManager';
import AuthDemo from '../components/AuthDemo';
import AuthService from '../services/AuthService';

const IntegrationDemo: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check authentication status
    setIsAuthenticated(AuthService.isAuthenticated());

    // Listen for auth changes
    const handleAuthError = () => {
      setIsAuthenticated(false);
    };

    AuthService.onAuthError(handleAuthError);

    return () => {
      AuthService.offAuthError(handleAuthError);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎯 FocusMate AI - Backend Integration Demo
              </h1>
              <p className="text-gray-600 mt-1">
                Demonstrating real-time AI and database connectivity
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* Authentication Required */
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600">
                Please sign in to access the full demo features including task management and AI integrations.
              </p>
            </div>
            <AuthDemo />
          </div>
        ) : (
          /* Main Demo Interface */
          <div className="space-y-8">
            {/* Status Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Integration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h3 className="font-medium text-green-900">Authentication</h3>
                    <p className="text-sm text-green-700">JWT-based auth with Netlify Functions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h3 className="font-medium text-blue-900">AI Integration</h3>
                    <p className="text-sm text-blue-700">OpenAI proxy with rate limiting</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">💾</span>
                  <div>
                    <h3 className="font-medium text-purple-900">Database</h3>
                    <p className="text-sm text-purple-700">Neon PostgreSQL with connection pooling</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI Chat Demo */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-semibold text-gray-900">🤖 AI Assistant</h2>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Live</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Real-time AI chat powered by OpenAI API through our secure backend proxy. 
                  Features focus suggestions, journal analysis, and general assistance.
                </p>
                <AIIntegrationDemo className="h-96" />
              </div>

              {/* Task Management Demo */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-semibold text-gray-900">📝 Task Management</h2>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Live Database</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Full CRUD operations connected to Neon PostgreSQL database. 
                  Create, update, complete, and delete tasks with real-time persistence.
                </p>
                <TaskManager className="h-96 overflow-auto" />
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Backend Features Implemented</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">🔐 Authentication</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• JWT token-based authentication</li>
                    <li>• Secure user registration & login</li>
                    <li>• Protected API endpoints</li>
                    <li>• Automatic token refresh</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">🧠 AI Integration</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• OpenAI API proxy with rate limiting</li>
                    <li>• Focus suggestions generation</li>
                    <li>• Journal analysis & insights</li>
                    <li>• Session summaries</li>
                    <li>• Fallback responses for reliability</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">💾 Database Operations</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Neon PostgreSQL integration</li>
                    <li>• Connection pooling (20 max connections)</li>
                    <li>• Task CRUD operations</li>
                    <li>• User profile management</li>
                    <li>• AI interaction logging</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* API Endpoints */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🌐 Available API Endpoints</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Authentication & User Management</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">POST</span>
                      <code className="text-gray-700">/auth-register</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">POST</span>
                      <code className="text-gray-700">/auth-login</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">GET</span>
                      <code className="text-gray-700">/user-profile</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">PUT</span>
                      <code className="text-gray-700">/user-profile</code>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tasks & Data Management</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">GET</span>
                      <code className="text-gray-700">/tasks</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">POST</span>
                      <code className="text-gray-700">/tasks</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">PUT</span>
                      <code className="text-gray-700">/tasks</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">DELETE</span>
                      <code className="text-gray-700">/tasks</code>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AI Services</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">POST</span>
                      <code className="text-gray-700">/openai-proxy</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">POST</span>
                      <code className="text-gray-700">/ai-interactions</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">GET</span>
                      <code className="text-gray-700">/ai-interactions</code>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Focus Sessions</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">GET</span>
                      <code className="text-gray-700">/focus-sessions</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">POST</span>
                      <code className="text-gray-700">/focus-sessions</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">PUT</span>
                      <code className="text-gray-700">/focus-sessions</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="max-w-md mx-auto">
              <AuthDemo />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationDemo;
