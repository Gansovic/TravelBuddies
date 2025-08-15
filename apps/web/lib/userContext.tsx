"use client";
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  role?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Default test user for development
const DEFAULT_TEST_USER = {
  id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d',
  name: 'Alice Smith',
  role: 'Trip Creator'
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage first (for dev panel switching)
    const savedUser = localStorage.getItem('dev-test-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('Loaded saved user:', userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Fall back to default
        setUser(DEFAULT_TEST_USER);
      }
    } else {
      // For development: automatically set our default test user
      setUser(DEFAULT_TEST_USER);
      console.log('Set default user:', DEFAULT_TEST_USER);
    }
    
    setIsLoading(false);
  }, []);

  // Enhanced setUser that also saves to localStorage for persistence
  const setUserWithPersistence = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('dev-test-user', JSON.stringify(newUser));
      console.log('User switched to:', newUser);
    } else {
      localStorage.removeItem('dev-test-user');
      console.log('User cleared');
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser: setUserWithPersistence, 
      isLoading 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}