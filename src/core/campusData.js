/**
 * CAMPUS INTELLIGENCE PLATFORM — Master Data
 * Rich mock data for timetable, campus map, attendance, and cross-domain engine
 */

// ============================================
// CAMPUS MAP — Buildings & Zones
// ============================================
export const CAMPUS_BUILDINGS = [
  // Academic Buildings
  { id: 'b1', name: 'CSE Department', short: 'CSE', type: 'academic', x: 180, y: 60, w: 130, h: 75, capacity: 600, floors: 4, color: '#6c63ff', amenities: ['Labs', 'Smart Boards', 'AC'] },
  { id: 'b2', name: 'ECE Department', short: 'ECE', type: 'academic', x: 340, y: 55, w: 120, h: 70, capacity: 500, floors: 3, color: '#8b83ff', amenities: ['Labs', 'Antenna Lab'] },
  { id: 'b3', name: 'Mechanical Dept', short: 'MECH', type: 'academic', x: 490, y: 50, w: 120, h: 70, capacity: 450, floors: 3, color: '#5b8def', amenities: ['Workshop', 'CNC Lab'] },
  { id: 'b4', name: 'Civil Engineering', short: 'CIVIL', type: 'academic', x: 50, y: 140, w: 110, h: 65, capacity: 400, floors: 3, color: '#4f9cf7', amenities: ['Survey Lab', 'Materials Lab'] },
  { id: 'b5', name: 'MBA Block', short: 'MBA', type: 'academic', x: 640, y: 58, w: 100, h: 60, capacity: 300, floors: 2, color: '#a78bfa', amenities: ['Seminar Room', 'AC'] },

  // Venue Buildings
  { id: 'b6', name: 'Main Auditorium', short: 'AUD', type: 'venue', x: 280, y: 190, w: 160, h: 90, capacity: 500, floors: 1, color: '#e85d9b', venueId: 'v1', amenities: ['Stage', 'Sound System', 'Green Room'] },
  { id: 'b7', name: 'Seminar Complex', short: 'SEM', type: 'venue', x: 490, y: 180, w: 120, h: 70, capacity: 300, floors: 2, color: '#f5a524', venueId: 'v2', amenities: ['Projectors', 'AC', 'Recording'] },

  // Library
  { id: 'b8', name: 'Central Library', short: 'LIB', type: 'library', x: 50, y: 250, w: 120, h: 100, capacity: 800, floors: 5, color: '#0ea5e9', amenities: ['8000+ Books', 'Digital Journals', 'e-Library', 'Reading Halls'] },

  // Hostels
  { id: 'b9', name: "Boys Hostel A", short: 'BH-A', type: 'hostel', x: 680, y: 160, w: 90, h: 110, capacity: 400, floors: 6, color: '#64748b', amenities: ['Mess', 'Common Room', 'WiFi'] },
  { id: 'b10', name: "Boys Hostel B", short: 'BH-B', type: 'hostel', x: 680, y: 290, w: 90, h: 100, capacity: 350, floors: 5, color: '#7c8ea6', amenities: ['Mess', 'TV Room', 'WiFi'] },
  { id: 'b11', name: "Girls Hostel", short: 'GH', type: 'hostel', x: 680, y: 410, w: 90, h: 100, capacity: 350, floors: 5, color: '#f9a8d4', amenities: ['Mess', 'Common Room', 'Security'] },

  // Faculty
  { id: 'b12', name: 'Faculty Residences', short: 'FAC-R', type: 'faculty_res', x: 550, y: 420, w: 100, h: 70, capacity: 80, floors: 3, color: '#94a3b8', amenities: ['Parking', 'Garden'] },

  // Sports
  { id: 'b13', name: 'Sports Complex', short: 'SPX', type: 'sports', x: 320, y: 380, w: 150, h: 90, capacity: 1000, floors: 1, color: '#2ac9a8', amenities: ['Cricket Ground', 'Basketball', 'Gym', 'Track'] },
  { id: 'b14', name: 'Playground', short: 'PLAY', type: 'sports', x: 150, y: 400, w: 130, h: 75, capacity: 500, floors: 0, color: '#34d399', amenities: ['Football Field', 'Volleyball', 'Badminton'] },

  // Health
  { id: 'b15', name: 'Health Center', short: 'HC', type: 'health', x: 50, y: 380, w: 80, h: 60, capacity: 50, floors: 1, color: '#ef4444', amenities: ['OPD', 'Pharmacy', 'Emergency', 'Ambulance'] },

  // Student Center & Admin
  { id: 'b16', name: 'Student Center', short: 'STU', type: 'social', x: 200, y: 280, w: 130, h: 65, capacity: 600, floors: 2, color: '#ec4899', amenities: ['Canteen', 'Clubs', 'ATM'] },
  { id: 'b17', name: 'Admin Building', short: 'ADM', type: 'admin', x: 400, y: 310, w: 110, h: 60, capacity: 200, floors: 3, color: '#f59e0b', amenities: ['Dean Office', 'Registrar', 'Exam Cell'] },

  // Cafeteria
  { id: 'b18', name: 'Central Cafeteria', short: 'CAF', type: 'mess', x: 520, y: 310, w: 100, h: 55, capacity: 350, floors: 1, color: '#f97316', amenities: ['Multi-cuisine', 'Juice Bar'] },
];

