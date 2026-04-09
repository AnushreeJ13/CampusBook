/**
 * TIMETABLE ENGINE — Reuses conflictEngine + slotScorer for academic scheduling
 * "The same AI that schedules events now schedules entire academic timetables."
 */

import { PROFESSORS, SUBJECTS, CLASSROOMS, DAYS, PERIODS } from './campusData';

/**
 * Check if a slot conflicts with existing allocations.
 * Reuses the same logic pattern as conflictEngine.js
 */
function hasConflict(allocations, day, period, professorId, classroomId) {
  return allocations.some(a =>
    a.day === day && a.period === period &&
    (a.professorId === professorId || a.classroomId === classroomId)
  );
}

/**
 * Score a timetable slot — reuses slotScorer.js concepts
 * Factors: time-of-day fit, professor load, room utilization, student preference
 */
function scoreSlot(day, period, subject, professor, classroom, allocations) {
  let score = 0;

  // 1. Time-of-day fit (30 pts) — labs better in afternoon, theory in morning
  const hour = period.start;
  if (subject.type === 'lab') {
    score += (hour >= 14) ? 30 : (hour >= 11) ? 15 : 5;
  } else {
    score += (hour >= 9 && hour <= 12) ? 30 : (hour >= 14 && hour <= 16) ? 20 : 10;
  }

  // 2. Professor load balance (25 pts) — fewer classes today = better
  const profTodayCount = allocations.filter(a => a.professorId === professor.id && a.day === day).length;
  score += Math.max(0, 25 - (profTodayCount * 8));

  // 3. Room type match (20 pts) — labs in labs, lectures in lecture halls
  if (subject.type === 'lab' && classroom.type === 'lab') score += 20;
  else if (subject.type !== 'lab' && classroom.type !== 'lab') score += 20;
  else score += 5;

  // 4. Even distribution across week (15 pts)
  const subjectDayCount = allocations.filter(a => a.subjectId === subject.id && a.day === day).length;
  score += subjectDayCount === 0 ? 15 : Math.max(0, 15 - subjectDayCount * 10);

  // 5. Avoid back-to-back same subject (10 pts)
  const adjacentSame = allocations.some(a =>
    a.subjectId === subject.id && a.day === day &&
    Math.abs(a.period - period.id) === 1
  );
  score += adjacentSame ? 0 : 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate an optimized timetable using greedy + scoring approach
 * Same pattern as getTopSlots() in slotSuggester.js
 */
export function generateTimetable(department = 'CSE') {
  const allocations = [];
  const deptSubjects = SUBJECTS.filter(s => s.department === department || s.department === 'MATH' || s.department === 'PHY' || s.department === 'ENG');
  const deptProfs = PROFESSORS.filter(p => p.department === department || p.department === 'MATH' || p.department === 'PHY' || p.department === 'ENG');

  // Build allocation requests: each subject needs hoursPerWeek slots
  const requests = [];
  deptSubjects.forEach(subject => {
    const prof = deptProfs.find(p => p.subjects.includes(subject.id));
    if (!prof) return;
    for (let i = 0; i < subject.hoursPerWeek; i++) {
      requests.push({ subject, professor: prof });
    }
  });

  // Shuffle requests for variety
  requests.sort(() => Math.random() - 0.5);

  // Greedy allocation with scoring
  for (const req of requests) {
    let bestSlot = null;
    let bestScore = -1;

    for (const day of DAYS) {
      for (const period of PERIODS) {
        // Skip lunch period
        if (period.start === 12) continue;

        for (const classroom of CLASSROOMS) {
          if (hasConflict(allocations, day, period.id, req.professor.id, classroom.id)) continue;

          // Check professor max hours
          const profDayHours = allocations.filter(a => a.professorId === req.professor.id && a.day === day).length;
          if (profDayHours >= req.professor.maxHoursPerDay) continue;

          const slotScore = scoreSlot(day, period, req.subject, req.professor, classroom, allocations);

          if (slotScore > bestScore) {
            bestScore = slotScore;
            bestSlot = { day, period: period.id, periodLabel: period.label, classroomId: classroom.id, classroomName: classroom.name };
          }
        }
      }
    }

    if (bestSlot) {
      allocations.push({
        ...bestSlot,
        subjectId: req.subject.id,
        subjectName: req.subject.name,
        subjectCode: req.subject.code,
        subjectColor: req.subject.color,
        subjectType: req.subject.type,
        professorId: req.professor.id,
        professorName: req.professor.name,
        professorAvatar: req.professor.avatar,
        score: bestScore,
      });
    }
  }

  return allocations;
}

/**
 * Detect timetable conflicts — same pattern as conflictEngine
 */
export function detectTimetableConflicts(allocations) {
  const conflicts = [];

  for (let i = 0; i < allocations.length; i++) {
    for (let j = i + 1; j < allocations.length; j++) {
      const a = allocations[i];
      const b = allocations[j];

      if (a.day === b.day && a.period === b.period) {
        if (a.professorId === b.professorId) {
          conflicts.push({
            type: 'professor_overlap',
            severity: 'error',
            message: `${a.professorName} double-booked on ${a.day} Period ${a.period}`,
            slots: [a, b],
          });
        }
        if (a.classroomId === b.classroomId) {
          conflicts.push({
            type: 'room_overlap',
            severity: 'error',
            message: `${a.classroomName} double-booked on ${a.day} Period ${a.period}`,
            slots: [a, b],
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Get timetable statistics
 */
export function getTimetableStats(allocations) {
  const profLoad = {};
  const roomUsage = {};
  
  allocations.forEach(a => {
    profLoad[a.professorId] = (profLoad[a.professorId] || 0) + 1;
    roomUsage[a.classroomId] = (roomUsage[a.classroomId] || 0) + 1;
  });

  const totalSlots = DAYS.length * (PERIODS.length - 1); // minus lunch
  const uniqueRooms = Object.keys(roomUsage).length;
  const avgRoomUtil = uniqueRooms > 0 ? Math.round((Object.values(roomUsage).reduce((a, b) => a + b, 0) / (uniqueRooms * totalSlots)) * 100) : 0;

  return {
    totalAllocations: allocations.length,
    uniqueProfessors: Object.keys(profLoad).length,
    uniqueRooms,
    avgProfLoad: Math.round(Object.values(profLoad).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(profLoad).length) * 10) / 10,
    roomUtilization: Math.min(100, avgRoomUtil),
    conflicts: detectTimetableConflicts(allocations).length,
  };
}
