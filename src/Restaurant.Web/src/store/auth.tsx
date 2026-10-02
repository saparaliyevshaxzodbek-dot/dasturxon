import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadSession, onUnauthorized, saveSession } from '../api/client';
import { authApi } from '../api/endpoints';
import type { StaffRole, StaffUser } from '../api/types';

interface AuthContextValue {
  user: StaffUser | null;
  login: (phone: string, password: string) => Promise<StaffUser>;
  logout: () => void;
  hasRole: (...roles: StaffRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(() => loadSession()?.user ?? null);

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
    return () => onUnauthorized(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (phone, password) => {
        const session = await authApi.login(phone, password);
        saveSession(session);
        setUser(session.user);
        return session.user;
      },
      logout,
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [user, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

/** Where a staff member lands after logging in. */
export function homeFor(role: StaffRole): string {
  return role === 'Admin' || role === 'Manager' ? '/admin' : '/admin/board';
}
