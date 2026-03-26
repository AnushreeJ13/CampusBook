import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  isConfigured,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState('CampusBook University');

  // Sync Auth State
  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional profile data from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            phoneNumber: firebaseUser.phoneNumber,
            displayName: profileData.name || firebaseUser.displayName,
            avatar: profileData.avatar || (firebaseUser.displayName ? firebaseUser.displayName[0] : '👤'),
            ...profileData
          });
          if (profileData.college) {
            setUniversity(profileData.college);
          }
        } else {
          // User exists in Auth but not Firestore (e.g., first time Google login)
          setUser({
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            phoneNumber: firebaseUser.phoneNumber,
            displayName: firebaseUser.displayName,
            avatar: firebaseUser.displayName ? firebaseUser.displayName[0] : '👤',
            incomplete: true // Flag to prompt for Role/College
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // -- AUTH ACTIONS --

  const register = async (email, password, name, college, role) => {
    if (!isConfigured || !auth) throw new Error("Firebase not configured. Please add your credentials to firebase.js");
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, "users", res.user.uid);
    const profile = { name, college, role, createdAt: new Date().toISOString() };
    await setDoc(userDocRef, profile);
    return res.user;
  };

  const loginWithEmail = async (email, password) => {
    if (!isConfigured || !auth) throw new Error("Firebase not configured. Please add your credentials to firebase.js");
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    if (!isConfigured || !auth) throw new Error("Firebase not configured. Please add your credentials to firebase.js");
    const res = await signInWithPopup(auth, googleProvider);
    // Profile check happens in useEffect, but we can return the result
    return res.user;
  };

  const logout = async () => {
    if (!isConfigured || !auth) return;
    await signOut(auth);
    setUser(null);
  };

  const completeProfile = async (uid, data) => {
    if (!isConfigured || !db) throw new Error("Firebase not configured.");
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, { ...data, createdAt: new Date().toISOString() }, { merge: true });
    // Update local state
    setUser(prev => ({ ...prev, ...data, incomplete: false }));
    if (data.college) setUniversity(data.college);
  };

  // Phone Auth Helpers
  const setupRecaptcha = (containerId) => {
    if (!isConfigured || !auth) throw new Error("Firebase not configured.");
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        // reCAPTCHA solved
      }
    });
  };

  const loginWithPhone = async (phoneNumber, appVerifier) => {
    if (!isConfigured || !auth) throw new Error("Firebase not configured.");
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      university, 
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
