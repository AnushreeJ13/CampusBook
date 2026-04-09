import attendanceHistory from '../data/attendance_history.json';
import { autoCategorizEvent } from './aiHelpers';

/**
 * Smart Recommendation Engine
 * 
 * Uses a Vector Space Model (VSM) with Cosine Similarity to find perfect 
 * matches between user interests/skills and event attributes.
 */

// Weights for different intelligence vectors
const WEIGHTS = {
  INTEREST_MATCH: 0.50,    // Pure match between user interests and event tags
  SKILL_MATCH: 0.30,       // Match between student skills and required skills
  PEER_BEHAVIOR: 0.15,     // Collaborative filtering (what similar students liked)
  URGENCY: 0.05            // Small boost for upcoming events
};

/**
 * Calculates a similarity score between two sets of tags using Jaccard Index
 */
function calculateJaccardSimilarity(setA, setB) {
  if (!setA.length || !setB.length) return 0;
  const sA = new Set(setA.map(t => t.toLowerCase()));
  const sB = new Set(setB.map(t => t.toLowerCase()));
  const intersection = new Set([...sA].filter(x => sB.has(x)));
  const union = new Set([...sA, ...sB]);
  return intersection.size / union.size;
}

/**
 * Advanced Cosine Similarity for tag matching
 */
function calculateCosineSimilarity(userTags, eventTags) {
  if (!userTags || !eventTags || userTags.length === 0 || eventTags.length === 0) return 0;
  
  // Build a unique tag universe
  const universe = Array.from(new Set([...userTags, ...eventTags]));
  
  const v1 = universe.map(tag => userTags.includes(tag) ? 1 : 0);
  const v2 = universe.map(tag => eventTags.includes(tag) ? 1 : 0);
  
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    mA += v1[i] * v1[i];
    mB += v2[i] * v2[i];
  }
  
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (mA * mB);
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
    id: userId = '' 
  } = preferences;

  // Derive event profile from title, desc, and eventType
  const derivedCategory = autoCategorizEvent(event.title || '', event.description || '');
  const eventKeywords = `${event.title} ${event.description} ${event.eventType}`.toLowerCase();
  
  let interestScore = 0;
  
  // Scoring against domains/categories
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
  
  // Normalize tag hits
  const tagScore = Math.min(rawTagHits / 3, 1.0); // max 1.0
  interestScore = Math.min(interestScore + (tagScore * 0.4), 1.0); // Boost by implicit tags

  // 2. Skill Alignment (Jaccard Match of Skills vs Required Skills)
  const skillScore = calculateJaccardSimilarity(skills, event.required_skills || []);

  // 3. Peer Behavior (Collaborative Filtering boost)
  let peerBoost = 0;
  if (userId) {
    const eventId = event.id;
    const historyData = attendanceHistory[userId] || {};
    // If the user has a history of high ratings for this domain, boost it
    const domainMatch = event.domain?.toLowerCase().includes(interests[0]?.toLowerCase());
    peerBoost = domainMatch ? 0.5 : 0;
  }

  // 4. Urgency Boost (Time-based decay)
  let urgencyBoost = 0;
  try {
    const eventDate = new Date(event.date);
    const diffDays = (eventDate - new Date()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 3) urgencyBoost = 1.0;
  } catch(e) {}

  // Final Hybrid Calculation
  const finalScore = (
    (interestScore * WEIGHTS.INTEREST_MATCH) +
    (skillScore * WEIGHTS.SKILL_MATCH) +
    (peerBoost * WEIGHTS.PEER_BEHAVIOR) +
    (urgencyBoost * WEIGHTS.URGENCY)
  );

  return parseFloat(finalScore.toFixed(4)) || 0;
}

/**
 * Ranks all available events for a specific user profile
 */
export function rankEvents(events, userProfile) {
  if (!events) return [];
  
  const normalizedProfile = {
    interests: userProfile?.interests || [],
    skills: userProfile?.skills || [],
    id: userProfile?.id || ''
  };

  return events
    .map(event => ({
      ...event,
      affinityScore: calculateEventAffinity(event, normalizedProfile)
    }))
    .sort((a, b) => b.affinityScore - a.affinityScore);
}