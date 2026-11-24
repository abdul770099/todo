import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AuthUser, loginApi, registerApi } from '../utils/api';

interface AuthContextValue {
  user: AuthUser | null;
  authError: string | null;
  submitting: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  signOutUser: () => void;
  clearAuthError: () => void;
  getIdToken: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      const response = await loginApi(username, password);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      const response = await registerApi(username, password);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create account. Please try again.';
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const signOutUser = useCallback(() => {
    setAuthError(null);
    setToken(null);
    setUser(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const getIdToken = useCallback((): string => {
    if (!token) {
      throw new Error('Your session has ended. Please sign in again.');
    }
    return token;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authError,
        submitting,
        login,
        register,
        signOutUser,
        clearAuthError,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
