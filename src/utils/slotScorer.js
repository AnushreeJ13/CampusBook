/**
 * Pure function to score a candidate slot.
 * @param {Object} slot { start: Date, end: Date }
 * @param {string} eventType 
 * @param {string} venueId 
 * @param {Object} historicalData { [combo]: { approvalRate: number } }
 * @param {number} reviewerPendingCount Calculated externally
 * @returns {Object} { slot, score, label, reason }
 */
export function scoreSlot(slot, eventType, venueId, historicalData, reviewerPendingCount) {
  let score = 70; // Base score
  const key = `${venueId}_${eventType}`;
  const history = historicalData[key] || { approvalRate: 0.5 };
  
  // 1. Historical ML Weighting (Intelligence Engine)
  // Boost slots that have higher historical approval rates for this venue/event combo
  const approvalBoost = (history.approvalRate - 0.5) * 40; 
  score += approvalBoost;

  // 2. Day-of-week Bias (Students are more active mid-week)
  const day = slot.start.getDay();
  if ([2, 3, 4].includes(day)) score += 10; // Tue-Thu boost
  if (day === 6) score -= 15; // Saturday penalty

  // 3. Reviewer Load Penalty
  // If many proposals are pending, favor slots further out to give reviewers time
  const daysFromNow = (slot.start - new Date()) / (1000 * 60 * 60 * 24);
  if (daysFromNow < 3 && reviewerPendingCount > 5) {
      score -= 20;
  } else if (daysFromNow > 7) {
      score += 5; // Planning ahead boost
  }

  const startHour = slot.start.getHours();
  
  // 1. Time-of-day fit (30 pts)
  const isSocial = ['cultural', 'fest', 'meetup', 'sports', 'social'].includes(eventType.toLowerCase());
  const isAcademic = ['workshop', 'talk', 'hackathon', 'competition', 'academic'].includes(eventType.toLowerCase());

  if (isSocial) {
    if (startHour >= 16 && startHour <= 20) {
      score += 30;
    } else if (startHour >= 14 || startHour >= 21) {
      score += 15; // Partial
    }
  } else if (isAcademic) {
    if (startHour >= 9 && startHour <= 17) {
      score += 30;
    } else if (startHour >= 8 || startHour <= 18) {
      score += 15; // Partial
    }
  } else {
    score += 20; // Default
  }

  // 2. Historical approval rate (40 pts)
  const historyKey = `${venueId}_${eventType}`;
  const approvalRate = historicalData[historyKey]?.approvalRate ?? 0.5;
  score += (approvalRate * 40);

  // 3. Reviewer load penalty (up to -20 pts)
  const penalty = Math.min(reviewerPendingCount * 5, 20);
  score -= penalty;

  // 4. Recency bonus (10 pts)
  const now = new Date();
  const diffDays = (slot.start - now) / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) {
    score += 10;
  }

  // Final normalization
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Label and Reason
  let label = 'Available';
  let reason = 'Available but historically lower engagement for this event type';

  if (score >= 75) {
    label = 'Best fit';
    reason = `Top pick — ${Math.round(approvalRate * 100)}% past approval rate for ${eventType} events in this venue`;
  } else if (score >= 50) {
    label = 'Good option';
    const timeReason = startHour >= 16 ? 'evening' : 'daytime';
    reason = `Good ${timeReason} slot, reviewer turnaround typically fast`;
  }

  return { slot, score, label, reason };
}
