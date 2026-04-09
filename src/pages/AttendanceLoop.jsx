import { useState, useRef, useEffect, useCallback } from 'react';
import { SIMULATED_EVENTS, FEEDBACK_TAGS } from '../core/campusData';
import { QrCode, Scan, Star, Send, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import './AttendanceLoop.css';

// Canvas-based QR code generator (zero dependencies)
function drawQR(canvas, data) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = size;
  canvas.height = size;

  // Generate deterministic pattern from data string
  const seed = data.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const modules = 21; // QR version 1
  const cellSize = size / modules;

  // Use computed styles of the canvas parent to get theme colors if possible,
  // otherwise fallback to typical QR contrast.
  const parentStyle = getComputedStyle(canvas.parentElement || document.body);
  const qrBg = parentStyle.getPropertyValue('--bg-secondary').trim() || '#ffffff';
  const qrFg = parentStyle.getPropertyValue('--text-primary').trim() || '#0f172a';
  const accent = parentStyle.getPropertyValue('--accent').trim() || '#6c63ff';

  ctx.fillStyle = '#ffffff'; // Keep white for scannability
  ctx.fillRect(0, 0, size, size);

  // Draw finder patterns (the 3 corner squares)
  function drawFinder(x, y) {
    // Outer
    ctx.fillStyle = qrFg;
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
    // White
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    // Inner
    ctx.fillStyle = qrFg;
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  // Draw data modules (pseudo-random based on seed)
  ctx.fillStyle = qrFg;
  let prng = seed;
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Skip finder pattern areas
      if ((row < 8 && col < 8) || (row < 8 && col >= modules - 8) || (row >= modules - 8 && col < 8)) continue;
      // Timing patterns
      if (row === 6 || col === 6) {
        if ((row + col) % 2 === 0) ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        continue;
      }
      // Data modules
      prng = (prng * 1103515245 + 12345) & 0x7fffffff;
      if (prng % 3 !== 0) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  // Add CampusBook branding
  ctx.fillStyle = accent;
  ctx.font = 'bold 8px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAMPUSBOOK', size / 2, size - 4);
}

const TYPE_COLORS = {
  hackathon: 'var(--accent-student)', workshop: 'var(--status-success)', talk: 'var(--status-info)',
  cultural: 'var(--accent-society)', sports: 'var(--status-warning)', fest: 'var(--accent-admin)',
};

const LOOP_STEPS = [
  { icon: '📱', label: 'QR Scan' },
  { icon: '✅', label: 'Attendance' },
  { icon: '⭐', label: 'Feedback' },
  { icon: '🧠', label: 'ML Model' },
  { icon: '🎯', label: 'Better Events' },
];

