export const ROLES = {
  STUDENT: 'student',
  SOCIETY: 'society',
  FACULTY: 'faculty',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.SOCIETY]: 'Society',
  [ROLES.FACULTY]: 'Faculty Advisor',
  [ROLES.ADMIN]: 'Admin',
};

export const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop', icon: '🔧' },
  { value: 'competition', label: 'Competition', icon: '🏆' },
  { value: 'fest', label: 'Fest / Festival', icon: '🎉' },
  { value: 'talk', label: 'Talk / Seminar', icon: '🎤' },
  { value: 'cultural', label: 'Cultural Event', icon: '🎭' },
  { value: 'sports', label: 'Sports Event', icon: '⚽' },
  { value: 'hackathon', label: 'Hackathon', icon: '💻' },
  { value: 'meetup', label: 'Meetup', icon: '🤝' },
];

export const VENUE_TYPES = [
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'seminar_hall', label: 'Seminar Hall' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'open_ground', label: 'Open Ground' },
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'lab', label: 'Computer Lab' },
];

export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  FACULTY_REVIEW: 'faculty_review',
  HOD_REVIEW: 'hod_review',
  ADMIN_REVIEW: 'admin_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION_REQUESTED: 'revision_requested',
  VENUE_BOOKED: 'venue_booked',
};

export const STATUS_LABELS = {
  [PROPOSAL_STATUS.DRAFT]: 'Draft',
  [PROPOSAL_STATUS.SUBMITTED]: 'Submitted',
  [PROPOSAL_STATUS.FACULTY_REVIEW]: 'Faculty Review',
  [PROPOSAL_STATUS.HOD_REVIEW]: 'HoD Review',
  [PROPOSAL_STATUS.ADMIN_REVIEW]: 'Admin Review',
  [PROPOSAL_STATUS.APPROVED]: 'Approved',
  [PROPOSAL_STATUS.REJECTED]: 'Rejected',
  [PROPOSAL_STATUS.REVISION_REQUESTED]: 'Revision Requested',
  [PROPOSAL_STATUS.VENUE_BOOKED]: 'Venue Booked',
};

export const STATUS_FLOW = [
  PROPOSAL_STATUS.SUBMITTED,
  PROPOSAL_STATUS.FACULTY_REVIEW,
  PROPOSAL_STATUS.HOD_REVIEW,
  PROPOSAL_STATUS.ADMIN_REVIEW,
  PROPOSAL_STATUS.APPROVED,
  PROPOSAL_STATUS.VENUE_BOOKED,
];

export const TIME_SLOTS = [
  { id: 'morning_1', label: '8:00 AM – 10:00 AM', start: '08:00', end: '10:00' },
  { id: 'morning_2', label: '10:00 AM – 12:00 PM', start: '10:00', end: '12:00' },
  { id: 'afternoon_1', label: '12:00 PM – 2:00 PM', start: '12:00', end: '14:00' },
  { id: 'afternoon_2', label: '2:00 PM – 4:00 PM', start: '14:00', end: '16:00' },
  { id: 'evening_1', label: '4:00 PM – 6:00 PM', start: '16:00', end: '18:00' },
  { id: 'evening_2', label: '6:00 PM – 8:00 PM', start: '18:00', end: '20:00' },
];

export const NOTIFICATION_TYPES = {
  APPROVAL: 'approval',
  REJECTION: 'rejection',
  REVISION: 'revision',
  BOOKING: 'booking',
  SUBMISSION: 'submission',
  COMMENT: 'comment',
  SOCIETY_REQUEST: 'society_request',
};

export const SOCIETY_STATUS = {
  PENDING: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
