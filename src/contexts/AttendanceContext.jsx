import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { subscribeToCollection, saveAttendanceSession, updateAttendanceSession, markAttendance } from '../api';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const { user, selectedCollege } = useAuth();
  const { updateTelemetry, profile } = useProfile();
  const [activeSessions, setActiveSessions] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCollege?.id) return;

    // Subscribe to all live attendance sessions in this college
    const unsubSessions = subscribeToCollection('attendance_sessions', (data) => {
      const filtered = data.filter(s => s.collegeId === selectedCollege.id && s.isActive);
      setActiveSessions(filtered);
    });

    // Subscribe to current user's attendance records
    const unsubMyAttendance = subscribeToCollection('attendance', (data) => {
        const filtered = data.filter(a => a.userId === (user?.uid || user?.id));
        setMyAttendance(filtered);
        setLoading(false);
    });

    return () => {
      unsubSessions();
      unsubMyAttendance();
    };
  }, [user, selectedCollege]);

  const startSession = useCallback(async (eventId, venueId) => {
    const sessionId = `as_${Date.now()}`;
    const newSession = {
      id: sessionId,
      eventId,
      venueId,
      collegeId: selectedCollege?.id,
      isActive: true,
      startTime: new Date().toISOString(),
      attendeeCount: 0,
      hostId: user?.id || user?.uid
    };
    await saveAttendanceSession(newSession);
    return sessionId;
  }, [user, selectedCollege]);

  const endSession = useCallback(async (sessionId) => {
    await updateAttendanceSession(sessionId, { isActive: false, endTime: new Date().toISOString() });
  }, []);

  const checkIn = useCallback(async (sessionId, eventId, eventCategory) => {
    if (!user) return;
    
    const record = {
      id: `att_${user.uid || user.id}_${sessionId}`,
      userId: user.uid || user.id,
      userName: user.displayName || user.name,
      sessionId,
      eventId,
      collegeId: selectedCollege?.id,
      timestamp: new Date().toISOString()
    };
    
    await markAttendance(record);
    
    // Update session count (simplified, better handled with cloud function or atomic increment)
    if (session) {
        await updateAttendanceSession(sessionId, { attendeeCount: (session.attendeeCount || 0) + 1 });
    }

    // Update UWAA Telemetry
    if (eventCategory) {
      const currentAffinity = profile.attendedCategories?.[eventCategory] || 0;
      await updateTelemetry({
        attendedCategories: {
          ...profile.attendedCategories,
          [eventCategory]: currentAffinity + 1
        },
        trustFactor: Math.min(1.0, (profile.trustFactor || 1.0) + 0.05)
      });
    }
  }, [user, selectedCollege, activeSessions]);

  return (
    <AttendanceContext.Provider value={{ 
      activeSessions, 
      myAttendance, 
      loading, 
      startSession, 
      endSession, 
      checkIn 
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}

export default AttendanceContext;
