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
import { ROLES, SOCIETY_STATUS } from '../utils/constants';
import { saveNotification } from '../api';
import { updateUserProfile } from '../api';

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
          
          // Check if this is a society account pending approval
          const isPending = profileData.role === ROLES.SOCIETY && 
                            profileData.status === SOCIETY_STATUS.PENDING;
          const isRejected = profileData.role === ROLES.SOCIETY && 
                             profileData.status === SOCIETY_STATUS.REJECTED;

          setUser({
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            phoneNumber: firebaseUser.phoneNumber,
            displayName: profileData.name || firebaseUser.displayName,
            avatar: profileData.avatar || (firebaseUser.displayName ? firebaseUser.displayName[0] : '👤'),
            ...profileData,
            // Gate flags
            pendingApproval: isPending,
            rejectedApproval: isRejected,
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

  /**
   * Register a new user. For society accounts:
   * - Saves with status: 'pending_approval'
   * - Includes societyDescription and facultyAdvisorId
   * - Sends a notification to the chosen faculty advisor
   * The society cannot log in until the faculty approves.
   */
  const register = async (email, password, name, college, role, extraData = {}) => {
    if (!isConfigured || !auth) throw new Error("Firebase not configured. Please add your credentials to firebase.js");
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, "users", res.user.uid);
    
    const profile = { 
      name, 
      college, 
      role, 
      createdAt: new Date().toISOString() 
    };

    // Society-specific fields
    if (role === ROLES.SOCIETY) {
      profile.status = SOCIETY_STATUS.PENDING;
      profile.societyDescription = extraData.societyDescription || '';
      profile.facultyAdvisorId = extraData.facultyAdvisorId || '';
      profile.facultyAdvisorName = extraData.facultyAdvisorName || '';
    } else {
      // Non-society accounts are immediately approved
      profile.status = 'approved';
    }

    await setDoc(userDocRef, profile);

    // If society, send notification to the faculty advisor for approval
    if (role === ROLES.SOCIETY && extraData.facultyAdvisorId) {
      const notif = {
        id: `n${Date.now()}`,
        userId: extraData.facultyAdvisorId,
        type: 'society_request',
        title: 'Society Registration Request',
        message: `"${name}" from ${college} wants to register as a society under your guidance. Description: ${extraData.societyDescription || 'No description provided.'}`,
        read: false,
        createdAt: new Date().toISOString(),
        // Extra data for the approval action
        societyUserId: res.user.uid,
        societyName: name,
        societyEmail: email,
        societyCollege: college,
        societyDescription: extraData.societyDescription || '',
      };
      await saveNotification(notif);
    }

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
    
    const profileData = { ...data, createdAt: new Date().toISOString() };
    
    // If completing as society, mark as pending
    if (data.role === ROLES.SOCIETY) {
      profileData.status = SOCIETY_STATUS.PENDING;
    } else {
      profileData.status = 'approved';
    }
    
    await setDoc(userDocRef, profileData, { merge: true });
    
    // Update local state
    const isPending = data.role === ROLES.SOCIETY;
    setUser(prev => ({ 
      ...prev, 
      ...data, 
      incomplete: false, 
      pendingApproval: isPending,
    }));
    if (data.college) setUniversity(data.college);
  };

  /**
   * Handle society approval/rejection by a faculty member.
   * Updates the society user's Firestore profile and optionally sends a notification.
   */
  const handleSocietyApproval = async (societyUserId, approve, reason = '') => {
    if (!isConfigured || !db) throw new Error("Firebase not configured.");
    
    const newStatus = approve ? SOCIETY_STATUS.APPROVED : SOCIETY_STATUS.REJECTED;
    
    await updateUserProfile(societyUserId, { 
      status: newStatus,
      approvedAt: approve ? new Date().toISOString() : null,
      rejectedAt: !approve ? new Date().toISOString() : null,
      approvalNote: reason,
      approvedBy: user?.uid || user?.id || 'unknown',
    });

    // Send notification to the society
    const notif = {
      id: `n${Date.now()}`,
      userId: societyUserId,
      type: approve ? 'approval' : 'rejection',
      title: approve ? 'Society Registration Approved! 🎉' : 'Society Registration Rejected',
      message: approve 
        ? 'Your society account has been approved by your faculty advisor. You can now log in and access CampusBook!'
        : `Your society registration was not approved. ${reason ? `Reason: ${reason}` : 'Please contact your faculty advisor for details.'}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await saveNotification(notif);
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
      loginWithPhone,
      handleSocietyApproval,
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
