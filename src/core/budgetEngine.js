/**
 * BUDGET + APPROVAL INTELLIGENCE ENGINE
 * AI-powered budget estimation and approval probability scoring
 */

const BUDGET_MODELS = {
  hackathon: { base: 15000, perHead: 200, venueMultiplier: 1.2 },
  workshop: { base: 5000, perHead: 100, venueMultiplier: 1.0 },
  talk: { base: 3000, perHead: 50, venueMultiplier: 0.8 },
  cultural: { base: 25000, perHead: 150, venueMultiplier: 1.5 },
  fest: { base: 50000, perHead: 250, venueMultiplier: 2.0 },
  sports: { base: 10000, perHead: 80, venueMultiplier: 1.3 },
  meetup: { base: 2000, perHead: 30, venueMultiplier: 0.6 },
  competition: { base: 12000, perHead: 120, venueMultiplier: 1.1 },
};

const BUDGET_BREAKDOWN_CATEGORIES = [
  { key: 'venue', label: 'Venue & Setup', percent: 0.25 },
  { key: 'refreshments', label: 'Refreshments', percent: 0.20 },
  { key: 'marketing', label: 'Marketing & Printing', percent: 0.15 },
  { key: 'equipment', label: 'Equipment & Tech', percent: 0.15 },
  { key: 'speakers', label: 'Speaker / Guest Fees', percent: 0.10 },
  { key: 'prizes', label: 'Prizes & Rewards', percent: 0.10 },
  { key: 'miscellaneous', label: 'Miscellaneous', percent: 0.05 },
];

/**
 * Estimate budget for an event based on type + attendees + venue
 */
export function estimateBudget(eventType, expectedAttendees, venueType) {
  const model = BUDGET_MODELS[eventType] || BUDGET_MODELS.meetup;
  const attendees = parseInt(expectedAttendees) || 50;
  const venueMultiplier = venueType === 'auditorium' ? 1.5 : venueType === 'open_ground' ? 0.7 : 1.0;

  const rawBudget = model.base + (attendees * model.perHead * model.venueMultiplier * venueMultiplier);
  const totalBudget = Math.round(rawBudget / 100) * 100; // Round to nearest 100

  const breakdown = BUDGET_BREAKDOWN_CATEGORIES.map(cat => ({
    ...cat,
    amount: Math.round(totalBudget * cat.percent),
  }));

  return {
    total: totalBudget,
    formatted: `₹${totalBudget.toLocaleString('en-IN')}`,
    breakdown,
    confidence: attendees > 20 ? 'high' : 'medium',
    comparable: getComparableEvents(eventType, attendees),
  };
}

function getComparableEvents(eventType, attendees) {
  const comparables = {
    hackathon: [
      { name: 'CodeFest 2025', budget: 28000, attendees: 120, rating: 4.3 },
      { name: 'HackNITR', budget: 35000, attendees: 150, rating: 4.5 },
    ],
    workshop: [
      { name: 'AI Workshop', budget: 8000, attendees: 50, rating: 4.8 },
      { name: 'Web Dev Bootcamp', budget: 6000, attendees: 40, rating: 4.1 },
    ],
    cultural: [
      { name: 'Spring Fest 2025', budget: 75000, attendees: 400, rating: 4.5 },
      { name: 'Diwali Night', budget: 45000, attendees: 300, rating: 4.7 },
    ],
    talk: [
      { name: 'Startup Pitch Night', budget: 5000, attendees: 80, rating: 4.7 },
      { name: 'Cloud Seminar', budget: 4000, attendees: 60, rating: 4.1 },
    ],
  };
  return comparables[eventType] || comparables.talk;
}

/**
 * Calculate approval probability based on historical patterns
 */
