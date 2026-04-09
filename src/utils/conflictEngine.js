// Helper for conflict detection

/**
 * Hard conflict detection for venue bookings.
 * @param {string} venueId 
 * @param {Date} startTime 
 * @param {Date} endTime 
 * @returns {Promise<Array>} Array of conflict objects
 */
/**
 * Hard conflict detection for venue bookings.
 * @param {string} venueId 
 * @param {Date} startTime 
 * @param {Date} endTime 
 * @param {string} societyId
 * @returns {Promise<Array>} Array of conflict objects
 */
export function getConflictsSync(venueData, bookings, venueId, startTime, endTime, societyId) {
  const conflicts = [];

  // 1. Check venue status
  if (venueData && (venueData.status === 'blocked' || venueData.status === 'under_maintenance')) {
    conflicts.push({ 
      type: 'venue_blocked', 
      reason: `Venue is currently ${venueData.status.replace('_', ' ')}` 
    });
    return conflicts; // Hard block
  }

  const BUFFER_MS = 15 * 60 * 1000; // 15 minute buffer
  const pStart = new Date(startTime).getTime();
  const pEnd = new Date(endTime).getTime();

  bookings.forEach((b) => {
      
      const bStart = b.startTime?.toDate ? b.startTime.toDate().getTime() : new Date(b.startTime).getTime();
      const bEnd = b.endTime?.toDate ? b.endTime.toDate().getTime() : new Date(b.endTime).getTime();

      // Case A: Same Venue (Regardless of society)
      if (b.venueId === venueId) {
        // Overlap + Buffer check
        if (pStart < (bEnd + BUFFER_MS) && pEnd > (bStart - BUFFER_MS)) {
          if (pStart < bEnd && pEnd > bStart) {
            conflicts.push({ 
              type: 'venue_overlap', 
              reason: `Venue occupied by: "${b.title || 'Other Event'}"` 
            });
          } else {
            conflicts.push({ 
              type: 'buffer_violation', 
              reason: 'Violates the 15-minute setup/teardown buffer' 
            });
          }
        }
      }

      // Case B: Same Society (Regardless of venue)
      if (societyId && b.societyId === societyId) {
        if (pStart < bEnd && pEnd > bStart) {
          conflicts.push({
            type: 'society_overlap',
            reason: `Society already has another event "${b.title}" at this time`
          });
        }
      }
    });
  return conflicts;
}
