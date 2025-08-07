import React from 'react';
import AuthService from '../services/AuthService';

interface AuthDemoProps {
  className?: string;
}

const AuthDemo: React.FC<AuthDemoProps> = ({ className = '' }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [isLogin, setIsLogin] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    // Check if user is already authenticated
    if (AuthService.isAuthenticated()) {
      loadCurrentUser();
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      const result = await AuthService.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        const result = await AuthService.login({ email, password });
        
        if (result.success && result.data) {
          setUser(result.data.user);
          setEmail('');
          setPassword('');
        } else {
          setError(result.message);
        }
      } else {
        // Register
        const result = await AuthService.register({ email, password, name: name || undefined });
        
        if (result.success && result.data) {
          setUser(result.data.user);
          setEmail('');
          setPassword('');
          setName('');
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  if (user) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Welcome back!</h3>
            <p className="text-gray-600">You are successfully authenticated</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
            <div className="text-left space-y-1">
              <p className="text-sm"><span className="font-medium">Email:</span> {user.email}</p>
              {user.name && <p className="text-sm"><span className="font-medium">Name:</span> {user.name}</p>}
              <p className="text-sm"><span className="font-medium">User ID:</span> {user.id}</p>
              <p className="text-sm"><span className="font-medium">Member since:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={loadCurrentUser}
              className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              🔄 Refresh Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          {isLogin ? 'Login' : 'Sign Up'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">❌ {error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={!email || !password || isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            isLogin ? '🔑 Sign In' : '✨ Create Account'
          )}
        </button>
      </form>

      {/* Toggle */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setEmail('');
              setPassword('');
              setName('');
            }}
            disabled={isLoading}
            className="ml-1 text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthDemo;
