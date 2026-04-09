import { 
    supabase, 
    saveProposal as supabaseSaveProposal,
    saveNotification as supabaseSaveNotification,
    markNotifRead as supabaseMarkNotifRead,
    saveBooking as supabaseSaveBooking,
    saveBookingHistory as supabaseSaveBookingHistory,
    saveVenue as supabaseSaveVenue,
    deleteVenue as supabaseDeleteVenue,
    saveAttendanceSession as supabaseSaveAttendanceSession,
    updateAttendanceSession as supabaseUpdateAttendanceSession,
    markAttendance as supabaseMarkAttendance,
    saveUserProfile as supabaseSaveUserProfile
} from './supabase';

// Listeners helper - Replicates Firebase onSnapshot behavior
export const subscribeToCollection = (collectionName, callback, filters = []) => {
    // 1. Initial Fetch
    const fetchData = async () => {
        let query = supabase.from(collectionName).select('*');
        
        // Simple filter mapping
        filters.forEach(f => {
            // Placeholder for filter logic
        });

        const { data, error } = await query;
        if (error) {
            console.warn(`Supabase Error (${collectionName}):`, error.message);
            callback([]); // Trigger fallback manually to prevent hanging UI
        } else {
            callback(data || []);
        }
    };

    fetchData();

    // 2. Subscribe to changes and re-fetch
    const channelId = `pub-${collectionName}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, (payload) => {
            console.log(`Realtime update for ${collectionName}:`, payload);
            fetchData();
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to ${collectionName}`);
            }
        });
    
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

// --- VENUES ---
export const saveVenue = async (venue) => {
    return await supabaseSaveVenue(venue);
};

export const deleteVenue = async (id) => {
    return await supabaseDeleteVenue(id);
};

// --- ATTENDANCE ---
export const saveAttendanceSession = async (session) => {
    return await supabaseSaveAttendanceSession(session);
};

export const updateAttendanceSession = async (id, updates) => {
    return await supabaseUpdateAttendanceSession(id, updates);
};

export const markAttendance = async (record) => {
    return await supabaseMarkAttendance(record);
};

// --- PROFILE ---
export const saveUserProfile = async (profile) => {
    return await supabaseSaveUserProfile(profile);
};

// Legacy support
export const syncBackend = async (data) => {};
export const fetchAllBackendData = async () => null;

