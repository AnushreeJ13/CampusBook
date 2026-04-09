import { supabase } from '../supabase';
import { PROPOSAL_STATUS } from './constants';

const MOCK_PROPOSALS = [
  {
    title: "Neural Network Architecture Deep-Dive",
    clubName: "AI Research Group",
    category: "TECH",
    eventType: "workshop",
    description: "A detailed workshop on transformer architectures and neural networks.",
    expectedAttendance: 120,
    status: PROPOSAL_STATUS.APPROVED
  },
  {
    title: "Esports Arena Championship",
    clubName: "Gaming Collective",
    category: "ESPORTS",
    eventType: "competition",
    description: "The primary competitive event for regional high-perf gaming.",
    expectedAttendance: 500,
    status: PROPOSAL_STATUS.APPROVED
  },
  {
    title: "Inter-College Hackathon",
    clubName: "Open Source Society",
    category: "TECH",
    eventType: "hackathon",
    description: "24-hour coding marathon focused on university systems.",
    expectedAttendance: 300,
    status: PROPOSAL_STATUS.APPROVED
  },
  {
    title: "Cultural Fusion Night",
    clubName: "Arts Club",
    category: "CULTURE",
    eventType: "fest",
    description: "A multi-domain cultural merger.",
    expectedAttendance: 800,
    status: PROPOSAL_STATUS.APPROVED
  },
  {
    title: "Quantum Computing Seminar",
    clubName: "Physics Society",
    category: "TECH",
    eventType: "talk",
    description: "Breaking the limits of classical computing.",
    expectedAttendance: 150,
    status: PROPOSAL_STATUS.APPROVED
  }
];

const MOCK_VENUES = [
  { name: "Main Auditorium", type: "auditorium", capacity: 1000, features: ["AC", "Projector", "Sound System"] },
  { name: "Tech Lab Alpha", type: "lab", capacity: 60, features: ["High-Perf Workstations"] },
  { name: "Seminar Hall 1", type: "seminar_hall", capacity: 200, features: ["Smart Board", "Hybrid Connect"] }
];

export const seedCollegeData = async (collegeId) => {
  if (!collegeId) return;

  console.log(`[DatabaseSeeder] Initiating data seeding for: ${collegeId}`);

  try {
    // 1. Check if venues exist
    const { data: existingVenues } = await supabase
      .from('venues')
      .select('id')
      .eq('collegeId', collegeId)
      .limit(1);

    if (!existingVenues || existingVenues.length === 0) {
      console.log(`[DatabaseSeeder] Seeding Venues...`);
      const venuesToSave = MOCK_VENUES.map(v => ({
        ...v,
        collegeId,
        id: `v_${collegeId}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString()
      }));
      await supabase.from('venues').upsert(venuesToSave);
    }

    // 2. Check if APPROVED proposals exist
    const { data: approvedProposals } = await supabase
      .from('proposals')
      .select('id')
      .eq('collegeId', collegeId)
      .eq('status', PROPOSAL_STATUS.APPROVED)
      .limit(1);

    if (!approvedProposals || approvedProposals.length === 0) {
      console.log(`[DatabaseSeeder] Seeding Proposals (Live Events)...`);
      const proposalsToSave = MOCK_PROPOSALS.map((p, idx) => ({
        ...p,
        id: `p_${collegeId}_${Math.random().toString(36).substr(2, 5)}`,
        collegeId,
        createdAt: new Date(Date.now() - (idx * 3600000)).toISOString(),
        updatedAt: new Date().toISOString(),
        submittedBy: 'system',
        submittedByName: 'System',
        venueId: `v_${collegeId}_main`, // Primary signal sector
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: 'morning_2',
        auditTrail: [{ action: 'seeded', by: 'system', byName: 'System', at: new Date().toISOString(), note: 'Initial system data seeding' }]
      }));
      await supabase.from('proposals').upsert(proposalsToSave);
    }
    
    console.log(`[DatabaseSeeder] Seeding Complete for ${collegeId}`);
  } catch (err) {
    console.error("[DatabaseSeeder] Failed:", err);
  }
};
