import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  onAuthStateChange,
  getProfile,
  upsertProfile,
  supabase
} from '../supabase';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState('CampusBook University');
  const [selectedCollege, setSelectedCollege] = useState(() => {
    try {
      const saved = localStorage.getItem('campusos_college');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });

  const selectCollege = (college) => {
    setSelectedCollege(college);
    localStorage.setItem('campusos_college', JSON.stringify(college));
    if (college) setUniversity(college.name);
  };

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (supabaseUser) => {
      if (supabaseUser) {
        try {
          // Fetch additional profile data from Supabase 'users' table
          const profileData = await getProfile(supabaseUser.id);

          if (profileData) {
            setUser({
              id: supabaseUser.id,
              uid: supabaseUser.id,
              email: supabaseUser.email,
              phoneNumber: supabaseUser.phone,
              displayName: profileData.name || supabaseUser.user_metadata?.full_name,
              avatar: profileData.avatar || (profileData.name ? profileData.name[0] : '👤'),
              ...profileData
            });
            if (profileData.college) {
              setUniversity(profileData.college);
            }
          } else {
            // User exists in Auth but not in 'users' table yet
            setUser({
              id: supabaseUser.id,
              uid: supabaseUser.id,
              email: supabaseUser.email,
              phoneNumber: supabaseUser.phone,
              displayName: supabaseUser.user_metadata?.full_name,
              avatar: supabaseUser.user_metadata?.full_name ? supabaseUser.user_metadata.full_name[0] : '👤',
              incomplete: true
            });
          }
        } catch (err) {
          console.error("Profile fetch failed:", err);
          setUser({
            id: supabaseUser.id,
            uid: supabaseUser.id,
            email: supabaseUser.email,
            incomplete: true
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // -- AUTH ACTIONS --

  const register = async (email, password, name, college, role) => {
    const data = await signUpWithEmail(email, password, { name, college, role });
    if (data.user) {
        const profile = { 
            id: data.user.id, 
            email: data.user.email,
            name, 
            college, 
            role, 
            created_at: new Date().toISOString(),
            incomplete: false 
        };
        await upsertProfile(profile);
    }
    return data.user;
  };

  const loginWithEmail = async (email, password) => {
    return await signInWithEmail(email, password);
  };

  const loginWithGoogle = async () => {
    return await signInWithGoogle();
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const completeProfile = async (uid, data) => {
    const profile = { 
        id: uid, 
        ...data, 
        updated_at: new Date().toISOString(),
        incomplete: false 
    };
    await upsertProfile(profile);
    // Update local state
    setUser(prev => ({ ...prev, ...data, incomplete: false }));
    if (data.college) setUniversity(data.college);
  };

  // Phone Auth Helpers (Supabase Otp)
  const setupRecaptcha = (containerId) => {
    // Supabase handles captcha internally or via provider settings, 
    // no direct equivalent to Firebase RecaptchaVerifier needed in code usually.
    return null; 
  };

  const loginWithPhone = async (phoneNumber) => {
    const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
    });
    if (error) throw error;
    
    // Return a mock confirmationResult for Firebase compatibility in Login.jsx
    return {
      confirm: async (otp) => {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          phone: phoneNumber,
          token: otp,
          type: 'sms'
        });
        if (verifyError) throw verifyError;
        return data;
      }
    };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      university, 
      selectedCollege,
      selectCollege,
      register, 
      loginWithEmail, 
      loginWithGoogle, 
      logout,
      completeProfile,
      setupRecaptcha,
      loginWithPhone
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
