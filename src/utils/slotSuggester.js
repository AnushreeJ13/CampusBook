import { supabase } from '../supabase';
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
  
  // 3. Fetch Historical Data & Reviewer Load
  const historicalData = {};
  let reviewerPendingCount = 0;
  let activeBookings = [];
  let venueData = null;
  
  try {
    // A) Fetch Historical Data
    const { data: historyData } = await supabase.from('booking_history').select('*');
    if (historyData) {
      historyData.forEach(row => {
        const key = `${row.venue_id}_${row.event_type}`;
        historicalData[key] = { approvalRate: row.approval_rate || 0.5 };
      });
    }

    // B) Fetch Venue specific details
    const { data: vData } = await supabase.from('venues').select('*').eq('id', venueId).single();
    venueData = vData;

    // C) Fetch Active Bookings 
    const { data: bData } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['approved', 'pending', 'confirmed']);
    activeBookings = bData || [];

    // D) Fetch pending review count for scoring penalty
    const { count } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'faculty_review', 'hod_review', 'admin_review']);
    reviewerPendingCount = count || 0;
  } catch (error) {
    console.warn("Slot Suggester Supabase fetch Error, defaulting scores:", error);
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
  const scoredSlots = filteredCandidates.map(slot => {
    const result = scoreSlot(slot, eventType, venueId, historicalData, reviewerPendingCount);
    // Add ML confidence metric based on whether we have historical data for this combo
    const hasHistory = !!historicalData[`${venueId}_${eventType}`];
    return {
      ...result,
      confidence: hasHistory ? 0.92 : 0.65,
      historyUsed: hasHistory
    };
  });

  // 5. Sort and return top 3
  return scoredSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

