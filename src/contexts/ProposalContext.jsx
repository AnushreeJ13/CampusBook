import { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_PROPOSALS, MOCK_NOTIFICATIONS, MOCK_BOOKINGS } from '../utils/mockData';
import { PROPOSAL_STATUS } from '../utils/constants';

const ProposalContext = createContext(null);

export function ProposalProvider({ children }) {
  const [proposals, setProposals] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbook_proposals');
      return saved ? JSON.parse(saved) : MOCK_PROPOSALS;
    } catch {
      return MOCK_PROPOSALS;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbook_notifications');
      return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbook_bookings');
      return saved ? JSON.parse(saved) : MOCK_BOOKINGS;
    } catch {
      return MOCK_BOOKINGS;
    }
  });

  const save = useCallback((key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const updated = [{ ...notification, id: `n${Date.now()}`, read: false, createdAt: new Date().toISOString().split('T')[0] }, ...prev];
      save('campusbook_notifications', updated);
      return updated;
    });
  }, [save]);

  const submitProposal = useCallback((proposal) => {
    const newProposal = {
      ...proposal,
      id: `p${Date.now()}`,
      status: PROPOSAL_STATUS.SUBMITTED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      auditTrail: [
        { action: 'created', by: proposal.submittedBy, byName: proposal.submittedByName, at: new Date().toISOString().split('T')[0], note: 'Proposal created and submitted' },
      ],
    };
    setProposals(prev => {
      const updated = [newProposal, ...prev];
      save('campusbook_proposals', updated);
      return updated;
    });
    addNotification({
      userId: proposal.currentReviewer || 'u4',
      type: 'submission',
      title: 'New Proposal',
      message: `${proposal.clubName} submitted "${proposal.title}" for review`,
      proposalId: newProposal.id,
    });
    return newProposal;
  }, [save, addNotification]);

  const updateProposalStatus = useCallback((proposalId, newStatus, reviewerId, reviewerName, note, nextReviewer) => {
    setProposals(prev => {
      const updated = prev.map(p => {
        if (p.id !== proposalId) return p;
        const auditEntry = {
          action: newStatus === PROPOSAL_STATUS.APPROVED ? 'approved'
            : newStatus === PROPOSAL_STATUS.REJECTED ? 'rejected'
            : newStatus === PROPOSAL_STATUS.REVISION_REQUESTED ? 'revision_requested'
            : 'status_changed',
          by: reviewerId,
          byName: reviewerName,
          at: new Date().toISOString().split('T')[0],
          note: note || `Status changed to ${newStatus}`,
        };
        return {
          ...p,
          status: newStatus,
          currentReviewer: nextReviewer || null,
          updatedAt: new Date().toISOString().split('T')[0],
          auditTrail: [...p.auditTrail, auditEntry],
        };
      });
      save('campusbook_proposals', updated);
      return updated;
    });

    // Create notification for proposer
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
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
    }
  }, [proposals, save, addNotification]);

  const approveAndForward = useCallback((proposalId, reviewerId, reviewerName, note, nextStatus, nextReviewer) => {
    setProposals(prev => {
      const updated = prev.map(p => {
        if (p.id !== proposalId) return p;
        const auditEntries = [
          { action: 'approved', by: reviewerId, byName: reviewerName, at: new Date().toISOString().split('T')[0], note: note || 'Approved' },
          { action: 'forwarded', by: reviewerId, byName: reviewerName, at: new Date().toISOString().split('T')[0], note: `Forwarded to next authority` },
        ];
        return {
          ...p,
          status: nextStatus,
          currentReviewer: nextReviewer,
          updatedAt: new Date().toISOString().split('T')[0],
          auditTrail: [...p.auditTrail, ...auditEntries],
        };
      });
      save('campusbook_proposals', updated);
      return updated;
    });
  }, [save]);

  const bookVenue = useCallback((proposalId) => {
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

    setBookings(prev => {
      const updated = [...prev, newBooking];
      save('campusbook_bookings', updated);
      return updated;
    });

    setProposals(prev => {
      const updated = prev.map(p => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          status: PROPOSAL_STATUS.VENUE_BOOKED,
          updatedAt: new Date().toISOString().split('T')[0],
          auditTrail: [...p.auditTrail, {
            action: 'venue_booked',
            by: 'system',
            byName: 'System',
            at: new Date().toISOString().split('T')[0],
            note: 'Venue automatically booked upon final approval',
          }],
        };
      });
      save('campusbook_proposals', updated);
      return updated;
    });

    addNotification({
      userId: proposal.submittedBy,
      type: 'booking',
      title: 'Venue Booked!',
      message: `Venue has been booked for "${proposal.title}"`,
      proposalId,
    });
  }, [proposals, save, addNotification]);

  const markNotificationRead = useCallback((notifId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
      save('campusbook_notifications', updated);
      return updated;
    });
  }, [save]);

  const resetData = useCallback(() => {
    setProposals(MOCK_PROPOSALS);
    setNotifications(MOCK_NOTIFICATIONS);
    setBookings(MOCK_BOOKINGS);
    localStorage.removeItem('campusbook_proposals');
    localStorage.removeItem('campusbook_notifications');
    localStorage.removeItem('campusbook_bookings');
  }, []);

  return (
    <ProposalContext.Provider value={{
      proposals,
      notifications,
      bookings,
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
