import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { LoginFormValues, RegisterFormValues } from '../schemas/auth.schema';
import { getAuthToken, setAuthToken } from '../services/apiClient';
import { authService } from '../services/authService';
import { ThemeMode, User } from '../types/api.types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  register: (values: RegisterFormValues) => Promise<void>;
  logout: () => void;
  toggleTheme: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function applyDocumentTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === 'LIGHT') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(getAuthToken())
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    applyDocumentTheme('DARK');
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      applyDocumentTheme('DARK');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    authService
      .getMe()
      .then((profile) => {
        if (!isMounted) return;
        setUser(profile);
        applyDocumentTheme(profile.theme ?? 'DARK');
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback(async (values: LoginFormValues) => {
    const result = await authService.login(values);
    setAuthToken(result.token);
    setUser(result.user);
    applyDocumentTheme(result.user.theme ?? 'DARK');
  }, []);

  const register = useCallback(async (values: RegisterFormValues) => {
    const result = await authService.register(values);
    setAuthToken(result.token);
    setUser(result.user);
    applyDocumentTheme(result.user.theme ?? 'DARK');
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!user) return;
    const nextTheme: ThemeMode = user.theme === 'DARK' ? 'LIGHT' : 'DARK';
    applyDocumentTheme(nextTheme);
    setUser((prev) => (prev ? { ...prev, theme: nextTheme } : null));
    try {
      const updated = await authService.updatePreferences({ theme: nextTheme });
      setUser(updated);
    } catch {
      // Reverte em caso de falha
      applyDocumentTheme(user.theme);
      setUser(user);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return ctx;
}

