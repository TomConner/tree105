import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if we have credentials in localStorage on mount
  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Test credentials against a protected endpoint
      const response = await fetch('/api/protected', {
        headers: {
          'Authorization': 'Basic ' + btoa(username + ':' + password)
        }
      });

      if (response.ok) {
        // Store auth in localStorage
        localStorage.setItem('auth', btoa(username + ':' + password));
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);