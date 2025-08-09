import React, { createContext, useState, useEffect, useContext } from "react";

// Extend the context type
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: { username?: string; email?: string; isAdmin?: boolean } | null;
  login: (token: string, user: { username?: string; email?: string; isAdmin?: boolean }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get token (string) and user info from localStorage to persist across reloads
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [user, setUser] = useState<{ username?: string; email?: string; isAdmin?: boolean } | null>(
    localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user") || '{}') : null
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [token, user]);

  const login = (newToken: string, userObj: { username?: string; email?: string; isAdmin?: boolean }) => {
    setToken(newToken);
    setUser(userObj); // <-- set user info from backend response
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
