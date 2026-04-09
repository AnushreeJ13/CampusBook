import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_PROPOSALS, MOCK_NOTIFICATIONS, MOCK_BOOKINGS } from '../utils/mockData';
import { PROPOSAL_STATUS } from '../utils/constants';
import { 
  saveProposal, 
  saveNotification, 
  saveBooking, 
  saveBookingHistory,
  markNotifRead, 
  subscribeToCollection 
} from '../api';
import { useAuth } from './AuthContext';
import { sendStatusEmail } from '../utils/mailer';
import { MOCK_USERS } from '../utils/mockData';

const ProposalContext = createContext(null);

export function ProposalProvider({ children }) {
  const { user, selectedCollege } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- REAL-TIME SUBSCRIPTIONS --
  useEffect(() => {
    if (!user || !selectedCollege) {
      setLoading(false);
      return;
    }

    const collegeId = selectedCollege.id;

    const unsubProposals = subscribeToCollection('proposals', (data) => {
        let localDrafts = [];
        try {
            const saved = localStorage.getItem(`campusos_drafts_${collegeId}`);
            if (saved) localDrafts = JSON.parse(saved);
        } catch(e) {}

        // Filter by college_id
        let combined = data.filter(p => p.collegeId === collegeId);
        
        MOCK_PROPOSALS.forEach(mock => {
           if (mock.collegeId === collegeId && !combined.find(d => d.id === mock.id)) {
             combined.push(mock);
           }
        });

        localDrafts.forEach(draft => {
           if (!combined.find(d => d.id === draft.id)) combined.unshift(draft);
        });

        setProposals(combined);
    });

    const unsubNotifs = subscribeToCollection('notifications', (data) => {
        const combined = [...data];
        MOCK_NOTIFICATIONS.forEach(mock => {
           if (mock.collegeId === collegeId && !data.find(d => d.id === mock.id)) {
             combined.push(mock);
           }
        });
        setNotifications(combined.filter(n => n.userId === user.uid || n.userId === user.id));
    });

    const unsubBookings = subscribeToCollection('bookings', (data) => {
        const combined = [...data];
        MOCK_BOOKINGS.forEach(mock => {
           if (mock.collegeId === collegeId && !data.find(d => d.id === mock.id)) {
             combined.push(mock);
           }
        });
        setBookings(combined);
        setLoading(false);
    });

    return () => {
        unsubProposals();
        unsubNotifs();
        unsubBookings();
    };
  }, [user, selectedCollege]);

  // -- ACTIONS --

  const addNotification = useCallback(async (notification) => {
    const newNotif = { 
        ...notification, 
        id: `n${Date.now()}`, 
        collegeId: selectedCollege?.id,
        read: false, 
        createdAt: new Date().toISOString() 
    };
    await saveNotification(newNotif);
  }, [selectedCollege]);

  const submitProposal = useCallback(async (proposal) => {
    const newProposal = {
      ...proposal,
      id: `p${Date.now()}`,
      collegeId: selectedCollege?.id,
      status: PROPOSAL_STATUS.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedBy: user.id || user.uid || 'guest',
      submittedByName: user.name || user.displayName || 'Unknown User',
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
    
    // Save to local drafts
    try {
        const collegeId = selectedCollege?.id;
        const saved = localStorage.getItem(`campusos_drafts_${collegeId}`);
        const localDrafts = saved ? JSON.parse(saved) : [];
        localDrafts.unshift(newProposal);
        localStorage.setItem(`campusos_drafts_${collegeId}`, JSON.stringify(localDrafts));
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
      userId: proposal.currentReviewer || 'FACULTY_UID', // Mock or real UID
      type: 'submission',
      title: 'New Proposal',
      message: `${proposal.clubName} submitted "${proposal.title}" for review`,
      proposalId: newProposal.id,
    });
    
    return newProposal;
  }, [user, addNotification]);

  const updateProposalStatus = useCallback(async (proposalId, newStatus, reviewerId, reviewerName, note, nextReviewer) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

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

    const updatedProposal = {
      ...proposal,
      status: newStatus,
      currentReviewer: nextReviewer || null,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || []), auditEntry],
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

    // Notifications
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
  }, [proposals, addNotification]);

  const approveAndForward = useCallback(async (proposalId, reviewerId, reviewerName, note, nextStatus, nextReviewer) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const auditEntries = [
      { action: 'approved', by: reviewerId, byName: reviewerName, at: new Date().toISOString(), note: note || 'Approved' },
      { action: 'forwarded', by: reviewerId, byName: reviewerName, at: new Date().toISOString(), note: `Forwarded to next authority` },
    ];

    const updatedProposal = {
      ...proposal,
      status: nextStatus,
      currentReviewer: nextReviewer,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(proposal.auditTrail || []), ...auditEntries],
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
  }, [proposals]);

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
