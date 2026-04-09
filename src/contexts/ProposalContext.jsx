import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { PROPOSAL_STATUS } from '../utils/constants';
import localEvents from '../data/events.json';
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

const ProposalContext = createContext(null);

export function ProposalProvider({ children }) {
  const { user, selectedCollege } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- REAL-TIME SUBSCRIPTIONS --
  useEffect(() => {
    if (!user || !selectedCollege) {
      setLoading(false);
      return;
    }

    const collegeId = selectedCollege?.id;
    if (!collegeId) {
      setLoading(false);
      return;
    }

    const unsubProposals = subscribeToCollection('proposals', (data) => {
        // Filter by college_id
        const combined = data.filter(p => p.collegeId === collegeId);
        setProposals(combined);
    });



    const unsubBookings = subscribeToCollection('bookings', (data) => {
        const combined = data.filter(b => b.collegeId === collegeId || !b.collegeId);
        setBookings(combined);
        setLoading(false);
    });

    return () => {
        unsubProposals();
        unsubBookings();
    };
  }, [user, selectedCollege]);

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
        collegeId: selectedCollege?.id || 'all', // Make visible globally if needed
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
        currentReviewer: 'vijay@gmail.com', // faculty
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
    
    // Optimistically update
    setProposals(prev => [newProposal, ...prev]);

    try {
      await saveProposal(newProposal);
    } catch(e) {
      console.error("Supabase write failed:", e);
    }
    
    // Notify appropriate reviewer
    addNotification({
      userId: proposal.currentReviewer || 'FACULTY_UID',
      type: 'submission',
      title: 'New Proposal',
      message: `${proposal.clubName} submitted "${proposal.title}" for review`,
      proposalId: newProposal.id,
    });
    
    return newProposal;
  }, [user, addNotification, selectedCollege]);

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
      collegeId: selectedCollege?.id,
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
  }, [proposals, addNotification, selectedCollege]);

  const markNotificationRead = useCallback(async (notifId) => {
    await markNotifRead(notifId);
  }, []);

  const resetData = useCallback(() => {
    console.log("Resetting data...");
  }, []);

  return (
    <ProposalContext.Provider value={{
      proposals: mergedProposals,
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