export const CAMPUS_PATHS = [
  // Academic interconnections
  { from: 'b1', to: 'b2', flow: 0.9 },
  { from: 'b2', to: 'b3', flow: 0.6 },
  { from: 'b1', to: 'b4', flow: 0.4 },
  { from: 'b3', to: 'b5', flow: 0.3 },

  // Academic → Venues
  { from: 'b1', to: 'b6', flow: 0.5 },
  { from: 'b2', to: 'b7', flow: 0.5 },

  // Library connections
  { from: 'b4', to: 'b8', flow: 0.6 },
  { from: 'b1', to: 'b8', flow: 0.7 },

  // Hostel → Academic
  { from: 'b9', to: 'b1', flow: 0.8 },
  { from: 'b10', to: 'b3', flow: 0.7 },
  { from: 'b11', to: 'b2', flow: 0.7 },

  // Hostel → Cafeteria/Mess
  { from: 'b9', to: 'b18', flow: 0.9 },
  { from: 'b10', to: 'b18', flow: 0.8 },
  { from: 'b11', to: 'b18', flow: 0.8 },

  // Student Center hub
  { from: 'b6', to: 'b16', flow: 0.7 },
  { from: 'b16', to: 'b17', flow: 0.4 },
  { from: 'b16', to: 'b13', flow: 0.6 },
  { from: 'b16', to: 'b8', flow: 0.5 },

  // Sports & Health
  { from: 'b13', to: 'b14', flow: 0.5 },
  { from: 'b15', to: 'b16', flow: 0.3 },
  { from: 'b13', to: 'b9', flow: 0.4 },

  // Faculty residence
  { from: 'b12', to: 'b17', flow: 0.4 },
  { from: 'b12', to: 'b1', flow: 0.3 },
];

// ============================================
// TIMETABLE — Professors, Subjects, Classrooms
// ============================================
export const PROFESSORS = [
  { id: 'prof1', name: 'Dr. Meera Sharma', department: 'CSE', subjects: ['sub1', 'sub2'], avatar: '👩‍🏫', maxHoursPerDay: 4 },
  { id: 'prof2', name: 'Dr. Rajesh Kumar', department: 'CSE', subjects: ['sub3', 'sub4'], avatar: '👨‍🏫', maxHoursPerDay: 4 },
  { id: 'prof3', name: 'Dr. Priya Nair', department: 'ECE', subjects: ['sub5', 'sub6'], avatar: '👩‍🔬', maxHoursPerDay: 3 },
  { id: 'prof4', name: 'Dr. Amit Joshi', department: 'MATH', subjects: ['sub7', 'sub8'], avatar: '🧑‍🏫', maxHoursPerDay: 5 },
  { id: 'prof5', name: 'Dr. Kavitha Rao', department: 'CSE', subjects: ['sub9', 'sub10'], avatar: '👩‍💻', maxHoursPerDay: 4 },
  { id: 'prof6', name: 'Dr. Suresh Patel', department: 'PHY', subjects: ['sub11'], avatar: '👨‍🔬', maxHoursPerDay: 3 },
  { id: 'prof7', name: 'Dr. Anita Desai', department: 'ENG', subjects: ['sub12'], avatar: '📚', maxHoursPerDay: 4 },
  { id: 'prof8', name: 'Dr. Vikram Reddy', department: 'CSE', subjects: ['sub13', 'sub14'], avatar: '🧑‍💻', maxHoursPerDay: 4 },
];

