import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authService] = useState(new AuthService());

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getUser();
        const token = authService.getToken();

        if (storedUser && token) {
          // Verify token with backend
          const isValid = await authService.verifyToken();
          if (isValid) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear auth data
            authService.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService]);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const result = await authService.login(credentials);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      const result = await authService.signup(userData);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    // Update localStorage as well
    localStorage.setItem('orthobotUser', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    authService
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
