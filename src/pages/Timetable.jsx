import { useState, useCallback, useMemo } from 'react';
import { generateTimetable, getTimetableStats, detectTimetableConflicts } from '../core/timetableEngine';
import { DAYS, PERIODS, CROSS_DOMAIN_MODULES } from '../core/campusData';
import { Sparkles, Calendar, AlertTriangle, CheckCircle, RefreshCw, BookOpen, Users, Building2 } from 'lucide-react';
import './Timetable.css';

const DEPARTMENTS = ['CSE', 'ECE'];

export default function Timetable() {
  const [department, setDepartment] = useState('CSE');
  const [timetable, setTimetable] = useState(null);
  const [stats, setStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(0);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    // Simulate AI processing delay
    setTimeout(() => {
      const allocs = generateTimetable(department);
      setTimetable(allocs);
      setStats(getTimetableStats(allocs));
      setConflicts(detectTimetableConflicts(allocs));
      setGenerating(false);
      setGenCount(c => c + 1);
    }, 1500);
  }, [department]);

  // Build grid data: day → period → allocation
  const gridData = useMemo(() => {
    if (!timetable) return {};
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      PERIODS.forEach(period => {
        grid[day][period.id] = timetable.find(a => a.day === day && a.period === period.id) || null;
      });
    });
    return grid;
  }, [timetable]);

  return (
    <div className="tt-container">
      {/* Hero */}
      <div className="tt-hero animate-fade-in">
        <div className="tt-hero-content">
          <div className="flex items-center gap-sm" style={{ marginBottom: 4 }}>
            <Sparkles size={16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>AI-Powered Engine</span>
          </div>
          <h1>Academic Timetable Generator</h1>
          <p>Same conflict engine that schedules events — now generates entire academic timetables</p>
          <div className="tt-hero-actions">
            <button className={`tt-generate-btn ${generating ? 'generating' : ''}`} onClick={handleGenerate} disabled={generating}>
              {generating ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              {generating ? 'Generating...' : genCount > 0 ? 'Regenerate Timetable' : 'Generate Timetable'}
            </button>
            {DEPARTMENTS.map(d => (
              <button
                key={d}
                className={`tt-filter-btn ${department === d ? 'active' : ''}`}
                onClick={() => setDepartment(d)}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: department === d ? 'rgba(255,255,255,0.2)' : 'transparent' }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="tt-stats">
          <div className="tt-stat-card animate-card-entrance stagger-1">
            <div className="tt-stat-value">{stats.totalAllocations}</div>
            <div className="tt-stat-label"><BookOpen size={10} /> Classes Scheduled</div>
          </div>
          <div className="tt-stat-card animate-card-entrance stagger-2">
            <div className="tt-stat-value">{stats.uniqueProfessors}</div>
            <div className="tt-stat-label"><Users size={10} /> Professors</div>
          </div>
          <div className="tt-stat-card animate-card-entrance stagger-3">
            <div className="tt-stat-value">{stats.uniqueRooms}</div>
            <div className="tt-stat-label"><Building2 size={10} /> Rooms Used</div>
          </div>
          <div className="tt-stat-card animate-card-entrance stagger-4">
            <div className="tt-stat-value" style={{ color: stats.conflicts === 0 ? '#22c55e' : '#ef4444' }}>
              {stats.conflicts === 0 ? '✓' : stats.conflicts}
            </div>
            <div className="tt-stat-label"><AlertTriangle size={10} /> Conflicts</div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {timetable ? (
        <div className="tt-grid-wrapper animate-card-entrance stagger-2">
          <div className="tt-grid-header">
            <h2><Calendar size={16} style={{ opacity: 0.5 }} /> Weekly Schedule — {department} Department</h2>
            {conflicts.length === 0 ? (
              <span className="tt-conflict-badge" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                <CheckCircle size={12} /> Zero Conflicts
              </span>
            ) : (
              <span className="tt-conflict-badge" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <AlertTriangle size={12} /> {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="tt-grid-scroll">
            <div className="tt-grid">
              {/* Header row */}
              <div className="tt-grid-cell header">Period</div>
              {DAYS.map(day => (
                <div key={day} className="tt-grid-cell header">{day.slice(0, 3)}</div>
              ))}

              {/* Grid rows */}
              {PERIODS.map(period => (
                <>
                  <div key={`label-${period.id}`} className="tt-grid-cell period-label">
                    <span style={{ fontWeight: 700 }}>P{period.id}</span>
                    <span>{period.label}</span>
                  </div>
                  {DAYS.map(day => {
                    if (period.start === 12) {
                      return <div key={`${day}-${period.id}`} className="tt-grid-cell lunch">🍽️</div>;
                    }
                    const slot = gridData[day]?.[period.id];
                    if (!slot) {
                      return <div key={`${day}-${period.id}`} className="tt-grid-cell tt-empty-cell" />;
                    }
                    return (
                      <div
                        key={`${day}-${period.id}`}
                        className="tt-slot"
                        style={{
                          background: `${slot.subjectColor}12`,
                          borderLeftColor: slot.subjectColor,
                        }}
                        title={`${slot.subjectName} | ${slot.professorName} | ${slot.classroomName} | Score: ${slot.score}`}
                      >
                        <span className="tt-slot-subject">{slot.subjectName}</span>
                        <span className="tt-slot-code">{slot.subjectCode}</span>
                        <span className="tt-slot-meta">{slot.professorAvatar} {slot.classroomName}</span>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-md)'
        }}>
          <Sparkles size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <h3 style={{ marginBottom: 4, fontSize: 'var(--font-md)' }}>AI Timetable Engine Ready</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
            Click "Generate Timetable" to create an optimized schedule using the conflict engine
          </p>
        </div>
      )}

      {/* Cross-Domain Engine Showcase */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>🧩 Cross-Domain Engine — Same AI, Different Domains</h3>
        <div className="tt-cross-domain">
          {CROSS_DOMAIN_MODULES.slice(0, 6).map((mod, i) => (
            <div key={mod.id} className={`tt-domain-card animate-card-entrance stagger-${i + 1}`}>
              <div className="tt-domain-icon">{mod.icon}</div>
              <div className="tt-domain-name">{mod.name}</div>
              <div className="tt-domain-desc">{mod.description}</div>
              <div className={`tt-domain-status ${mod.status}`}>
                {mod.status === 'live' ? '● Live' : '○ Schema Ready'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
