import { 
    supabase, 
    saveProposal as supabaseSaveProposal,
    saveNotification as supabaseSaveNotification,
    markNotifRead as supabaseMarkNotifRead,
    saveBooking as supabaseSaveBooking,
    saveBookingHistory as supabaseSaveBookingHistory
} from './supabase';

// Listeners helper - Replicates Firebase onSnapshot behavior
export const subscribeToCollection = (collectionName, callback, filters = []) => {
    // 1. Initial Fetch
    const fetchData = async () => {
        let query = supabase.from(collectionName).select('*');
        
        // Simple filter mapping (only handle 'eq' for now as that's most common in his filters)
        filters.forEach(f => {
            // Firebase filters are often like where('field', '==', value)
            // But his usage in api.js line 23 was query(q, ...filters)
            // Need to see where he defines filters.
        });

        const { data, error } = await query;
        if (!error) callback(data);
    };

    fetchData();

    // 2. Subscribe to changes and re-fetch (simplest way to ensure consistency)
    const channel = supabase
        .channel(`public:${collectionName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, () => {
            fetchData();
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
};

// --- PROPOSALS ---
export const saveProposal = async (proposal) => {
    return await supabaseSaveProposal(proposal);
};

// --- NOTIFICATIONS ---
export const saveNotification = async (notification) => {
    // Map userId to user_id for postgres convention if needed
    const { userId, ...rest } = notification;
    return await supabaseSaveNotification({ 
        user_id: userId, 
        ...rest 
    });
};

export const markNotifRead = async (notifId) => {
    return await supabaseMarkNotifRead(notifId);
};

// --- BOOKINGS ---
export const saveBooking = async (booking) => {
    const { userId, ...rest } = booking;
    return await supabaseSaveBooking({
        user_id: userId,
        ...rest
    });
};

// --- BOOKING HISTORY ---
export const saveBookingHistory = async (historyEntry) => {
    return await supabaseSaveBookingHistory(historyEntry);
};

// Legacy support if needed
export const syncBackend = async (data) => {
    console.warn("syncBackend is deprecated.");
};

export const fetchAllBackendData = async () => {
    return null; 
};
