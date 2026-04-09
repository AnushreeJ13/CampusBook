import { db, isConfigured } from './firebase';
import { 
  doc, 
  getDoc,
  getDocs, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// Listeners helper
export const subscribeToCollection = (collectionName, callback, filters = []) => {
    if (!isConfigured || !db) return () => {};
    
    let q = collection(db, collectionName);
    if (filters.length > 0) {
        q = query(q, ...filters);
    }
    
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
    });
};

// --- PROPOSALS ---
export const saveProposal = async (proposal) => {
    if (!isConfigured || !db) return;
    const { id, ...data } = proposal;
    const docRef = doc(db, "proposals", id || `p${Date.now()}`);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

// --- NOTIFICATIONS ---
export const saveNotification = async (notification) => {
    if (!isConfigured || !db) return;
    const { id, ...data } = notification;
    const docRef = doc(db, "notifications", id || `n${Date.now()}`);
    await setDoc(docRef, { ...data, createdAt: data.createdAt || serverTimestamp() }, { merge: true });
};

export const markNotifRead = async (notifId) => {
    if (!isConfigured || !db) return;
    const docRef = doc(db, "notifications", notifId);
    await updateDoc(docRef, { read: true });
};

// --- BOOKINGS ---
export const saveBooking = async (booking) => {
    if (!isConfigured || !db) return;
    const { id, ...data } = booking;
    const docRef = doc(db, "bookings", id || `b${Date.now()}`);
    await setDoc(docRef, data, { merge: true });
};

// --- BOOKING HISTORY ---
export const saveBookingHistory = async (historyEntry) => {
    if (!isConfigured || !db) return;
    const { venueId, eventType, status } = historyEntry;
    const historyId = `${venueId}_${eventType}`;
    const docRef = doc(db, "bookingHistory", historyId);
    
    // We want to update approvalRate: count approvals / total reviews
    // Since we don't have atomic counters easily here without more logic, 
    // we'll fetch existing and update.
    const snap = await getDoc(docRef);
    let data = snap.exists() ? snap.data() : { total: 0, approvals: 0, approvalRate: 0.5 };
    
    data.total += 1;
    if (status === 'approved') data.approvals += 1;
    data.approvalRate = data.approvals / data.total;
    data.venueId = venueId;
    data.eventType = eventType;
    data.lastUpdated = serverTimestamp();

    await setDoc(docRef, data, { merge: true });
};

// Legacy support if needed
export const syncBackend = async (data) => {
    console.warn("syncBackend is deprecated, use individual save functions.");
};

export const fetchAllBackendData = async () => {
    // This is now handled by onSnapshot listeners in Context
    return null; 
};
