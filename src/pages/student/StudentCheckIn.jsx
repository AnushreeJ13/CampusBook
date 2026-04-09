import { useState, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useAuth } from '../../contexts/AuthContext';
import { Radio, ShieldCheck, MapPin, Scan, SignalHigh, SignalLow, Loader2, CheckCircle2 } from 'lucide-react';

export function StudentCheckIn() {
  const { user } = useAuth();
  const { activeSessions, myAttendance, checkIn } = useAttendance();
  const { proposals } = useProposals();
  const [scanning, setScanning] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState(false);

  // Simulation of finding signals
  useEffect(() => {
    const timer = setTimeout(() => setScanning(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckIn = async (session) => {
    setCheckingIn(true);
    try {
      const event = proposals.find(p => p.id === session.eventId);
      await checkIn(session.id, session.eventId, event?.category);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingIn(false);
    }
  };

  const getEventTitle = (id) => proposals.find(p => p.id === id)?.title || 'SECURE_EVENT';
  
  const isAlreadyAttended = (sessionId) => myAttendance.some(a => a.sessionId === sessionId);

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <div className="header-badge">
          <Scan size={16} />
          <span>ATTENDANCE SCANNER</span>
        </div>
        <h1 className="header-title">Event Check-In</h1>
      </div>

      <div className="scanner-interface">
        {scanning ? (
          <div className="scanning-state card-checkin p-12 flex flex-col items-center justify-center space-y-6">
            <div className="scanner-light"></div>
            <div className="searching-anim">
              <div className="pulse-ring"></div>
              <Radio size={48} className="text-primary z-10" />
            </div>
            <div className="text-center">
              <p className="text-accent font-mono text-sm tracking-widest">LOCATING_NEARBY_EVENTS...</p>
              <p className="text-dim text-xs mt-2 italic">Scanning location | Verifying status</p>
            </div>
          </div>
        ) : (
          <div className="results-state space-y-4">
            {activeSessions.length === 0 ? (
              <div className="card-checkin p-12 text-center">
                <SignalLow size={48} className="mx-auto text-dim opacity-20 mb-4" />
                <p className="text-dim font-mono">NO_EVENTS_DETECTED_NEARBY</p>
                <button className="btn-checkin-outline mt-4" onClick={() => setScanning(true)}>
                  SCAN AGAIN
                </button>
              </div>
            ) : (
              activeSessions.map(session => {
                const attended = isAlreadyAttended(session.id);
                return (
                  <div key={session.id} className={`card-checkin-interactive p-6 ${attended ? 'border-primary' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <SignalHigh size={16} className="text-accent" />
                          <span className="text-accent text-xs font-mono tracking-tighter">LOCATION_MATCH: 98%</span>
                        </div>
                        <h2 className="text-xl font-bold">{getEventTitle(session.eventId)}</h2>
                        <div className="flex items-center gap-2 text-dim text-sm">
                          <MapPin size={14} />
                          <span>VENUE: {session.venueId}</span>
                        </div>
                      </div>

                      {attended ? (
                        <div className="flex items-center gap-2 text-primary font-mono text-sm">
                          <CheckCircle2 size={18} />
                          <span>MARKED_PRESENT</span>
                        </div>
                      ) : (
                        <button 
                          className="btn-checkin h-12 px-8"
                          disabled={checkingIn}
                          onClick={() => handleCheckIn(session)}
                        >
                          {checkingIn ? <Loader2 className="animate-spin" /> : 'MARK ATTENDANCE'}
                        </button>
                      )}
                    </div>

                    {attended && (
                      <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded flex items-center gap-3">
                        <ShieldCheck size={16} className="text-primary" />
                        <span className="text-xs font-mono text-secondary">ATTENDANCE_CONFIRMED_ID: {Math.random().toString(16).substring(2, 10).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="checkin-toast">
          <div className="toast-content">
            <ShieldCheck size={24} />
            <span>ATTENDANCE_VERIFIED_SUCCESSFULLY</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .scanner-interface {
          max-width: 600px;
          margin: 0 auto;
        }

        .searching-anim {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .scanner-light {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
          box-shadow: 0 0 10px var(--color-primary);
          animation: scan-move 4s linear infinite;
          z-index: 5;
        }

        @keyframes scan-move {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        .checkin-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-primary);
          color: white;
          padding: 16px 24px;
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: toast-in 0.3s ease-out;
          z-index: 100;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: bold;
          font-size: 14px;
          letter-spacing: 1px;
        }

        @keyframes toast-in {
          from { bottom: 50px; opacity: 0; }
          to { bottom: 100px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default StudentCheckIn;
