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
import { ROLES, COLLEGES } from '../utils/constants';
import { seedCollegeData } from '../utils/forensicSeeder';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState('UniFlow Platform');
  const [selectedCollege, setSelectedCollege] = useState(() => {
    try {
      const saved = localStorage.getItem('uniflow_college');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });

  const selectCollege = useCallback(async (college) => {
    setSelectedCollege(college);
    localStorage.setItem('uniflow_college', JSON.stringify(college));
    if (college) setUniversity(college.name);
    
    // Remote Sync if logged in
    if (user?.id && college) {
      try {
        await upsertProfile({ id: user.id, college: college.name });
        // Inoculate college with forensic data if empty
        // seedCollegeData(college.id);
      } catch (err) {
        console.error("Failed to sync college preference:", err);
      }
    }
  }, [user]);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (supabaseUser) => {
      try {
        if (supabaseUser) {
          setLoading(true);
          console.group("Auth Sync Trace");
          console.log("Supabase User:", supabaseUser.id);
          console.log("Existing Metadata Role:", supabaseUser.user_metadata?.role);

          // Fetch additional profile data
          const profileData = await getProfile(supabaseUser.id);
          console.log("DB Profile Role:", profileData?.role);

          // Priority: 1. DB Row, 2. Auth Metadata, 3. Default Student
          const rawRole = profileData?.role || supabaseUser.user_metadata?.role || ROLES.STUDENT;
          const roleToSet = rawRole.toLowerCase(); // Case-insensitive normalization
          
          console.log("Final Resolved Role (Normalized):", roleToSet);

          // If current metadata doesn't match resolved role, sync it back silently
          if (supabaseUser.user_metadata?.role !== roleToSet && profileData?.role) {
            console.log("Syncing role to metadata for persistent resolution...");
            supabase.auth.updateUser({ data: { role: roleToSet } }).catch(e => console.warn("Metadata sync warning:", e));
          }

          if (profileData) {
            setUser({
              id: supabaseUser.id,
              uid: supabaseUser.id,
              email: supabaseUser.email,
              phoneNumber: supabaseUser.phone,
              displayName: profileData.name || supabaseUser.user_metadata?.full_name || 'Campus User',
              avatar: profileData.avatar || (profileData.name ? profileData.name[0] : (supabaseUser.user_metadata?.full_name ? supabaseUser.user_metadata.full_name[0] : '👤')),
              ...profileData,
              role: roleToSet,
            });

            if (profileData.college) {
              setUniversity(profileData.college);
              const matchingCollege = COLLEGES.find(c => 
                c.id === profileData.college || 
                c.name === profileData.college || 
                c.shortName === profileData.college
              );

              if (matchingCollege && !selectedCollege) {
                setSelectedCollege(matchingCollege);
                localStorage.setItem('uniflow_college', JSON.stringify(matchingCollege));
              }
            }
          } else {
            // No profile found
            console.log("Profile missing, using fallback role:", roleToSet);
            setUser({
              id: supabaseUser.id,
              uid: supabaseUser.id,
              email: supabaseUser.email,
              phoneNumber: supabaseUser.phone,
              displayName: supabaseUser.user_metadata?.full_name || 'New User',
              avatar: supabaseUser.user_metadata?.full_name ? supabaseUser.user_metadata.full_name[0] : '👤',
              role: roleToSet,
              incomplete: true 
            });
          }
          console.groupEnd();
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth sync fatal error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
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
    
    // 1. Update database
    await upsertProfile(profile);
    
    // 2. Update Auth metadata for faster role resolution
    if (data.role) {
      await supabase.auth.updateUser({
        data: { role: data.role }
      });
    }

    // 3. Update local state
    setUser(prev => ({ ...prev, ...data, incomplete: false }));
    if (data.college) setUniversity(data.college);
  };

  const toggleSavedEvent = async (eventId) => {
    if (!user) return;
    // Handle both snake_case from DB and camelCase in state
    const currentSaved = user.saved_events || user.savedEvents || [];
    const newSaved = currentSaved.includes(eventId)
      ? currentSaved.filter(id => id !== eventId)
      : [...currentSaved, eventId];
    
    // Update local state (keep both for compatibility)
    const updatedUser = { ...user, saved_events: newSaved, savedEvents: newSaved };
    setUser(updatedUser);
    
    if (user.id) {
      try {
        // Use snake_case for Supabase
        await upsertProfile({ id: user.id, saved_events: newSaved });
      } catch (err) {
        console.error("Failed to save event:", err);
      }
    }
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
      loginWithPhone,
      toggleSavedEvent
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
