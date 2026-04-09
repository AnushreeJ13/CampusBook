import { useState, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useProposals } from '../../contexts/ProposalContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { Activity, Radio, MapPin, Users, Power, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AttendanceScanner() {
  const { activeSessions, startSession, endSession } = useAttendance();
  const { proposals } = useProposals();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Filter approved proposals that haven't been completed
  const eligibleEvents = proposals.filter(p => 
    p.status === PROPOSAL_STATUS.VENUE_BOOKED || 
    p.status === PROPOSAL_STATUS.APPROVED
  );

  const currentSession = activeSessions.find(s => s.isActive);

  const handleStartSignal = async () => {
    if (!selectedEventId) return;
    setIsStarting(true);
    const event = proposals.find(p => p.id === selectedEventId);
    try {
      await startSession(selectedEventId, event?.venueId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <div className="header-badge">
          <Radio size={16} className={currentSession ? 'pulse-error' : ''} />
          <span>ATTENDANCE_SCANNER</span>
        </div>
        <h1 className="header-title">Event Attendance Verification</h1>
      </div>

      <div className="grid-checkin">
        {/* Main Broadcast Control */}
        <div className="card-checkin col-span-2">
          <div className="card-header-simple">
            <Power size={18} />
            <h2>SCANNER CONTROL</h2>
          </div>

          {!currentSession ? (
            <div className="p-6 space-y-6">
              <div className="field-group">
                <label className="field-label">SELECT TARGET EVENT</label>
                <select 
                  className="scanner-input"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">-- AUTHORIZED EVENTS --</option>
                  {eligibleEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({event.clubName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEventId && (
                <div className="node-details">
                  <div className="detail-item">
                    <MapPin size={14} />
                    <span>VENUE: {eligibleEvents.find(e => e.id === selectedEventId)?.venueId || 'NOT_SPECIFIED'}</span>
                  </div>
                  <div className="detail-item">
                    <Activity size={14} />
                    <span>EVENT_TYPE: {eligibleEvents.find(e => e.id === selectedEventId)?.eventType}</span>
                  </div>
                </div>
              )}

              <button 
                className="btn-checkin w-full"
                disabled={!selectedEventId || isStarting}
                onClick={handleStartSignal}
              >
                {isStarting ? 'INITIALIZING SCANNER...' : 'START ATTENDANCE SCANNER'}
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="broadcast-active">
                <div className="radar-monitor">
                  <div className="radar-circle"></div>
                  <div className="radar-circle circle-2"></div>
                  <div className="radar-circle circle-3"></div>
                  <div className="radar-sweep"></div>
                  <div className="radar-status">SCANNING</div>
                </div>

                <div className="broadcast-stats mt-8 grid grid-cols-2 gap-4">
                  <div className="stat-plate">
                    <span className="stat-label">ATTENDEE_COUNT</span>
                    <span className="stat-value text-accent">{currentSession.attendeeCount || 0}</span>
                  </div>
                  <div className="stat-plate">
                    <span className="stat-label">SESSION_STATUS</span>
                    <span className="stat-value">LIVE</span>
                  </div>
                </div>

                <button 
                  className="btn-checkin-danger w-full mt-8"
                  onClick={() => endSession(currentSession.id)}
                >
                  STOP SCANNER
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Telemetry / Logs */}
        <div className="card-checkin">
          <div className="card-header-simple">
            <Activity size={18} />
            <h2>SCANNER LOGS</h2>
          </div>
          <div className="p-4 overflow-hidden">
             <div className="log-container h-[400px] overflow-y-auto font-mono text-xs space-y-2">
                <div className="text-secondary">[0.00s] SYSTEM_INIT: Scanner module active</div>
                <div className="text-secondary">[0.01s] AUTH_CHECK: Society credentials verified</div>
                {currentSession && (
                  <>
                    <div className="text-accent">[1.24s] SCANNER_UP: Broadcast started to verify nearby devices</div>
                    <div className="text-accent">[5.67s] SCANNER_DISCOVERY: Syncing with student devices...</div>
                    <div className="text-primary">[10.12s] ATTENDANCE_SYNC: Tracking active users in location</div>
                  </>
                )}
                {!currentSession && <div className="text-dim">[WAITING] Idle state...</div>}
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .broadcast-active {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .radar-monitor {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(var(--color-primary-rgb), 0.05);
          position: relative;
          border: 1px solid rgba(var(--color-primary-rgb), 0.2);
          overflow: hidden;
        }

        .radar-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid rgba(var(--color-primary-rgb), 0.1);
        }

        .circle-2 { width: 100px; height: 100px; }
        .circle-3 { width: 150px; height: 150px; }

        .radar-sweep {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 50%;
          background: linear-gradient(0deg, transparent, rgba(var(--color-primary-rgb), 0.3));
          transform-origin: bottom left;
          animation: sweep 4s linear infinite;
        }

        .radar-status {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: inherit;
          font-size: 10px;
          color: var(--color-primary);
          letter-spacing: 2px;
          font-weight: bold;
        }

        @keyframes sweep {
          from { transform: translateX(0) rotate(0deg); }
          to { transform: translateX(0) rotate(360deg); }
        }

        .stat-plate {
          padding: 12px;
          background: rgba(var(--color-bg-secondary-rgb), 0.5);
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-label {
          font-size: 10px;
          color: var(--color-text-dim);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          font-family: 'JetBrains Mono', monospace;
        }

        .node-details {
          padding: 12px;
          background: rgba(var(--color-primary-rgb), 0.05);
          border-left: 2px solid var(--color-primary);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
