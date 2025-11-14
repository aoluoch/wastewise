import React, { createContext, useReducer, useEffect } from 'react';
import { AuthUser, LoginCredentials, RegisterData } from '../types';
import { authApi } from '../api/authApi';
import { useToast } from './ToastContext';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: Partial<AuthUser> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS': {
      // The payload is already the user object from authApi.login()
      // Normalize user data to ensure id field exists
      const normalizedUser = {
        ...action.payload,
        id: action.payload.id || action.payload._id || '',
      };

      return {
        ...state,
        user: normalizedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER': {
      const mergedUser = state.user
        ? { ...state.user, ...action.payload }
        : (action.payload as unknown as AuthUser);
      return { ...state, user: mergedUser };
    }
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Set loading state during token verification
      dispatch({ type: 'SET_LOADING', payload: true });

      // Verify token and get user data
      authApi
        .verifyToken()
        .then(user => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      // No token found, ensure loading is false
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const user = await authApi.login(credentials);
      localStorage.setItem('token', user.token);
      localStorage.setItem('refreshToken', user.refreshToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      showToast({
        type: 'success',
        title: 'Welcome back',
        message: `Signed in as ${user.email}`,
      });
    } catch (error) {
      const apiErr = error as { message?: string };
      const message =
        apiErr && apiErr.message ? apiErr.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      showToast({ type: 'error', title: 'Login failed', message });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const user = await authApi.register(data);
      localStorage.setItem('token', user.token);
      localStorage.setItem('refreshToken', user.refreshToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      showToast({
        type: 'success',
        title: 'Account created',
        message: `Welcome, ${user.firstName}!`,
      });
    } catch (error) {
      const apiErr = error as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      let message =
        apiErr && apiErr.message ? apiErr.message : 'Registration failed';
      if (apiErr && apiErr.errors) {
        const firstKey = Object.keys(apiErr.errors)[0];
        const firstMsg = firstKey ? apiErr.errors[firstKey]?.[0] : undefined;
        if (firstMsg) message = `${message}: ${firstMsg}`;
      }
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      showToast({ type: 'error', title: 'Registration failed', message });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
    showToast({
      type: 'info',
      title: 'Signed out',
      message: 'You have been logged out.',
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) throw new Error('No refresh token');

      const user = await authApi.refreshToken(refreshTokenValue);
      localStorage.setItem('token', user.token);
      localStorage.setItem('refreshToken', user.refreshToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      logout();
      throw error;
    }
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    dispatch({ type: 'SET_USER', payload: partial });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
