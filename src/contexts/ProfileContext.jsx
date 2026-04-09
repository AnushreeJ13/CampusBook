import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToCollection, saveUserProfile } from '../api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    interests: [],
    skills: [],
    onboardingComplete: false,
    joinedEvents: [],
    trustFactor: 1.0,
    syncIntegrity: 0.95
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid && !user?.id) {
        setLoading(false);
        return;
    }

    const unsub = subscribeToCollection('user_profiles', (data) => {
      const myProfile = data.find(p => p.id === (user.uid || user.id));
      if (myProfile) {
        setProfile(prev => ({ ...prev, ...myProfile }));
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const updateProfile = useCallback(async (updates) => {
    const newProfile = { ...profile, ...updates, id: user.uid || user.id };
    setProfile(newProfile); // Optimistic update
    await saveUserProfile(newProfile);
  }, [profile, user]);

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

export default ProfileContext;
