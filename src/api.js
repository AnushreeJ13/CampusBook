<<<<<<< HEAD
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
=======
/**
 * Backend API layer for CampusBook
 */
import { supabase } from './supabase';
>>>>>>> 1bac6ff (whatsapp feature)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Generic fetch wrapper
const fetchFromBackend = async (endpoint, options = {}) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!res.ok) {
        let errMsg = 'API Error';
        try {
            const err = await res.json();
            errMsg = err.error || err.message || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
    }
    return res.json();
};

export const submitProposalToBackend = async (proposal) => {
    return await fetchFromBackend('/api/proposals', {
        method: 'POST',
        body: JSON.stringify(proposal),
    });
};

export const updateProposalToBackend = async (id, updates) => {
    return await fetchFromBackend(`/api/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
};

export const registerWhatsAppUser = async (registration) => {
    return await fetchFromBackend('/api/whatsapp/users/register', {
        method: 'POST',
        body: JSON.stringify(registration),
    });
};

export const checkWhatsAppStatus = async (userId) => {
    return await fetchFromBackend(`/api/whatsapp/users/status/${userId}`);
};

export const disableWhatsApp = async (userId) => {
    return await fetchFromBackend('/api/whatsapp/users/disable', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
};

export const subscribeToCollection = (collectionName, callback) => {
    const fetchData = async () => {
<<<<<<< HEAD
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
=======
        const { data } = await supabase.from(collectionName).select('*');
        if (data) callback(data);
>>>>>>> 1bac6ff (whatsapp feature)
    };
    fetchData();
<<<<<<< HEAD

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
=======
    const ch = supabase.channel(`public:${collectionName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, fetchData)
        .subscribe();
    return () => supabase.removeChannel(ch);
>>>>>>> 1bac6ff (whatsapp feature)
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

