import { useVenues } from '../contexts/VenueContext';
import { useProposals } from '../contexts/ProposalContext';
import { PROPOSAL_STATUS, TIME_SLOTS } from '../utils/constants';
import { MapPin, Users, Calendar, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

export default function BrowseVenues() {
  const { venues } = useVenues();
  const { proposals, bookings } = useProposals();
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      if (filterType && v.type !== filterType) return false;
      if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [venues, filterType, searchQuery]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSlotStatus = (venueId, date, slotId) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const venue = venues.find(v => v.id === venueId);

    if (venue?.blockedDates?.includes(dateStr)) return 'blocked';

    const booking = bookings.find(b =>
      b.venueId === venueId && b.date === dateStr && b.timeSlot === slotId
    );
    if (booking) return booking.status === 'maintenance' ? 'maintenance' : 'booked';

    const pendingProposal = proposals.find(p =>
      p.venueId === venueId && p.date === dateStr && p.timeSlot === slotId &&
      ![PROPOSAL_STATUS.REJECTED, PROPOSAL_STATUS.DRAFT].includes(p.status) &&
      p.status !== PROPOSAL_STATUS.VENUE_BOOKED
    );
    if (pendingProposal) return 'pending';

    return 'available';
  };

  const statusColors = {
    available: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e', label: 'Available' },
    booked: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', label: 'Booked' },
    pending: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', label: 'Pending' },
    blocked: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', text: '#6b7280', label: 'Blocked' },
    maintenance: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', text: '#6b7280', label: 'Maintenance' },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Browse Venues</h1>
        <p>Explore campus venues and check real-time availability</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Search venues..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All Types</option>
          <option value="auditorium">Auditorium</option>
          <option value="seminar_hall">Seminar Hall</option>
          <option value="classroom">Classroom</option>
          <option value="open_ground">Open Ground</option>
          <option value="conference_room">Conference Room</option>
          <option value="lab">Lab</option>
        </select>
        {/* Legend */}
        <div className="flex items-center gap-md" style={{ marginLeft: 'auto' }}>
          {Object.entries(statusColors).slice(0, 4).map(([key, val]) => (
            <div key={key} className="flex items-center gap-xs" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: val.bg, border: `1px solid ${val.border}` }} />
              {val.label}
            </div>
          ))}
        </div>
      </div>

      {/* Venue Cards */}
      <div className="grid grid-3 gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        {filteredVenues.map((venue, i) => (
          <div
            key={venue.id}
            className={`card animate-fade-in-up ${selectedVenue === venue.id ? '' : ''}`}
            style={{
              cursor: 'pointer',
              animationDelay: `${i * 0.05}s`,
              borderColor: selectedVenue === venue.id ? 'var(--accent)' : undefined,
              background: selectedVenue === venue.id ? 'var(--accent-soft)' : undefined,
            }}
            onClick={() => setSelectedVenue(selectedVenue === venue.id ? null : venue.id)}
          >
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
              <span style={{ fontSize: '32px' }}>{venue.image}</span>
              <div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>{venue.name}</h3>
                <span className="badge badge-accent" style={{ marginTop: 4 }}>{venue.type.replace('_', ' ')}</span>
              </div>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-md)' }}>
              {venue.description}
            </p>
            <div className="flex items-center justify-between" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
              <span className="flex items-center gap-xs"><Users size={12} /> Capacity: {venue.capacity}</span>
              <span>{venue.amenities.length} amenities</span>
            </div>
            <div className="flex flex-wrap gap-xs" style={{ marginTop: 'var(--space-md)' }}>
              {venue.amenities.slice(0, 3).map(a => (
                <span key={a} className="badge badge-accent" style={{ fontSize: '10px' }}>{a}</span>
              ))}
              {venue.amenities.length > 3 && (
                <span className="badge badge-info" style={{ fontSize: '10px' }}>+{venue.amenities.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {selectedVenue && (
        <div className="card animate-fade-in-up">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
              <Calendar size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              {venues.find(v => v.id === selectedVenue)?.name} — Weekly Availability
            </h3>
            <div className="flex items-center gap-md">
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                {format(weekDays[0], 'MMM d')} — {format(weekDays[6], 'MMM d, yyyy')}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Time Slot</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} style={{ textAlign: 'center' }}>
                      <div>{format(day, 'EEE')}</div>
                      <div style={{ fontSize: '11px', fontWeight: 400, marginTop: 2 }}>{format(day, 'MMM d')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot.id}>
                    <td style={{ fontWeight: 600, fontSize: 'var(--font-xs)', whiteSpace: 'nowrap' }}>{slot.label}</td>
                    {weekDays.map(day => {
                      const status = getSlotStatus(selectedVenue, day, slot.id);
                      const color = statusColors[status];
                      return (
                        <td key={day.toISOString()} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                          <div style={{
                            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                            background: color.bg, border: `1px solid ${color.border}`,
                            fontSize: '10px', fontWeight: 600, color: color.text,
                          }}>
                            {color.label}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
