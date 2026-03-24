import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { EVENT_TYPES, TIME_SLOTS } from '../../utils/constants';
import { calculateReadinessScore, autoCategorizEvent, detectConflicts } from '../../utils/aiHelpers';
import { ArrowLeft, ArrowRight, Send, Sparkles, Upload, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './NewProposal.css';

const STEPS = ['Basic Info', 'Logistics', 'Resources', 'Documents', 'Review'];

export default function NewProposal() {
  const { user } = useAuth();
  const { submitProposal, proposals } = useProposals();
  const { venues } = useVenues();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', eventType: '', description: '', expectedAttendees: '',
    date: '', timeSlot: '', venueId: '', resources: '', documents: [],
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedVenue = venues.find(v => v.id === form.venueId);

  const readiness = useMemo(() => calculateReadinessScore({
    ...form,
    expectedAttendees: parseInt(form.expectedAttendees) || 0,
    venueCapacity: selectedVenue?.capacity,
  }), [form, selectedVenue]);

  const category = useMemo(() => autoCategorizEvent(form.title, form.description), [form.title, form.description]);

  const conflicts = useMemo(() => detectConflicts({
    ...form,
    clubId: user.clubId,
    expectedAttendees: parseInt(form.expectedAttendees) || 0,
  }, proposals, venues), [form, proposals, venues, user.clubId]);

  const handleSubmit = () => {
    const proposal = {
      ...form,
      expectedAttendees: parseInt(form.expectedAttendees) || 0,
      clubId: user.clubId,
      clubName: user.clubName,
      submittedBy: user.id,
      submittedByName: user.name,
      currentReviewer: 'u4',
      documents: form.documents,
    };
    submitProposal(proposal);
    navigate('/proposals');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const docs = files.map(f => ({ name: f.name, type: f.type.includes('image') ? 'image' : 'pdf' }));
    update('documents', [...form.documents, ...docs]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create New Proposal</h1>
        <p>Submit an event proposal for review and approval</p>
      </div>

      {/* Progress Bar */}
      <div className="proposal-progress">
        {STEPS.map((s, i) => (
          <div key={s} className={`progress-step ${i === step ? 'active' : i < step ? 'done' : ''}`} onClick={() => i <= step && setStep(i)}>
            <div className="progress-step-dot">{i < step ? '✓' : i + 1}</div>
            <span className="progress-step-label">{s}</span>
          </div>
        ))}
        <div className="progress-line">
          <div className="progress-line-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      <div className="proposal-form-layout">
        {/* Form */}
        <div className="proposal-form-main">
          {step === 0 && (
            <div className="form-step animate-fade-in">
              <h2 className="form-step-title">Basic Information</h2>
              <div className="input-group">
                <label>Event Title *</label>
                <input className="input-field" placeholder="e.g., CodeFest 2026 — Annual Hackathon" value={form.title} onChange={e => update('title', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Event Type *</label>
                <div className="event-type-grid">
                  {EVENT_TYPES.map(et => (
                    <button key={et.value} className={`event-type-card ${form.eventType === et.value ? 'selected' : ''}`} onClick={() => update('eventType', et.value)}>
                      <span className="event-type-icon">{et.icon}</span>
                      <span>{et.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label>Description *</label>
                <textarea className="input-field" placeholder="Describe your event in detail — purpose, agenda, target audience..." rows={5} value={form.description} onChange={e => update('description', e.target.value)} />
              </div>
              {category.primary !== 'general' && (
                <div className="ai-tag-hint">
                  <Sparkles size={14} />
                  <span>AI detected category: <strong>{category.primary}</strong>{category.secondary ? ` / ${category.secondary}` : ''}</span>
                  <span className={`badge ${category.confidence === 'high' ? 'badge-success' : 'badge-warning'}`}>{category.confidence}</span>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="form-step animate-fade-in">
              <h2 className="form-step-title">Logistics</h2>
              <div className="input-group">
                <label>Expected Attendees *</label>
                <input className="input-field" type="number" placeholder="e.g., 120" value={form.expectedAttendees} onChange={e => update('expectedAttendees', e.target.value)} />
              </div>
              <div className="grid grid-2 gap-lg">
                <div className="input-group">
                  <label>Event Date *</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => update('date', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Time Slot *</label>
                  <select className="input-field" value={form.timeSlot} onChange={e => update('timeSlot', e.target.value)}>
                    <option value="">Select a time slot</option>
                    {TIME_SLOTS.map(ts => (
                      <option key={ts.id} value={ts.id}>{ts.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Venue Preference</label>
                <select className="input-field" value={form.venueId} onChange={e => update('venueId', e.target.value)}>
                  <option value="">Select a venue</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (Capacity: {v.capacity})</option>
                  ))}
                </select>
              </div>
              {selectedVenue && parseInt(form.expectedAttendees) > selectedVenue.capacity && (
                <div className="conflict-alert">
                  <AlertTriangle size={16} />
                  <span>⚠️ Attendees ({form.expectedAttendees}) exceed venue capacity ({selectedVenue.capacity})</span>
                </div>
              )}
              {conflicts.length > 0 && conflicts.map((c, i) => (
                <div key={i} className={`conflict-alert ${c.severity === 'error' ? 'error' : ''}`}>
                  <AlertTriangle size={16} />
                  <span>{c.message}</span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="form-step animate-fade-in">
              <h2 className="form-step-title">Resources & Requirements</h2>
              <div className="input-group">
                <label>Required Resources</label>
                <textarea className="input-field" placeholder="e.g., Projector, Sound system, 50 chairs, Wi-Fi access, Power strips..." rows={4} value={form.resources} onChange={e => update('resources', e.target.value)} />
              </div>
              {selectedVenue && (
                <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                  <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                    {selectedVenue.image} Venue Amenities
                  </h3>
                  <div className="flex flex-wrap gap-sm">
                    {selectedVenue.amenities.map(a => (
                      <span key={a} className="badge badge-accent">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="form-step animate-fade-in">
              <h2 className="form-step-title">Documents</h2>
              <div className="upload-area">
                <Upload size={32} />
                <p>Upload speaker IDs, permissions, posters, etc.</p>
                <label className="btn btn-secondary btn-sm">
                  Choose Files
                  <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {form.documents.length > 0 && (
                <div className="doc-list">
                  {form.documents.map((d, i) => (
                    <div key={i} className="doc-item">
                      <span>{d.type === 'image' ? '🖼️' : '📄'} {d.name}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => update('documents', form.documents.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="form-step animate-fade-in">
              <h2 className="form-step-title">Review & Submit</h2>
              <div className="review-grid">
                <div className="review-section">
                  <h4>Event Details</h4>
                  <div className="review-row"><span>Title</span><strong>{form.title || '—'}</strong></div>
                  <div className="review-row"><span>Type</span><strong>{EVENT_TYPES.find(e => e.value === form.eventType)?.label || '—'}</strong></div>
                  <div className="review-row"><span>Attendees</span><strong>{form.expectedAttendees || '—'}</strong></div>
                </div>
                <div className="review-section">
                  <h4>Logistics</h4>
                  <div className="review-row"><span>Date</span><strong>{form.date || '—'}</strong></div>
                  <div className="review-row"><span>Time</span><strong>{TIME_SLOTS.find(t => t.id === form.timeSlot)?.label || '—'}</strong></div>
                  <div className="review-row"><span>Venue</span><strong>{selectedVenue?.name || '—'}</strong></div>
                </div>
                <div className="review-section">
                  <h4>Documents</h4>
                  <div className="review-row"><span>Uploaded</span><strong>{form.documents.length} file(s)</strong></div>
                </div>
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-lg)' }}>
                By submitting, this proposal will be sent to your Faculty Advisor for review.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="form-nav">
            <button className="btn btn-secondary" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}>
              <ArrowLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-success btn-lg" onClick={handleSubmit} disabled={readiness.score < 30}>
                <Send size={18} /> Submit Proposal
              </button>
            )}
          </div>
        </div>

        {/* Readiness Sidebar */}
        <div className="proposal-form-sidebar">
          <div className="readiness-card">
            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
              <Sparkles size={18} color="var(--accent)" />
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>AI Readiness</h3>
            </div>
            <div className="readiness-score">
              <svg viewBox="0 0 100 100" className="readiness-ring">
                <circle cx="50" cy="50" r="42" className="readiness-ring-bg" />
                <circle cx="50" cy="50" r="42" className="readiness-ring-fill"
                  style={{
                    strokeDasharray: `${(readiness.score / 100) * 264} 264`,
                    stroke: readiness.score >= 85 ? 'var(--status-success)'
                      : readiness.score >= 65 ? 'var(--accent)'
                      : readiness.score >= 40 ? 'var(--status-warning)'
                      : 'var(--status-error)'
                  }}
                />
              </svg>
              <div className="readiness-score-text">
                <span className="readiness-percent">{readiness.score}%</span>
                <span className="readiness-label">{readiness.label}</span>
              </div>
            </div>

            <div className="readiness-flags">
              {readiness.flags.map((flag, i) => (
                <div key={i} className={`readiness-flag flag-${flag.type}`}>
                  {flag.type === 'error' ? <AlertTriangle size={12} /> : flag.type === 'warning' ? <Info size={12} /> : <CheckCircle size={12} />}
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          </div>

          {category.primary !== 'general' && (
            <div className="readiness-card" style={{ marginTop: 'var(--space-lg)' }}>
              <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Auto Category</h4>
              <div className="flex flex-wrap gap-sm">
                <span className="badge badge-accent">{category.primary}</span>
                {category.secondary && <span className="badge badge-info">{category.secondary}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