export const SUBJECTS = [
  { id: 'sub1', name: 'Data Structures', code: 'CS201', department: 'CSE', credits: 4, hoursPerWeek: 4, type: 'core', color: '#6c63ff' },
  { id: 'sub2', name: 'Algorithms', code: 'CS301', department: 'CSE', credits: 4, hoursPerWeek: 3, type: 'core', color: '#8b83ff' },
  { id: 'sub3', name: 'Database Systems', code: 'CS302', department: 'CSE', credits: 3, hoursPerWeek: 3, type: 'core', color: '#3b82f6' },
  { id: 'sub4', name: 'Operating Systems', code: 'CS303', department: 'CSE', credits: 4, hoursPerWeek: 4, type: 'core', color: '#2563eb' },
  { id: 'sub5', name: 'Digital Electronics', code: 'EC201', department: 'ECE', credits: 3, hoursPerWeek: 3, type: 'core', color: '#e85d9b' },
  { id: 'sub6', name: 'Signal Processing', code: 'EC301', department: 'ECE', credits: 3, hoursPerWeek: 3, type: 'core', color: '#f07db5' },
  { id: 'sub7', name: 'Linear Algebra', code: 'MA201', department: 'MATH', credits: 3, hoursPerWeek: 3, type: 'core', color: '#f5a524' },
  { id: 'sub8', name: 'Probability & Stats', code: 'MA301', department: 'MATH', credits: 3, hoursPerWeek: 3, type: 'core', color: '#f7b84e' },
  { id: 'sub9', name: 'Machine Learning', code: 'CS401', department: 'CSE', credits: 4, hoursPerWeek: 4, type: 'elective', color: '#2ac9a8' },
  { id: 'sub10', name: 'Computer Networks', code: 'CS402', department: 'CSE', credits: 3, hoursPerWeek: 3, type: 'core', color: '#4dd8be' },
  { id: 'sub11', name: 'Physics Lab', code: 'PH201', department: 'PHY', credits: 2, hoursPerWeek: 2, type: 'lab', color: '#ef4444' },
  { id: 'sub12', name: 'Technical Writing', code: 'EN101', department: 'ENG', credits: 2, hoursPerWeek: 2, type: 'core', color: '#a855f7' },
  { id: 'sub13', name: 'Cloud Computing', code: 'CS501', department: 'CSE', credits: 3, hoursPerWeek: 3, type: 'elective', color: '#0ea5e9' },
  { id: 'sub14', name: 'Cybersecurity', code: 'CS502', department: 'CSE', credits: 3, hoursPerWeek: 3, type: 'elective', color: '#64748b' },
];

