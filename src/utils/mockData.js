import { PROPOSAL_STATUS, ROLES } from './constants';

export const MOCK_USERS = [
  { id: 'u1', name: 'Anushree Jain', email: 'anushree@university.edu', role: ROLES.STUDENT, avatar: '👩‍🎓' },
  { id: 'u2', name: 'Riya Sharma', email: 'riya@university.edu', role: ROLES.SOCIETY, clubId: 'c1', clubName: 'Tech Society', avatar: '👩‍💻' },
  { id: 'u4', name: 'Vijay', email: 'vijay@gmail.com', role: ROLES.FACULTY, assignedClubs: ['c1'], avatar: '👨‍🏫' },
  { id: 'u6', name: 'Vikram Singh', email: 'vikram@university.edu', role: ROLES.ADMIN, avatar: '🛡️' }
];

export const MOCK_CLUBS = [
  { id: 'c1', name: 'Tech Society', description: 'Technology and innovation events', facultyAdvisorId: 'u4', leaderId: 'u2', memberCount: 85 }
];

export const MOCK_VENUES = [
  {
    id: 'v1',
    name: 'Main Auditorium',
    type: 'auditorium',
    capacity: 500,
    description: 'State-of-the-art auditorium with projection, lighting, and sound system',
    amenities: ['Projector', 'Sound System', 'AC'],
    image: '🎭',
    allowedEventTypes: ['fest', 'talk', 'cultural'],
    blockedDates: ['2026-04-01'],
  },
  {
    id: 'v2',
    name: 'Seminar Hall A',
    type: 'seminar_hall',
    capacity: 150,
    description: 'Modern seminar hall with tiered seating and AV equipment',
    amenities: ['Projector', 'Whiteboard', 'AC'],
    image: '🎓',
    allowedEventTypes: ['workshop', 'talk', 'hackathon'],
    blockedDates: [],
  }
];

const today = new Date();
const formatDate = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const MOCK_PROPOSALS = [
  {
    id: 'p1',
    title: 'CodeFest 2026 — Annual Hackathon',
    eventType: 'hackathon',
    description: 'A 24-hour coding marathon where students build innovative solutions.',
    expectedAttendees: 120,
    date: formatDate(10),
    timeSlot: 'morning_1',
    venueId: 'v2',
    clubId: 'c1',
    clubName: 'Tech Society',
    submittedBy: 'u2',
    submittedByName: 'Riya Sharma',
    resources: 'Projector, Wi-Fi access',
    documents: [],
    status: PROPOSAL_STATUS.FACULTY_REVIEW,
    currentReviewer: 'u4',
    createdAt: formatDate(-3),
    updatedAt: formatDate(-1),
    auditTrail: [
      { action: 'created', by: 'u2', byName: 'Riya Sharma', at: formatDate(-3), note: 'Proposal created' }
    ],
  },
  {
    id: 'p2',
    title: 'Startup Pitch Night',
    eventType: 'talk',
    description: 'Students present their startup ideas to a panel of entrepreneurs.',
    expectedAttendees: 80,
    date: formatDate(25),
    timeSlot: 'evening_1',
    venueId: 'v2',
    clubId: 'c1',
    clubName: 'Tech Society',
    submittedBy: 'u2',
    submittedByName: 'Riya Sharma',
    resources: 'Projector, Stage mic',
    documents: [],
    status: PROPOSAL_STATUS.APPROVED,
    currentReviewer: null,
    createdAt: formatDate(-14),
    updatedAt: formatDate(-5),
    auditTrail: [
      { action: 'created', by: 'u2', byName: 'Riya Sharma', at: formatDate(-14), note: 'Draft created' }
    ],
  }
];

export const MOCK_BOOKINGS = [
  { id: 'b1', venueId: 'v2', proposalId: 'p2', date: formatDate(25), timeSlot: 'evening_1', status: 'confirmed' }
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', userId: 'u2', type: 'revision', title: 'Revision Requested', message: 'Please update your pitch deck', proposalId: 'p2', read: false, createdAt: formatDate(-4) },
];
