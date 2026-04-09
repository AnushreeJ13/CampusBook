import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getConflictsSync } from './conflictEngine';
import { scoreSlot } from './slotScorer';

/**
 * Orchestrator to find the best available slots.
 * @param {string} venueId 
 * @param {string} eventType 
 * @param {number} durationMinutes 
 * @param {Date|string} preferredDate 
 * @param {string} societyId
 * @returns {Promise<Array>} Top 3 suggested slots
 */
export async function getTopSlots(venueId, eventType, durationMinutes, preferredDate, societyId) {
  const candidates = [];
  const startDay = new Date(preferredDate);
  startDay.setHours(9, 0, 0, 0);

  // 1. Generate candidate slots for the next 14 days
  for (let day = 0; day < 14; day++) {
    const currentDay = new Date(startDay);
    currentDay.setDate(startDay.getDate() + day);

    // Skip Sundays (0), include Saturdays (6)
    if (currentDay.getDay() === 0) continue;

    for (let hour = 9; hour < 21; hour++) {
      for (let min of [0, 30]) {
        const slotStart = new Date(currentDay);
        slotStart.setHours(hour, min, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);

        // Limit to 9 PM
        if (slotEnd.getHours() > 21 || (slotEnd.getHours() === 21 && slotEnd.getMinutes() > 0)) continue;

        candidates.push({ start: slotStart, end: slotEnd });
      }
    }
  }

  const limit = candidates.slice(0, 60);
  
  // Notice we moved Step 3 (Fetches) ABOVE Step 2 (Filtering) so we have memory arrays natively!

  // 3. Fetch Historical Data & Reviewer Load
  const historicalData = {};
  let reviewerPendingCount = 0;
  let activeBookings = [];
  let venueData = null;
  
  try {
    // A) Fetch Historical Data
    const historyRef = collection(db, 'bookingHistory');
    const historySnap = await getDocs(historyRef);
    historySnap.forEach(doc => {
      const data = doc.data();
      const key = `${data.venueId}_${data.eventType}`;
      historicalData[key] = { approvalRate: data.approvalRate || 0.5 };
    });

    // B) Fetch Venue specific details (status)
    const venueRef = doc(db, 'venues', venueId);
    const venueSnap = await getDoc(venueRef);
    if (venueSnap.exists()) {
      venueData = venueSnap.data();
    }

    // C) Fetch Active Bookings 
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(bookingsRef, where('status', 'in', ['approved', 'pending', 'confirmed']));
    const bookingsSnap = await getDocs(bookingsQuery);
    bookingsSnap.forEach((doc) => {
      activeBookings.push(doc.data());
    });

    // D) Fetch pending review count for scoring penalty
    const proposalsRef = collection(db, 'proposals');
    const pendingQuery = query(proposalsRef, where('status', 'in', ['submitted', 'faculty_review', 'hod_review', 'admin_review']));
    const pendingSnap = await getDocs(pendingQuery);
    reviewerPendingCount = pendingSnap.size;
  } catch (error) {
    console.warn("Slot Suggester Firebase fetch Error, defaulting scores:", error);
  }

  // 2. Filter conflicts (CPU-bound)
  const filteredCandidates = [];
  for (const candidate of limit) {
    const conflicts = getConflictsSync(venueData, activeBookings, venueId, candidate.start, candidate.end, societyId);
    if (conflicts.length === 0) {
      filteredCandidates.push(candidate);
    }
    if (filteredCandidates.length >= 20) break; // Enough candidates to score
  }

  // 4. Score clean slots
  const scoredSlots = filteredCandidates.map(slot => 
    scoreSlot(slot, eventType, venueId, historicalData, reviewerPendingCount)
  );

  // 5. Sort and return top 3
  return scoredSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
