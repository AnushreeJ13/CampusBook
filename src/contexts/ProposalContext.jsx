import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { MOCK_PROPOSALS } from '../utils/mockData';
import { PROPOSAL_STATUS } from '../utils/constants';
import localEvents from '../data/events.json';
import {
  submitProposalToBackend,
  updateProposalToBackend,
  subscribeToCollection
} from '../api';
import { useAuth } from './AuthContext';
import { sendStatusEmail } from '../utils/mailer';

const ProposalContext = createContext(null);

export function ProposalProvider({ children }) {
  const { user, selectedCollege } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const userCollegeId = user?.college?.toLowerCase().replace(/\s+/g, '_');
  const collegeId = selectedCollege?.id || userCollegeId;

  // -- REAL-TIME SUBSCRIPTIONS --
  useEffect(() => {
    if (!user || !collegeId) {
      setLoading(false);
      return;
    }

    const unsubProposals = subscribeToCollection('proposals', (data) => {
      // Filter by college_id (handles both camelCase and snake_case from DB)
      let cloudData = data.filter(p =>
        p.collegeId === collegeId ||
        p.college_id === collegeId
      );

      // Merge with Mock Data
      let combined = [...cloudData];
      MOCK_PROPOSALS.forEach(mock => {
        if (mock.collegeId === collegeId && !combined.find(d => d.id === mock.id)) {
          combined.push(mock);
        }
      });

      // Merge with Local Drafts
      try {
        const saved = localStorage.getItem(`campusos_drafts_${collegeId}`);
        if (saved) {
          const drafts = JSON.parse(saved);
          drafts.forEach(d => {
            if (!combined.find(p => p.id === d.id)) combined.unshift(d);
          });
        }
      } catch (e) { }

      setProposals(combined);
    });

    const unsubNotifs = subscribeToCollection('notifications', (data) => {
      const filtered = data.filter(n => n.userId === user.id || n.user_id === user.id);
      setNotifications(filtered);
    });

    const unsubBookings = subscribeToCollection('bookings', (data) => {
      const cloudBookings = data.filter(b =>
        b.collegeId === collegeId || b.college_id === collegeId || !b.collegeId
      );
      setBookings(cloudBookings);
      setLoading(false);
    });

    return () => {
      unsubProposals();
      unsubBookings();
      if (unsubNotifs) unsubNotifs();
    };
  }, [user, collegeId]);

  // -- MOCK DATA BRIDGING --
  const normalizedMockSignals = useMemo(() => {
    return localEvents.map(event => {
      // Shift dates forward (2025 -> 2026+) so recommendation engine likes them
      const originalDate = new Date(event.date);
      const normalizedDate = new Date(originalDate);
      normalizedDate.setFullYear(originalDate.getFullYear() + 1); // 2025 -> 2026

      return {
        ...event,
        id: `local_${event.id}`,
        category: event.domain, // Map domain to category
        eventType: event.domain?.toLowerCase().replace(/\s/g, '_'),
        expectedAttendance: event.seats || 100,
        date: normalizedDate.toISOString().split('T')[0],
        status: PROPOSAL_STATUS.APPROVED,
        collegeId: selectedCollege?.id || 'all',
        isMockSignal: true
      };
    });
  }, [selectedCollege]);

  const pendingMockProposals = useMemo(() => {
    return [
      {
        id: 'mock_pending_1',
        title: 'Tech Symposium 2026',
        description: 'Annual technical symposium for tech enthusiasts.',
        clubName: 'Tech Society',
        clubId: 'c1',
        date: '2026-05-12',
        expectedAttendees: 50,
        status: PROPOSAL_STATUS.FACULTY_REVIEW,
        currentReviewer: 'vijay@gmail.com',
        collegeId: selectedCollege?.id,
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: 'mock_pending_2',
        title: 'Cultural Night Auditions',
        description: 'Auditions for the annual cultural night fest.',
        clubName: 'Dance Society',
        clubId: 'c2',
        date: '2026-05-18',
        expectedAttendees: 150,
        status: PROPOSAL_STATUS.FACULTY_REVIEW,
        currentReviewer: 'vijay@gmail.com',
        collegeId: selectedCollege?.id,
        createdAt: new Date().toISOString().split('T')[0],
      }
    ];
  }, [selectedCollege]);

  const mergedProposals = useMemo(() => {
    return [...proposals, ...normalizedMockSignals, ...pendingMockProposals];
  }, [proposals, normalizedMockSignals, pendingMockProposals]);

  // -- ACTIONS --

  const addNotification = useCallback(async (notification) => {
    const newNotif = {
      ...notification,
      id: `n${Date.now()}`,
      collegeId: selectedCollege?.id,
      user_id: notification.userId || user?.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [user, selectedCollege]);

  const submitProposal = useCallback(async (proposal) => {
    const newProposal = {
      ...proposal,
      // Send BOTH camelCase and snake_case — the backend's mapToDbSchema will normalize
      collegeId,
      college_id: collegeId,
      status: PROPOSAL_STATUS.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedBy: user.id || user.uid,
      submitted_by: user.id || user.uid,
      submittedByName: user.name || user.displayName || 'User',
      submitted_by_name: user.name || user.displayName || 'User',
      auditTrail: [{ action: 'created', by: user.id, byName: user.name || user.displayName, at: new Date().toISOString(), note: 'Proposal created and submitted' }],
    };

    // Optimistic UI with temp ID
    const tempId = `temp_${Date.now()}`;
    const optimistic = { ...newProposal, id: tempId };
    setProposals(prev => [optimistic, ...prev]);

    try {
      const saved = await submitProposalToBackend(newProposal);
      if (saved && saved.id) {
        // Replace temp with real data from backend
        setProposals(prev => prev.map(p => p.id === tempId ? { ...saved, ...newProposal, id: saved.id } : p));

        // Notify appropriate reviewer
        addNotification({
          userId: proposal.currentReviewer || 'FACULTY_UID',
          type: 'submission',
          title: 'New Proposal',
          message: `${proposal.clubName} submitted "${proposal.title}" for review`,
          proposalId: saved.id,
        });

        return saved;
      }
    } catch (e) {
      console.error("Backend save failed:", e.message);
      // Save as local draft on failure
      try {
        const key = `campusos_drafts_${collegeId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(optimistic);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (se) { }
    }
    return optimistic;
  }, [user, collegeId, addNotification]);

  const updateProposalStatus = useCallback(async (proposalId, newStatus, reviewerId, reviewerName, note, extraFields = {}) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || proposal.audit_trail || []), { action: 'status_changed', by: reviewerId, byName: reviewerName, at: new Date().toISOString(), note }],
      ...extraFields,
    };

    // Optimistic update
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, ...updates } : p));

    try {
      await updateProposalToBackend(proposalId, updates);
    } catch (e) {
      console.error("Update failed:", e.message);
    }
  }, [proposals]);

  const approveAndForward = useCallback(async (proposalId, reviewerId, reviewerName, note, nextStatus, nextReviewer) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const updates = {
      status: nextStatus,
      currentReviewer: nextReviewer,
      current_reviewer: nextReviewer,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || proposal.audit_trail || []), { action: 'forwarded', by: reviewerId, byName: reviewerName, at: new Date().toISOString(), note }],
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, ...updates } : p));

    try {
      await updateProposalToBackend(proposalId, updates);
    } catch (e) {
      console.error("Forward failed:", e.message);
    }
  }, [proposals]);

  const bookVenue = useCallback(async (proposalId) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const updates = {
      status: PROPOSAL_STATUS.VENUE_BOOKED,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || proposal.audit_trail || []), { action: 'venue_booked', by: 'system', byName: 'System', at: new Date().toISOString(), note: 'Venue successfully booked' }],
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, ...updates } : p));

    try {
      await updateProposalToBackend(proposalId, updates);
    } catch (e) {
      console.error("Book venue failed:", e.message);
    }

    addNotification({
      userId: proposal.submittedBy,
      type: 'booking',
      title: 'Venue Booked!',
      message: `Venue has been booked for "${proposal.title}"`,
      proposalId,
    });
  }, [proposals, addNotification]);

  const markNotificationRead = useCallback(async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }, []);

  return (
    <ProposalContext.Provider value={{
      proposals: mergedProposals,
      bookings,
      notifications,
      loading,
      submitProposal,
      updateProposalStatus,
      approveAndForward,
      addNotification,
      bookVenue,
      markNotificationRead,
    }}>
      {children}
    </ProposalContext.Provider>
  );
}

export function useProposals() {
  const ctx = useContext(ProposalContext);
  return ctx;
}

export default ProposalContext;