export function calculateApprovalProbability(proposal, historicalProposals = []) {
  let probability = 50; // Base 50%
  const factors = [];

  // 1. Readiness score impact (+/- 15)
  const readinessBoost = proposal.readinessScore ? (proposal.readinessScore - 50) * 0.3 : 0;
  probability += readinessBoost;
  if (readinessBoost > 5) factors.push({ label: 'High readiness score', impact: '+', color: '#22c55e' });
  if (readinessBoost < -5) factors.push({ label: 'Low readiness score', impact: '-', color: '#ef4444' });

  // 2. Event type historical approval rate (+/- 20)
  const typeRates = { hackathon: 85, workshop: 90, talk: 88, cultural: 75, fest: 65, sports: 80, meetup: 92, competition: 82 };
  const typeRate = typeRates[proposal.eventType] || 70;
  probability += (typeRate - 75) * 0.4;
  if (typeRate >= 85) factors.push({ label: `${proposal.eventType} events have ${typeRate}% approval rate`, impact: '+', color: '#22c55e' });
  if (typeRate < 70) factors.push({ label: `${proposal.eventType} events have lower approval rate`, impact: '-', color: '#f59e0b' });

  // 3. Lead time (+/- 10) — submitted early = better
  if (proposal.date) {
    const daysUntil = Math.ceil((new Date(proposal.date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 14) {
      probability += 8;
      factors.push({ label: 'Good lead time (>2 weeks)', impact: '+', color: '#22c55e' });
    } else if (daysUntil < 5) {
      probability -= 10;
      factors.push({ label: 'Very short notice (<5 days)', impact: '-', color: '#ef4444' });
    }
  }

  // 4. Venue availability (+/- 5)
  if (proposal.venueId) {
    probability += 5;
    factors.push({ label: 'Venue preference specified', impact: '+', color: '#22c55e' });
  }

  // 5. Description quality (+/- 8)
  const descLen = proposal.description?.length || 0;
  if (descLen > 100) {
    probability += 8;
    factors.push({ label: 'Detailed description provided', impact: '+', color: '#22c55e' });
  } else if (descLen < 30) {
    probability -= 5;
    factors.push({ label: 'Description too brief', impact: '-', color: '#f59e0b' });
  }

  // 6. Capacity check
  if (proposal.expectedAttendees && proposal.venueCapacity) {
    if (parseInt(proposal.expectedAttendees) <= proposal.venueCapacity) {
      probability += 5;
    } else {
      probability -= 15;
      factors.push({ label: 'Attendees exceed venue capacity', impact: '-', color: '#ef4444' });
    }
  }

  // 7. Documents attached (+5)
  if (proposal.documents && proposal.documents.length > 0) {
    probability += 5;
    factors.push({ label: 'Supporting documents attached', impact: '+', color: '#22c55e' });
  }

  // Clamp
  probability = Math.max(15, Math.min(95, Math.round(probability)));

  return {
    probability,
    level: probability >= 80 ? 'high' : probability >= 55 ? 'medium' : 'low',
    label: probability >= 80 ? 'Likely Approved' : probability >= 55 ? 'Moderate Chance' : 'Needs Improvement',
    color: probability >= 80 ? '#22c55e' : probability >= 55 ? '#f59e0b' : '#ef4444',
    factors,
  };
}

/**
 * Generate risk assessment for an event
 */
export function assessRisk(proposal) {
  const risks = [];

  if (parseInt(proposal.expectedAttendees) > 300) {
    risks.push({ level: 'medium', label: 'Large-scale event — extra security may be needed', icon: '🛡️' });
  }
  if (proposal.eventType === 'fest' || proposal.eventType === 'cultural') {
    risks.push({ level: 'low', label: 'Cultural events may require noise permits', icon: '🔊' });
  }
  if (proposal.eventType === 'hackathon') {
    risks.push({ level: 'low', label: 'Overnight event — hostel permissions needed', icon: '🌙' });
  }
  if (!proposal.resources || proposal.resources.length < 10) {
    risks.push({ level: 'medium', label: 'No resources specified — budget unclear', icon: '💰' });
  }

  return risks;
}
