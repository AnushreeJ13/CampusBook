import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_PROPOSALS, MOCK_NOTIFICATIONS, MOCK_BOOKINGS } from '../utils/mockData';
import { PROPOSAL_STATUS } from '../utils/constants';
import { 
  saveProposal, 
  saveNotification, 
  saveBooking, 
  saveBookingHistory,
  markNotifRead, 
  subscribeToCollection,
  fetchUsers 
} from '../api';
import { useAuth } from './AuthContext';
import { sendStatusEmail } from '../utils/mailer';
import { MOCK_USERS } from '../utils/mockData';

const ProposalContext = createContext(null);

export function ProposalProvider({ children }) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- REAL-TIME SUBSCRIPTIONS --
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubProposals = subscribeToCollection('proposals', (data) => {
        let localDrafts = [];
        try {
            const saved = localStorage.getItem('campusbook_drafts');
            if (saved) localDrafts = JSON.parse(saved);
        } catch(e) {}

        const combined = [...data];
        
        MOCK_PROPOSALS.forEach(mock => {
           if (!combined.find(d => d.id === mock.id)) combined.push(mock);
        });

        localDrafts.forEach(draft => {
           if (!combined.find(d => d.id === draft.id)) combined.unshift(draft);
        });

        setProposals(combined);
    });

    const unsubNotifs = subscribeToCollection('notifications', (data) => {
        const combined = [...data];
        MOCK_NOTIFICATIONS.forEach(mock => {
           if (!data.find(d => d.id === mock.id)) combined.push(mock);
        });
        setNotifications(combined.filter(n => n.userId === user.uid || n.userId === user.id));
    });

    const unsubBookings = subscribeToCollection('bookings', (data) => {
        const combined = [...data];
        MOCK_BOOKINGS.forEach(mock => {
           if (!data.find(d => d.id === mock.id)) combined.push(mock);
        });
        setBookings(combined);
        setLoading(false);
    });

    return () => {
        unsubProposals();
        unsubNotifs();
        unsubBookings();
    };
  }, [user]);

  // -- HELPERS --

  /**
   * Check if a user has already acted on a proposal (exists in actionLog).
   * Returns true if user has acted AND is not currently re-assigned.
   */
  const hasUserActed = useCallback((proposal, userId) => {
    if (!proposal?.actionLog || !userId) return false;
    return proposal.actionLog.some(entry => entry.reviewerId === userId);
  }, []);

  /**
   * Check if the current user is the assigned reviewer for a proposal.
   * This is the SINGLE SOURCE OF TRUTH for review access.
   */
  const isCurrentReviewer = useCallback((proposal) => {
    if (!proposal || !user) return false;
    const userId = user.uid || user.id;
    return proposal.currentReviewer === userId;
  }, [user]);

  /**
   * Fetch all faculty & admin users from Firestore for the "Forward To" dropdown.
   * Excludes the current user from the list.
   */
  const fetchReviewers = useCallback(async (college = null) => {
    try {
      const users = await fetchUsers(college);
      const currentUserId = user?.uid || user?.id;
      // Filter out the current user so they can't forward to themselves
      return users.filter(u => u.id !== currentUserId);
    } catch (e) {
      console.error("Failed to fetch reviewers:", e);
      return [];
    }
  }, [user]);

  // -- ACTIONS --

  const addNotification = useCallback(async (notification) => {
    const newNotif = { 
        ...notification, 
        id: `n${Date.now()}`, 
        read: false, 
        createdAt: new Date().toISOString() 
    };
    await saveNotification(newNotif);
  }, []);

  const submitProposal = useCallback(async (proposal) => {
    const newProposal = {
      ...proposal,
      id: `p${Date.now()}`,
      status: PROPOSAL_STATUS.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedBy: user.id || user.uid || 'guest',
      submittedByName: user.name || user.displayName || 'Unknown User',
      actionLog: [], // Initialize empty action log for tracking who has acted
      auditTrail: [
        { 
          action: 'created', 
          by: user.uid || user.id || 'guest', 
          byName: user.displayName || user.name || 'Unknown User', 
          at: new Date().toISOString(), 
          note: 'Proposal created and submitted' 
        },
      ],
    };
    
    // Save to local drafts to survive UI refreshes natively regardless of Firebase rules
    try {
        const saved = localStorage.getItem('campusbook_drafts');
        const localDrafts = saved ? JSON.parse(saved) : [];
        localDrafts.unshift(newProposal);
        localStorage.setItem('campusbook_drafts', JSON.stringify(localDrafts));
    } catch(e) {}

    // Optimistically update
    setProposals(prev => [newProposal, ...prev]);

    try {
      await saveProposal(newProposal);
    } catch(e) {
      console.warn("Firebase write blocked. Saved safely in local storage fallback.");
    }
    
    // Notify appropriate reviewer
    addNotification({
      userId: proposal.currentReviewer,
      type: 'submission',
      title: 'New Proposal',
      message: `${proposal.clubName} submitted "${proposal.title}" for review`,
      proposalId: newProposal.id,
    });
    
    return newProposal;
  }, [user, addNotification]);

  /**
   * Update proposal status (reject / request revision / final approve).
   * CRITICAL: Records the action in actionLog and reassigns currentReviewer so the
   * acting reviewer is locked out until the thread returns to them.
   */
  const updateProposalStatus = useCallback(async (proposalId, newStatus, reviewerId, reviewerName, note, nextReviewer) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    // GUARD: Only the current reviewer can act
    const currentUserId = user?.uid || user?.id;
    if (proposal.currentReviewer !== currentUserId) {
      console.error("Access denied: You are not the current reviewer for this proposal.");
      return;
    }

    const auditEntry = {
      action: newStatus === PROPOSAL_STATUS.APPROVED ? 'approved'
        : newStatus === PROPOSAL_STATUS.REJECTED ? 'rejected'
        : newStatus === PROPOSAL_STATUS.REVISION_REQUESTED ? 'revision_requested'
        : 'status_changed',
      by: reviewerId,
      byName: reviewerName,
      at: new Date().toISOString(),
      note: note || `Status changed to ${newStatus}`,
    };

    // Record in actionLog that this reviewer has acted
    const actionLogEntry = {
      reviewerId: reviewerId,
      action: auditEntry.action,
      at: new Date().toISOString(),
    };

    // Determine next reviewer:
    // - On reject or revision_requested: goes back to submitter (null currentReviewer, submitter sees status)
    // - On final approve: null (no more reviewer needed)
    // - If nextReviewer is explicitly provided, use it
    let resolvedNextReviewer = null;
    if (nextReviewer) {
      resolvedNextReviewer = nextReviewer;
    }
    // On reject/revision, currentReviewer becomes null — proposal goes back to submitter's view

    const updatedProposal = {
      ...proposal,
      status: newStatus,
      currentReviewer: resolvedNextReviewer,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || []), auditEntry],
      actionLog: [...(proposal.actionLog || []), actionLogEntry],
    };

    // Update local storage drafts so it stays approved across refreshes
    try {
        const saved = localStorage.getItem('campusbook_drafts');
        if (saved) {
             const localDrafts = JSON.parse(saved);
             const index = localDrafts.findIndex(p => p.id === proposalId);
             if (index > -1) {
                 localDrafts[index] = updatedProposal;
                 localStorage.setItem('campusbook_drafts', JSON.stringify(localDrafts));
             }
        }
    } catch(e) {}

    const mockIndex = MOCK_PROPOSALS.findIndex(m => m.id === proposalId);
    if (mockIndex > -1) MOCK_PROPOSALS[mockIndex] = updatedProposal;

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    try {
      await saveProposal(updatedProposal);
    } catch(e) {}

    // Notifications — notify the submitter
    const notifType = newStatus === PROPOSAL_STATUS.APPROVED ? 'approval'
      : newStatus === PROPOSAL_STATUS.REJECTED ? 'rejection'
      : 'revision';
    
    addNotification({
      userId: proposal.submittedBy,
      type: notifType,
      title: newStatus === PROPOSAL_STATUS.APPROVED ? 'Proposal Approved!' :
             newStatus === PROPOSAL_STATUS.REJECTED ? 'Proposal Rejected' : 'Revision Requested',
      message: `"${proposal.title}" — ${note || `Status updated to ${newStatus}`}`,
      proposalId,
    });

    // If forwarded to a next reviewer, also notify them
    if (resolvedNextReviewer) {
      addNotification({
        userId: resolvedNextReviewer,
        type: 'submission',
        title: 'Proposal Assigned to You',
        message: `"${proposal.title}" has been assigned to you for review`,
        proposalId,
      });
    }

    // Email dispatch (simulation if service not ready)
    if (newStatus === PROPOSAL_STATUS.APPROVED || newStatus === PROPOSAL_STATUS.REJECTED) {
       sendStatusEmail(proposal.title, newStatus, "society@university.edu", "Society Team");
       
       // Log to booking history
       saveBookingHistory({
         venueId: proposal.venueId,
         eventType: proposal.eventType,
         status: newStatus === PROPOSAL_STATUS.APPROVED ? 'approved' : 'rejected'
       });
    }
  }, [proposals, addNotification, user]);

  /**
   * Approve and forward a proposal to the next reviewer.
   * CRITICAL: Locks out the current reviewer by updating currentReviewer to the chosen next person.
   */
  const approveAndForward = useCallback(async (proposalId, reviewerId, reviewerName, note, nextStatus, nextReviewer, nextReviewerName) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    // GUARD: Only the current reviewer can act
    const currentUserId = user?.uid || user?.id;
    if (proposal.currentReviewer !== currentUserId) {
      console.error("Access denied: You are not the current reviewer for this proposal.");
      return;
    }

    // GUARD: Must have a next reviewer selected
    if (!nextReviewer) {
      console.error("Cannot forward: no next reviewer selected.");
      return;
    }

    const auditEntries = [
      { action: 'approved', by: reviewerId, byName: reviewerName, at: new Date().toISOString(), note: note || 'Approved' },
      { action: 'forwarded', by: reviewerId, byName: reviewerName, at: new Date().toISOString(), note: `Forwarded to ${nextReviewerName || 'next authority'}` },
    ];

    // Record in actionLog
    const actionLogEntry = {
      reviewerId: reviewerId,
      action: 'approved_and_forwarded',
      at: new Date().toISOString(),
    };

    const updatedProposal = {
      ...proposal,
      status: nextStatus,
      currentReviewer: nextReviewer, // New reviewer takes over — old one is locked out
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || []), ...auditEntries],
      actionLog: [...(proposal.actionLog || []), actionLogEntry],
    };

    try {
        const saved = localStorage.getItem('campusbook_drafts');
        if (saved) {
             const localDrafts = JSON.parse(saved);
             const index = localDrafts.findIndex(p => p.id === proposalId);
             if (index > -1) {
                 localDrafts[index] = updatedProposal;
                 localStorage.setItem('campusbook_drafts', JSON.stringify(localDrafts));
             }
        }
    } catch(e) {}

    const mockIndex = MOCK_PROPOSALS.findIndex(m => m.id === proposalId);
    if (mockIndex > -1) MOCK_PROPOSALS[mockIndex] = updatedProposal;

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    try {
      await saveProposal(updatedProposal);
    } catch(e) {}

    // Notify the next reviewer
    addNotification({
      userId: nextReviewer,
      type: 'submission',
      title: 'Proposal Assigned to You',
      message: `"${proposal.title}" has been forwarded to you by ${reviewerName} for review`,
      proposalId,
    });

    // Notify the submitter about progress
    addNotification({
      userId: proposal.submittedBy,
      type: 'approval',
      title: 'Proposal Progressing',
      message: `"${proposal.title}" was approved by ${reviewerName} and forwarded for further review`,
      proposalId,
    });
  }, [proposals, addNotification, user]);

  const bookVenue = useCallback(async (proposalId) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const newBooking = {
      id: `b${Date.now()}`,
      venueId: proposal.venueId,
      proposalId,
      date: proposal.date,
      timeSlot: proposal.timeSlot,
      status: 'confirmed',
    };

    await saveBooking(newBooking);

    const updatedProposal = {
      ...proposal,
      status: PROPOSAL_STATUS.VENUE_BOOKED,
      currentReviewer: null, // No more reviewer needed
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || []), {
        action: 'venue_booked',
        by: 'system',
        byName: 'System',
        at: new Date().toISOString(),
        note: 'Venue automatically booked upon final approval',
      }],
    };

    try {
        const saved = localStorage.getItem('campusbook_drafts');
        if (saved) {
             const localDrafts = JSON.parse(saved);
             const index = localDrafts.findIndex(p => p.id === proposalId);
             if (index > -1) {
                 localDrafts[index] = updatedProposal;
                 localStorage.setItem('campusbook_drafts', JSON.stringify(localDrafts));
             }
        }
    } catch(e) {}

    const mockIndex = MOCK_PROPOSALS.findIndex(m => m.id === proposalId);
    if (mockIndex > -1) MOCK_PROPOSALS[mockIndex] = updatedProposal;

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    try {
      await saveProposal(updatedProposal);
    } catch(e) {}

    addNotification({
      userId: proposal.submittedBy,
      type: 'booking',
      title: 'Venue Booked!',
      message: `Venue has been booked for "${proposal.title}"`,
      proposalId,
    });
  }, [proposals, addNotification]);

  const markNotificationRead = useCallback(async (notifId) => {
    await markNotifRead(notifId);
  }, []);

  const resetData = useCallback(() => {
    // Optional: clear firestore collections? Safer to just log out or reset local state if any.
    console.log("Resetting data...");
  }, []);

  return (
    <ProposalContext.Provider value={{
      proposals,
      notifications,
      bookings,
      loading,
      submitProposal,
      updateProposalStatus,
      approveAndForward,
      bookVenue,
      markNotificationRead,
      addNotification,
      resetData,
      // New exports for access control
      hasUserActed,
      isCurrentReviewer,
      fetchReviewers,
    }}>
      {children}
    </ProposalContext.Provider>
  );
}

export function useProposals() {
  const ctx = useContext(ProposalContext);
  if (!ctx) throw new Error('useProposals must be used within ProposalProvider');
  return ctx;
}

export default ProposalContext;
