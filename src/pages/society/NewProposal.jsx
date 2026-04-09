import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { EVENT_TYPES, TIME_SLOTS } from '../../utils/constants';
import { MOCK_CLUBS } from '../../utils/mockData';
import { calculateReadinessScore, autoCategorizEvent, detectConflicts } from '../../utils/aiHelpers';
import { ArrowLeft, ArrowRight, Send, Sparkles, Upload, AlertTriangle, CheckCircle, Info, Calendar as CalendarIcon } from 'lucide-react';
import SmartSlotSuggestions from '../../components/SmartSlotSuggestions';
import './NewProposal.css';

const STEPS = ['Basic Info', 'Logistics', 'Resources', 'Documents', 'Review'];

export default function NewProposal() {
  const { user } = useAuth();
  const { submitProposal, proposals } = useProposals();
  const { venues } = useVenues();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [form, setForm] = useState({
    title: '', eventType: '', description: '', expectedAttendees: '',
    date: '', timeSlot: '', startTime: '', endTime: '', venueId: '', resources: '', documents: [], posterUrl: '',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleConfirmSlot = (slot) => {
    update('date', slot.start.toISOString().split('T')[0]);
    update('startTime', slot.start.toISOString());
    update('endTime', slot.end.toISOString());
    update('timeSlot', 'custom'); // Mark as custom to bypass selection
    setManualMode(false);
    
    // Auto-advance or scroll to resources?
    setTimeout(() => {
        const nav = document.querySelector('.form-nav');
        nav?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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

  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.posterUrl) {
      setError("An event image/poster is mandatory for professional indexing.");
      return;
    }
    setError('');
    const club = MOCK_CLUBS.find(c => c.id === user.clubId);
    const proposal = {
      ...form,
      expectedAttendees: parseInt(form.expectedAttendees) || 0,
      clubId: user.clubId || '',
      clubName: user.clubName || 'Unknown Club',
      submittedBy: user.id || user.uid || '',
      submittedByName: user.name || user.displayName || 'Unknown User',
      currentReviewer: club?.facultyAdvisorId || 'u4', // Dynamic lookup with fallback
      documents: form.documents,
      posterUrl: form.posterUrl,
    };
    submitProposal(proposal);
    navigate('/proposals');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const docs = files.map(f => ({ name: f.name, type: f.type.includes('image') ? 'image' : 'pdf' }));
    update('documents', [...form.documents, ...docs]);
  };

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        update('posterUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
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

              <div className="input-group">
                <label>Venue Preference *</label>
                <select className="input-field" value={form.venueId} onChange={e => update('venueId', e.target.value)}>
                  <option value="">Select a venue</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (Capacity: {v.capacity})</option>
                  ))}
                </select>
              </div>

              {form.venueId && (
                <div className="scheduler-section mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                    <label style={{ margin: 0, fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Select Date & Time *</label>
                    <button 
                      onClick={() => setManualMode(!manualMode)}
                      className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {manualMode ? <><Sparkles size={14} /> Use Smart Recommendations</> : <><CalendarIcon size={14} /> Pick Date/Time Manually</>}
                    </button>
                  </div>

                  {!manualMode && form.eventType ? (
                    <div className="smart-scheduler-container">
                      <SmartSlotSuggestions 
                        venueId={form.venueId}
                        eventType={form.eventType}
                        durationMinutes={120} // Default 2h for now
                        preferredDate={form.date || new Date()}
                        onConfirm={handleConfirmSlot}
                        onOpenCalendar={() => setManualMode(true)}
                      />
                      {form.startTime && form.timeSlot === 'custom' && (
                        <div className="selected-slot-indicator animate-fade-in mt-3 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center gap-2 text-sm">
                          <CheckCircle size={16} />
                          <span>Slot Selected: <strong>{new Date(form.startTime).toLocaleDateString()} at {new Date(form.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="manual-logistics-grid animate-fade-in">
                      <div className="grid grid-2 gap-lg p-2">
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
                    </div>
                  )}
                </div>
              )}

              {selectedVenue && parseInt(form.expectedAttendees) > selectedVenue.capacity && (
                <div className="conflict-alert" style={{ marginTop: '1rem' }}>
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
              <h2 className="form-step-title">Documents & Branding</h2>
              
              <div className="input-group mb-6">
                <label>Event Photo / Logo <span className="text-accent">*Required</span></label>
                <div className="upload-area p-4 border-2 border-dashed border-border-secondary rounded-xl bg-card hover:border-accent transition-colors">
                  {form.posterUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={form.posterUrl} alt="Event Poster" style={{ maxHeight: '120px', borderRadius: '8px', marginBottom: '1rem' }} />
                      <button className="btn btn-ghost btn-sm text-red-500" onClick={() => update('posterUrl', '')}>Remove Photo</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-dim mb-4 text-center">Upload an event photo. If omitted, the default UniFlow logo will be used automatically.</p>
                      <label className="btn btn-secondary btn-sm">
                        Upload Image
                        <input type="file" accept="image/*" onChange={handlePosterUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="input-group">
                <label>Other Documents (Speaker IDs, Permissions)</label>
                <div className="upload-area mt-2 p-4 border border-border-secondary rounded-xl">
                  <Upload size={24} className="mb-2 text-text-tertiary" />
                  <label className="btn btn-secondary btn-sm mt-2">
                    Choose Files
                    <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                {form.documents.length > 0 && (
                  <div className="doc-list mt-top">
                    {form.documents.map((d, i) => (
                      <div key={i} className="doc-item flex justify-between p-2 bg-card border border-border-primary rounded mt-2">
                        <span>{d.type === 'image' ? '🖼️' : '📄'} {d.name}</span>
                        <button className="btn btn-ghost btn-sm text-red-500" onClick={() => update('documents', form.documents.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              <button 
                className="btn btn-primary" 
                disabled={
                  (step === 0 && (!form.title || !form.eventType || !form.description)) ||
                  (step === 1 && (!form.expectedAttendees || !form.venueId || (!manualMode && !form.startTime) || (manualMode && (!form.date || !form.timeSlot))))
                }
                onClick={() => setStep(step + 1)}
              >
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
