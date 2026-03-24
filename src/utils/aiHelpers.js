import { PROPOSAL_STATUS, EVENT_TYPES } from './constants';

export function calculateReadinessScore(proposal) {
  let score = 0;
  let total = 0;
  const flags = [];

  // Title (10 points)
  total += 10;
  if (proposal.title && proposal.title.trim().length > 5) {
    score += 10;
  } else if (proposal.title && proposal.title.trim().length > 0) {
    score += 5;
    flags.push({ type: 'warning', message: 'Event title is too short — consider a more descriptive name' });
  } else {
    flags.push({ type: 'error', message: 'Event title is required' });
  }

  // Event Type (10 points)
  total += 10;
  if (proposal.eventType) {
    score += 10;
  } else {
    flags.push({ type: 'error', message: 'Please select an event type' });
  }

  // Description (15 points)
  total += 15;
  if (proposal.description && proposal.description.trim().length > 100) {
    score += 15;
  } else if (proposal.description && proposal.description.trim().length > 30) {
    score += 8;
    flags.push({ type: 'warning', message: 'Description could be more detailed (aim for 100+ characters)' });
  } else {
    flags.push({ type: 'error', message: 'Event description is too brief or missing' });
  }

  // Expected Attendees (10 points)
  total += 10;
  if (proposal.expectedAttendees && proposal.expectedAttendees > 0) {
    score += 10;
  } else {
    flags.push({ type: 'error', message: 'Expected attendee count is required' });
  }

  // Date & Time (15 points)
  total += 15;
  if (proposal.date) {
    score += 8;
    if (proposal.timeSlot) {
      score += 7;
    } else {
      flags.push({ type: 'warning', message: 'Time slot not selected' });
    }
  } else {
    flags.push({ type: 'error', message: 'Event date is required' });
  }

  // Venue (10 points)
  total += 10;
  if (proposal.venueId) {
    score += 10;
  } else {
    flags.push({ type: 'warning', message: 'No venue preference selected' });
  }

  // Resources (10 points)
  total += 10;
  if (proposal.resources && proposal.resources.trim().length > 10) {
    score += 10;
  } else if (proposal.resources && proposal.resources.trim().length > 0) {
    score += 5;
    flags.push({ type: 'info', message: 'Consider listing resources in more detail' });
  } else {
    flags.push({ type: 'info', message: 'No resources listed — add if applicable' });
    score += 3; // some events don't need listed resources
  }

  // Documents (10 points)
  total += 10;
  if (proposal.documents && proposal.documents.length > 0) {
    score += 10;
  } else {
    flags.push({ type: 'warning', message: 'No supporting documents uploaded (speaker IDs, permissions, etc.)' });
  }

  // Capacity Check (10 points)
  total += 10;
  if (proposal.venueId && proposal.expectedAttendees && proposal.venueCapacity) {
    if (proposal.expectedAttendees <= proposal.venueCapacity) {
      score += 10;
    } else {
      flags.push({ type: 'error', message: `Capacity mismatch: ${proposal.expectedAttendees} attendees > venue capacity of ${proposal.venueCapacity}` });
    }
  } else {
    score += 5; // partial credit if not all info available
  }

  const percentage = Math.round((score / total) * 100);

  return {
    score: percentage,
    flags,
    level: percentage >= 85 ? 'excellent' : percentage >= 65 ? 'good' : percentage >= 40 ? 'fair' : 'poor',
    label: percentage >= 85 ? 'Ready to Submit' : percentage >= 65 ? 'Almost Ready' : percentage >= 40 ? 'Needs Work' : 'Incomplete',
  };
}

export function autoCategorizEvent(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();

  const categories = {
    technical: ['hackathon', 'coding', 'workshop', 'tech', 'programming', 'ai', 'ml', 'software', 'hardware', 'robotics', 'web', 'app', 'development', 'data', 'cyber', 'cloud', 'iot', 'algorithm'],
    cultural: ['cultural', 'dance', 'music', 'drama', 'art', 'painting', 'singing', 'poetry', 'theatre', 'fashion', 'talent', 'performance', 'fest'],
    academic: ['seminar', 'lecture', 'talk', 'conference', 'research', 'paper', 'presentation', 'guest lecture', 'symposium', 'panel', 'discussion', 'orientation'],
    sports: ['sports', 'cricket', 'football', 'basketball', 'badminton', 'athletics', 'marathon', 'yoga', 'fitness', 'tournament', 'match'],
    social: ['meetup', 'community', 'networking', 'social', 'alumni', 'farewell', 'welcome', 'orientation', 'team building', 'volunteer'],
  };

  const scores = {};
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = keywords.filter(kw => text.includes(kw)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted[0][1] === 0) return { primary: 'general', secondary: null, confidence: 'low' };

  return {
    primary: sorted[0][0],
    secondary: sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null,
    confidence: sorted[0][1] >= 3 ? 'high' : sorted[0][1] >= 2 ? 'medium' : 'low',
  };
}

export function detectConflicts(proposal, existingProposals, venues) {
  const conflicts = [];

  if (!proposal.date || !proposal.timeSlot || !proposal.venueId) return conflicts;

  // Check venue double booking
  const venueConflicts = existingProposals.filter(p =>
    p.id !== proposal.id &&
    p.venueId === proposal.venueId &&
    p.date === proposal.date &&
    p.timeSlot === proposal.timeSlot &&
    ![PROPOSAL_STATUS.REJECTED, PROPOSAL_STATUS.DRAFT].includes(p.status)
  );

  if (venueConflicts.length > 0) {
    conflicts.push({
      type: 'venue_conflict',
      severity: 'error',
      message: `Venue is already booked for this slot by "${venueConflicts[0].title}"`,
    });
  }

  // Check same club double booking on same day
  const clubConflicts = existingProposals.filter(p =>
    p.id !== proposal.id &&
    p.clubId === proposal.clubId &&
    p.date === proposal.date &&
    ![PROPOSAL_STATUS.REJECTED, PROPOSAL_STATUS.DRAFT].includes(p.status)
  );

  if (clubConflicts.length > 0) {
    conflicts.push({
      type: 'club_conflict',
      severity: 'warning',
      message: `Your society already has an event on this date: "${clubConflicts[0].title}"`,
    });
  }

  // Check capacity mismatch
  if (proposal.venueId && proposal.expectedAttendees) {
    const venue = venues.find(v => v.id === proposal.venueId);
    if (venue && proposal.expectedAttendees > venue.capacity) {
      conflicts.push({
        type: 'capacity_conflict',
        severity: 'error',
        message: `Expected attendees (${proposal.expectedAttendees}) exceed venue capacity (${venue.capacity})`,
      });
    }
  }

  return conflicts;
}

export function generateAISummary(proposal) {
  const category = autoCategorizEvent(proposal.title, proposal.description);
  const readiness = calculateReadinessScore(proposal);

  const riskFlags = [];
  if (proposal.expectedAttendees > 200) riskFlags.push('Large-scale event — may need extra oversight');
  if (readiness.score < 60) riskFlags.push('Proposal completeness is low');
  if (category.confidence === 'low') riskFlags.push('Event category unclear — verify with proposer');

  return {
    category,
    readiness,
    riskFlags,
    summary: `${category.primary.charAt(0).toUpperCase() + category.primary.slice(1)} event${category.secondary ? ` / ${category.secondary}` : ''} with ${proposal.expectedAttendees || '?'} expected attendees. Readiness: ${readiness.score}%.`,
  };
}
