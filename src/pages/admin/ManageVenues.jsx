import { useVenues } from '../../contexts/VenueContext';
import { VENUE_TYPES } from '../../utils/constants';
import { Building2, Plus, Edit3, Trash2, X, Save, Users, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function ManageVenues() {
  const { venues, addVenue, updateVenue, deleteVenue } = useVenues();
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [form, setForm] = useState({
    name: '', type: 'auditorium', capacity: '', description: '',
    amenities: '', image: '🏛️', allowedEventTypes: [], blockedDates: '',
  });

  const openAdd = () => {
    setEditingVenue(null);
    setForm({ name: '', type: 'auditorium', capacity: '', description: '', amenities: '', image: '🏛️', allowedEventTypes: [], blockedDates: '' });
    setShowModal(true);
  };

  const openEdit = (venue) => {
    setEditingVenue(venue.id);
    setForm({
      name: venue.name, type: venue.type, capacity: String(venue.capacity),
      description: venue.description, amenities: venue.amenities.join(', '),
      image: venue.image, allowedEventTypes: venue.allowedEventTypes || [],
      blockedDates: (venue.blockedDates || []).join(', '),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const venueData = {
      ...form,
      capacity: parseInt(form.capacity) || 0,
      amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      blockedDates: form.blockedDates.split(',').map(d => d.trim()).filter(Boolean),
    };
    if (editingVenue) {
      updateVenue(editingVenue, venueData);
    } else {
      addVenue(venueData);
    }
    setShowModal(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Manage Venues</h1>
            <p>Add, edit, and configure campus venues</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Venue
          </button>
        </div>
      </div>

      <div className="grid grid-3 gap-lg">
        {venues.map((venue, i) => (
          <div key={venue.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="flex items-center gap-md">
                <span style={{ fontSize: '32px' }}>{venue.image}</span>
                <div>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>{venue.name}</h3>
                  <span className="badge badge-accent">{venue.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-md)' }}>
              {venue.description}
            </p>
            <div className="flex items-center gap-lg" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>
              <span className="flex items-center gap-xs"><Users size={12} /> {venue.capacity}</span>
              <span className="flex items-center gap-xs"><MapPin size={12} /> {venue.type.replace('_', ' ')}</span>
            </div>
            <div className="flex flex-wrap gap-xs" style={{ marginBottom: 'var(--space-md)' }}>
              {venue.amenities.map(a => (
                <span key={a} className="badge badge-accent" style={{ fontSize: '10px' }}>{a}</span>
              ))}
            </div>
            {venue.blockedDates?.length > 0 && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--status-warning)', marginBottom: 'var(--space-md)' }}>
                ⚠️ Blocked: {venue.blockedDates.join(', ')}
              </div>
            )}
            <div className="flex gap-sm">
              <button className="btn btn-secondary btn-sm flex-1" onClick={() => openEdit(venue)}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteVenue(venue.id)} style={{ color: 'var(--status-error)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-lg">
              <div className="input-group">
                <label>Venue Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Main Auditorium" />
              </div>
              <div className="grid grid-2 gap-lg">
                <div className="input-group">
                  <label>Type *</label>
                  <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Capacity *</label>
                  <input className="input-field" type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="e.g., 500" />
                </div>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description of the venue..." />
              </div>
              <div className="input-group">
                <label>Amenities (comma-separated)</label>
                <input className="input-field" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} placeholder="e.g., Projector, AC, Sound System" />
              </div>
              <div className="input-group">
                <label>Blocked Dates (comma-separated, YYYY-MM-DD)</label>
                <input className="input-field" value={form.blockedDates} onChange={e => setForm({...form, blockedDates: e.target.value})} placeholder="e.g., 2026-04-01, 2026-04-15" />
              </div>
              <div className="input-group">
                <label>Emoji Icon</label>
                <input className="input-field" value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={{ maxWidth: 80, fontSize: '24px', textAlign: 'center' }} />
              </div>
              <button className="btn btn-primary w-full" onClick={handleSave}>
                <Save size={16} /> {editingVenue ? 'Save Changes' : 'Add Venue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
