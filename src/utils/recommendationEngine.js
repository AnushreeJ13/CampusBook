// Removed static attendanceHistory import
import { autoCategorizEvent } from './aiHelpers';

/**
 * Smart Recommendation Engine
 * 
 * Uses a Vector Space Model (VSM) with Cosine Similarity to find perfect 
 * matches between user interests/skills and event attributes.
 */

// Weights for different intelligence vectors
const WEIGHTS = {
  INTEREST_MATCH: 0.45,    // Pure match between user interests and event tags
  SKILL_MATCH: 0.40,       // Boosted weight for student skills
  PAST_HISTORY: 0.10,      // Reduced weight to focus on profile fit
  URGENCY: 0.05            // Small boost for upcoming events
};

/**
 * Calculates a similarity score between two sets of tags using Jaccard Index
 */
function calculateSkillOverlap(userSkills, eventRequiredSkills) {
  if (!eventRequiredSkills || !eventRequiredSkills.length) return 1.0; // No requirements = full fit
  if (!userSkills.length) return 0;
  
  const userSet = new Set(userSkills.map(t => t.toLowerCase()));
  const requiredSet = new Set(eventRequiredSkills.map(t => t.toLowerCase()));
  
  const intersectionSize = [...requiredSet].filter(x => userSet.has(x)).length;
  
  // Return ratio of required skills that the user has
  return intersectionSize / requiredSet.size;
}

const DOMAIN_TO_TAGS = {
  tech: ['ai', 'machine_learning', 'web_development', 'react', 'python', 'cybersecurity', 'data_analysis', 'open_source', 'coding'],
  culture: ['music', 'arts', 'dance', 'fest', 'drama', 'creative', 'exhibition'],
  social: ['networking', 'fun', 'party', 'meetup', 'volunteering', 'community'],
  academic: ['research', 'lecture', 'workshop', 'career', 'placement', 'internship', 'study'],
  sports: ['cricket', 'football', 'basketball', 'fitness', 'yoga', 'gaming', 'esports']
};

/**
 * Calculates a personal match score for an event
 */
export function calculateEventAffinity(event, preferences = {}) {
  const {
    interests = [],
    skills = [],
    historicalDomains = {}
  } = preferences;

  // Derive event profile from title, desc, and eventType
  const derivedCategory = autoCategorizEvent(event.title || '', event.description || '');
  const eventKeywords = `${event.title} ${event.description} ${event.eventType}`.toLowerCase();

  let interestScore = 0;

  // 1. Interest Matching (Content Filtering)
  const lowerInterests = interests.map(i => i.toLowerCase());
  if (lowerInterests.includes(derivedCategory.primary)) {
    interestScore += 0.7; // Strong match for primary category
  }
  if (derivedCategory.secondary && lowerInterests.includes(derivedCategory.secondary)) {
    interestScore += 0.3; // Moderate match for secondary category
  }

  // Fallback keyword matching (in case standard categories missed it)
  const expandedUserTags = [
    ...interests,
    ...interests.flatMap(i => DOMAIN_TO_TAGS[i.toLowerCase()] || [])
  ];

  let rawTagHits = 0;
  expandedUserTags.forEach(tag => {
    if (eventKeywords.includes(tag.toLowerCase())) {
      rawTagHits++;
    }
  });

  const tagScore = Math.min(rawTagHits / 3, 1.0); 
  interestScore = Math.min(interestScore + (tagScore * 0.4), 1.0); 

  // 2. Skill Alignment (Ratio of required skills the student possesses)
  const skillScore = calculateSkillOverlap(skills, event.required_skills || event.skills || []);

  // 3. Past History Boost (Dynamic from Backend joinedEvents)
  let historyBoost = 0;
  const thisCategory = derivedCategory.primary;
  if (thisCategory && historicalDomains[thisCategory]) {
    // If they've attended 3 or more events in this category, give maximum boost
    const attendCount = historicalDomains[thisCategory];
    historyBoost = Math.min(attendCount / 3, 1.0);
  }

  // 4. Urgency Boost (Time-based decay)
  let urgencyBoost = 0;
  try {
    const eventDate = new Date(event.date);
    const diffDays = (eventDate - new Date()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 3) urgencyBoost = 1.0;
  } catch (e) { }

  // Final Hybrid Calculation
  const finalScore = (
    (interestScore * WEIGHTS.INTEREST_MATCH) +
    (skillScore * WEIGHTS.SKILL_MATCH) +
    (historyBoost * WEIGHTS.PAST_HISTORY) +
    (urgencyBoost * WEIGHTS.URGENCY)
  );

  return parseFloat(finalScore.toFixed(4)) || 0;
}

/**
 * Ranks all available events for a specific user profile
 */
export function rankEvents(events, userProfile) {
  if (!events) return [];

  // Calculate historical domain preferences based on real joinedEvents array
  const joinedEventIds = userProfile?.joinedEvents || [];
  const historicalDomains = {};
  
  if (joinedEventIds.length > 0) {
    const pastEvents = events.filter(e => joinedEventIds.includes(e.id));
    pastEvents.forEach(e => {
       const cat = autoCategorizEvent(e.title || '', e.description || '').primary;
       if (cat) {
         historicalDomains[cat] = (historicalDomains[cat] || 0) + 1;
       }
    });
  }

  const normalizedProfile = {
    interests: userProfile?.interests || [],
    skills: userProfile?.skills || [],
    historicalDomains // Pass the calculated history down to the engine
  };

  return events
    .map(event => ({
      ...event,
      affinityScore: calculateEventAffinity(event, normalizedProfile)
    }))
    .sort((a, b) => b.affinityScore - a.affinityScore);
}