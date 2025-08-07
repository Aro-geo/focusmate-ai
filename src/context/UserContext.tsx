import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataService, UserData, UserDataService } from '../services/UserDataService';
import { realAuthService } from '../services/RealAuthService';

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  getGreeting: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = realAuthService.getToken();
      console.log('🔑 Token check:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('📡 Fetching user data...');
      const result = await userDataService.fetchUserData();
      console.log('📡 User data result:', result);
      
      if (result.success && result.data) {
        setUserData(result.data);
        console.log('✅ User data loaded successfully:', result.data.username || result.data.email);
      } else {
        console.error('❌ Failed to fetch user data:', result.message);
        setError(result.message || 'Failed to load user data');
        
        // If authentication failed, redirect to login
        if (result.message?.includes('Authentication') || result.message?.includes('expired') || result.message?.includes('invalid')) {
          console.log('🔄 Authentication issue detected, redirecting to login');
          realAuthService.logout(); // Clear any invalid tokens
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('💥 Error refreshing user data:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await realAuthService.logout();
      setUserData(null);
      setError(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getGreeting = () => {
    return UserDataService.getTimeBasedGreeting();
  };

  // Load user data on mount and when authentication changes
  useEffect(() => {
    const token = realAuthService.getToken();
    if (token) {
      refreshUserData();
    } else {
      setIsLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const value: UserContextType = {
    userData,
    isLoading,
    error,
    refreshUserData,
    logout,
    getGreeting
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
