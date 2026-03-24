import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_USERS } from '../utils/mockData';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbook_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [university, setUniversity] = useState(() => {
    return localStorage.getItem('campusbook_university') || 'CampusBook University';
  });

  useEffect(() => {
    // Apply role class to body
    document.body.className = '';
    if (user) {
      document.body.classList.add(`role-${user.role}`);
    }
  }, [user]);

  const login = useCallback((role, universityName) => {
    const matchingUser = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    const loggedInUser = { ...matchingUser, university: universityName || university };
    setUser(loggedInUser);
    setUniversity(universityName || university);
    localStorage.setItem('campusbook_user', JSON.stringify(loggedInUser));
    localStorage.setItem('campusbook_university', universityName || university);
  }, [university]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('campusbook_user');
    document.body.className = '';
  }, []);

  const switchRole = useCallback((role) => {
    const matchingUser = MOCK_USERS.find(u => u.role === role);
    if (matchingUser) {
      const switched = { ...matchingUser, university };
      setUser(switched);
      localStorage.setItem('campusbook_user', JSON.stringify(switched));
    }
  }, [university]);

  return (
    <AuthContext.Provider value={{ user, university, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