export default function AttendanceLoop() {
  const { theme } = useTheme(); // Use theme context if needed
  const [selectedEvent, setSelectedEvent] = useState(SIMULATED_EVENTS[0]);
  const [scanCount, setScanCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const qrRef = useRef(null);

  // Draw QR on mount
  useEffect(() => {
    drawQR(qrRef.current, `campusbook://attend/${selectedEvent?.id}`);
    setScanCount(selectedEvent?.actualAttendees || 0);
    setRating(0);
    setSelectedTags([]);
    setFeedbackSubmitted(false);
    setActiveStep(0);
  }, [selectedEvent, theme]); // Redraw on theme change

  // Cycle through loop steps
  useEffect(() => {
    const interval = setInterval(() => setActiveStep(s => (s + 1) % LOOP_STEPS.length), 2000);
    return () => clearInterval(interval);
  }, []);

  const simulateScan = useCallback(() => {
    setScanCount(c => c + 1);
    setActiveStep(1);
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const submitFeedback = () => {
    setFeedbackSubmitted(true);
    setActiveStep(3);
  };

  const attendancePercentage = selectedEvent ? Math.round((scanCount / selectedEvent.expectedAttendees) * 100) : 0;
  const circleColor = attendancePercentage > 80 ? 'var(--status-success)' : attendancePercentage > 50 ? 'var(--status-warning)' : 'var(--status-error)';

  return (
    <div className="att-container">
      {/* Hero */}
      <div className="att-hero animate-fade-in">
        <div className="flex items-center gap-sm" style={{ marginBottom: 4 }}>
          <QrCode size={16} style={{ opacity: 0.8 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>Self-Improving System</span>
        </div>
        <h1>QR Attendance + Feedback Loop</h1>
        <p>Every event makes the next event smarter — attendance → feedback → ML improvement</p>
      </div>

      {/* Event Selection */}
      <div className="att-events-grid">
        {SIMULATED_EVENTS.slice(0, 4).map((event, i) => (
          <div
            key={event.id}
            className={`att-event-card ${selectedEvent?.id === event.id ? 'selected' : ''} animate-card-entrance stagger-${i + 1}`}
            onClick={() => setSelectedEvent(event)}
          >
            <span className="att-event-type-badge" style={{ background: `${TYPE_COLORS[event.type]}15`, color: TYPE_COLORS[event.type] }}>
              {event.type}
            </span>
            <div className="att-event-title">{event.title}</div>
            <div className="att-event-meta">{event.society} • {event.date}</div>
            <div className="att-event-stats">
              <div>
                <div className="att-event-stat-value">{event.actualAttendees}</div>
                <div className="att-event-stat-label">Attended</div>
              </div>
              <div>
                <div className="att-event-stat-value">{event.rating}</div>
                <div className="att-event-stat-label">Rating</div>
              </div>
              <div>
                <div className="att-event-stat-value">{event.feedbackCount}</div>
                <div className="att-event-stat-label">Feedback</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedEvent && (
        <div className="att-detail">
          {/* QR + Attendance */}
          <div className="att-panel animate-card-entrance stagger-2">
            <div className="att-panel-header">
              <h3><QrCode size={16} style={{ opacity: 0.5 }} /> Event Check-in</h3>
            </div>
            <div className="att-panel-body">
              <div className="att-qr-wrapper">
                <div className="att-qr-canvas-wrapper">
                  <canvas ref={qrRef} style={{ display: 'block' }} />
                </div>
                <div className="att-qr-info">
                  Scan to mark attendance for <strong>{selectedEvent.title}</strong>
                </div>
              </div>

              <div className="att-counter">
                <div className="att-counter-circle" style={{ borderColor: circleColor, color: circleColor }}>
                  <span className="att-counter-value">{scanCount}</span>
                  <span className="att-counter-label">/ {selectedEvent.expectedAttendees}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {attendancePercentage}% attendance
                </span>
                <button className="att-scan-btn" onClick={simulateScan}>
                  <Scan size={14} /> Simulate Scan
                </button>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="att-panel animate-card-entrance stagger-3">
            <div className="att-panel-header">
              <h3><Star size={16} style={{ opacity: 0.5 }} /> Instant Feedback</h3>
            </div>
            <div className="att-panel-body">
              {!feedbackSubmitted ? (
                <>
                  <div className="att-feedback-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span
                        key={s}
                        className={`att-star ${rating >= s ? 'active' : ''}`}
                        onClick={() => { setRating(s); setActiveStep(2); }}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>

                  <div className="att-feedback-tags">
                    {FEEDBACK_TAGS.map(tag => (
                      <span
                        key={tag}
                        className={`att-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      className="att-scan-btn"
                      onClick={submitFeedback}
                      disabled={rating === 0}
                      style={{
                        background: rating > 0 ? 'linear-gradient(135deg, #6c63ff, #8b83ff)' : '#94a3b8',
                        cursor: rating > 0 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <Send size={14} /> Submit Feedback
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <h3 style={{ marginBottom: 4 }}>Feedback Submitted!</h3>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 16 }}>
                    Your feedback is now training the ML model to improve future event recommendations.
                  </p>
                  <div style={{
                    padding: 12, borderRadius: 12, background: 'var(--bg-surface)',
                    display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13
                  }}>
                    <Sparkles size={14} style={{ color: '#6c63ff' }} />
                    <span>ML Model updated — <strong>accuracy +0.3%</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Self-Improvement Loop Diagram */}
      <div className="att-loop-diagram animate-card-entrance stagger-4">
        <div style={{ textAlign: 'center', width: '100%', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--font-md)' }}>🔄 Self-Improvement Loop</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Every event makes the next event smarter</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          {LOOP_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className={`att-loop-step ${activeStep === i ? 'active' : ''}`}>
                <span className="att-loop-icon">{step.icon}</span>
                <span className="att-loop-label">{step.label}</span>
              </div>
              {i < LOOP_STEPS.length - 1 && <span className="att-loop-arrow">→</span>}
            </div>
          ))}
          <span className="att-loop-arrow">↩️</span>
        </div>
      </div>
    </div>
  );
}