export const CLASSROOMS = [
  { id: 'cr1', name: 'Room 101', building: 'b1', floor: 1, capacity: 60, type: 'lecture', amenities: ['Projector', 'AC', 'Whiteboard'] },
  { id: 'cr2', name: 'Room 102', building: 'b1', floor: 1, capacity: 60, type: 'lecture', amenities: ['Projector', 'AC'] },
  { id: 'cr3', name: 'Room 201', building: 'b1', floor: 2, capacity: 40, type: 'tutorial', amenities: ['Whiteboard', 'AC'] },
  { id: 'cr4', name: 'Room 301', building: 'b1', floor: 3, capacity: 80, type: 'lecture', amenities: ['Projector', 'AC', 'Sound System'] },
  { id: 'cr5', name: 'Lab A', building: 'b2', floor: 1, capacity: 30, type: 'lab', amenities: ['Computers', 'Projector', 'AC'] },
  { id: 'cr6', name: 'Lab B', building: 'b2', floor: 2, capacity: 30, type: 'lab', amenities: ['Computers', 'Projector', 'AC'] },
  { id: 'cr7', name: 'Room 401', building: 'b2', floor: 3, capacity: 50, type: 'lecture', amenities: ['Projector', 'AC'] },
  { id: 'cr8', name: 'Seminar Hall A', building: 'b4', floor: 1, capacity: 150, type: 'seminar', amenities: ['Projector', 'Sound System', 'AC'] },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const PERIODS = [
  { id: 1, label: '9:00 – 10:00', start: 9, end: 10 },
  { id: 2, label: '10:00 – 11:00', start: 10, end: 11 },
  { id: 3, label: '11:00 – 12:00', start: 11, end: 12 },
  { id: 4, label: '12:00 – 1:00', start: 12, end: 13 },
  { id: 5, label: '2:00 – 3:00', start: 14, end: 15 },
  { id: 6, label: '3:00 – 4:00', start: 15, end: 16 },
  { id: 7, label: '4:00 – 5:00', start: 16, end: 17 },
];

// ============================================
// ATTENDANCE & FEEDBACK — Simulated Data
// ============================================
export const SIMULATED_EVENTS = [
  { id: 'se1', title: 'CodeFest 2026', type: 'hackathon', date: '2026-04-05', venueId: 'v2', expectedAttendees: 120, actualAttendees: 98, rating: 4.3, feedbackCount: 67, society: 'Tech Society' },
  { id: 'se2', title: 'Startup Pitch Night', type: 'talk', date: '2026-03-28', venueId: 'v2', expectedAttendees: 80, actualAttendees: 72, rating: 4.7, feedbackCount: 52, society: 'Tech Society' },
  { id: 'se3', title: 'Spring Cultural Fest', type: 'cultural', date: '2026-03-15', venueId: 'v1', expectedAttendees: 400, actualAttendees: 380, rating: 4.5, feedbackCount: 210, society: 'Cultural Club' },
  { id: 'se4', title: 'AI Workshop', type: 'workshop', date: '2026-03-10', venueId: 'v2', expectedAttendees: 50, actualAttendees: 44, rating: 4.8, feedbackCount: 38, society: 'Tech Society' },
  { id: 'se5', title: 'Cricket Tournament', type: 'sports', date: '2026-03-01', venueId: 'v1', expectedAttendees: 200, actualAttendees: 65, rating: 3.2, feedbackCount: 20, society: 'Sports Club' },
  { id: 'se6', title: 'Poetry Night', type: 'cultural', date: '2026-02-20', venueId: 'v2', expectedAttendees: 100, actualAttendees: 35, rating: 2.8, feedbackCount: 12, society: 'Literary Club' },
  { id: 'se7', title: 'Cloud Computing Seminar', type: 'talk', date: '2026-02-15', venueId: 'v2', expectedAttendees: 60, actualAttendees: 55, rating: 4.1, feedbackCount: 40, society: 'Tech Society' },
  { id: 'se8', title: 'Annual Sports Day', type: 'sports', date: '2026-02-01', venueId: 'v1', expectedAttendees: 500, actualAttendees: 420, rating: 4.6, feedbackCount: 180, society: 'Sports Club' },
];

export const FEEDBACK_TAGS = [
  '🎯 Well Organized', '⏰ On Time', '🎤 Great Speakers', '🍕 Good Food',
  '📍 Nice Venue', '💡 Learned a Lot', '🎶 Fun!', '📱 Interactive',
  '⚠️ Too Crowded', '😴 Boring', '🕐 Too Long', '📌 Needs Improvement'
];

// ============================================
// CROSS-DOMAIN ENGINE — Showcase Data
// ============================================
export const CROSS_DOMAIN_MODULES = [
  { id: 'events', name: 'Event Management', status: 'live', icon: '🎪', engine: 'conflictEngine + slotScorer', stats: { active: 12, resolved: 89 }, description: 'Smart event scheduling with AI conflict resolution' },
  { id: 'timetable', name: 'Academic Timetable', status: 'live', icon: '📅', engine: 'conflictEngine + slotScorer', stats: { active: 8, resolved: 156 }, description: 'Automated timetable generation for departments' },
  { id: 'hostel', name: 'Hostel Management', status: 'ready', icon: '🏠', engine: 'workflowEngine', stats: { active: 0, resolved: 0 }, description: 'Room allocation + complaint workflow' },
  { id: 'mess', name: 'Mess / Cafeteria', status: 'ready', icon: '🍽️', engine: 'attendanceEngine', stats: { active: 0, resolved: 0 }, description: 'Menu planning + attendance tracking' },
  { id: 'transport', name: 'Transport', status: 'ready', icon: '🚌', engine: 'schedulingEngine', stats: { active: 0, resolved: 0 }, description: 'Bus route scheduling + demand prediction' },
  { id: 'library', name: 'Library System', status: 'ready', icon: '📚', engine: 'recommendationEngine', stats: { active: 0, resolved: 0 }, description: 'Book recommendations + seat management' },
];

// ============================================
// HELPER: Generate time-of-day activity data
// ============================================
export function generateHourlyActivity() {
  const hours = [];
  for (let h = 8; h <= 21; h++) {
    let base;
    if (h >= 9 && h <= 11) base = 0.7 + Math.random() * 0.3;      // Morning peak
    else if (h >= 12 && h <= 13) base = 0.3 + Math.random() * 0.2; // Lunch dip
    else if (h >= 14 && h <= 16) base = 0.6 + Math.random() * 0.3; // Afternoon
    else if (h >= 17 && h <= 19) base = 0.5 + Math.random() * 0.4; // Evening events
    else base = 0.1 + Math.random() * 0.2;                          // Low hours
    hours.push({ hour: h, label: `${h}:00`, activity: Math.round(base * 100) });
  }
  return hours;
}

// Generate building activity levels based on time
export function getBuildingActivity(buildings, hour) {
  const now = new Date();
  const currentHour = hour ?? now.getHours();
  
  return buildings.map(b => {
    let activity;
    if (b.type === 'academic') {
      activity = (currentHour >= 9 && currentHour <= 16) ? 0.5 + Math.random() * 0.5 : 0.05 + Math.random() * 0.1;
    } else if (b.type === 'venue') {
      activity = (currentHour >= 10 && currentHour <= 20) ? 0.3 + Math.random() * 0.6 : 0;
    } else if (b.type === 'sports') {
      activity = (currentHour >= 16 && currentHour <= 19) ? 0.6 + Math.random() * 0.4 : 0.1;
    } else if (b.type === 'hostel') {
      activity = (currentHour >= 20 || currentHour <= 8) ? 0.8 + Math.random() * 0.2 : 0.2;
    } else if (b.type === 'mess') {
      activity = ([8,9,12,13,19,20].includes(currentHour)) ? 0.7 + Math.random() * 0.3 : 0.1;
    } else if (b.type === 'social') {
      activity = (currentHour >= 11 && currentHour <= 21) ? 0.4 + Math.random() * 0.5 : 0.1;
    } else {
      activity = (currentHour >= 9 && currentHour <= 17) ? 0.3 + Math.random() * 0.3 : 0.05;
    }
    
    const status = activity > 0.7 ? 'busy' : activity > 0.3 ? 'moderate' : activity > 0.05 ? 'light' : 'empty';
    const occupants = Math.round(b.capacity * activity);
    
    return { ...b, activity: Math.round(activity * 100), status, occupants };
  });
}
