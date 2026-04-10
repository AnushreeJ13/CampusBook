import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { registerWhatsAppUser, checkWhatsAppStatus, disableWhatsApp } from '../../api';
import { Bell, BellOff, Check, Phone, X, Loader2, MessageCircle } from 'lucide-react';

/**
 * WhatsApp Notification Banner — shows on all dashboards.
 * Prompts user to enter their WhatsApp number to enable notifications.
 * Once registered, shows a "Notifications Active" badge with option to disable.
 */
const WhatsAppWidget = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'unregistered' | 'registered' | 'form'
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');

  // Check registration status on mount
  useEffect(() => {
    if (!user?.id) return;
    
    const checkStatus = async () => {
      try {
        const result = await checkWhatsAppStatus(user.id || user.uid);
        if (result.registered && result.enabled) {
          setStatus('registered');
          setRegisteredPhone(result.phone || '');
        } else {
          setStatus('unregistered');
        }
      } catch (e) {
        // Backend not available — show unregistered
        setStatus('unregistered');
      }
    };
    checkStatus();
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phone
    let cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number with country code');
      return;
    }

    setLoading(true);
    try {
      await registerWhatsAppUser({
        userId: user.id || user.uid,
        name: user.name || user.displayName || 'User',
        phone: cleanPhone,
        role: user.role || 'student'
      });
      setStatus('registered');
      setRegisteredPhone(cleanPhone);
    } catch (e) {
      setError(e.message || 'Registration failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      await disableWhatsApp(user.id || user.uid);
      setStatus('unregistered');
      setRegisteredPhone('');
    } catch (e) {
      console.error('Disable failed:', e);
    }
  };

  if (!user || status === 'loading') return null;

  // ── REGISTERED STATE: Compact success banner ──
  if (status === 'registered') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
        border: '1px solid #86efac',
        borderRadius: '1rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageCircle size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534' }}>
              WhatsApp Notifications Active
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
              {registeredPhone ? `Linked to ${registeredPhone}` : 'You\'ll receive updates on WhatsApp'}
            </div>
          </div>
        </div>
        <button onClick={handleDisable} style={{
          background: 'transparent', border: '1px solid #bbf7d0',
          borderRadius: '0.5rem', padding: '0.375rem 0.75rem',
          fontSize: '0.75rem', color: '#166534', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          transition: 'all 0.2s',
        }} title="Disable notifications">
          <BellOff size={14} /> Disable
        </button>
      </div>
    );
  }

  // ── FORM STATE: Expanded registration form ──
  if (status === 'form') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)',
        border: '1px solid #86efac',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        position: 'relative',
      }}>
        <button onClick={() => setStatus('unregistered')} style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
          padding: '0.25rem',
        }}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          }}>
            <MessageCircle size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#166534' }}>
              Enable WhatsApp Alerts
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#4ade80' }}>
              Get instant updates on proposals, approvals & events
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ 
              display: 'block', fontSize: '0.7rem', fontWeight: 700, 
              color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '0.375rem'
            }}>
              WhatsApp Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ 
                position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                color: '#86efac'
              }} />
              <input
                type="tel"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                required
                style={{
                  width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                  borderRadius: '0.75rem', border: '2px solid #86efac',
                  fontSize: '0.875rem', outline: 'none',
                  background: 'white', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.375rem 0 0' }}>{error}</p>
            )}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.625rem',
            background: loading ? '#86efac' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white', border: 'none', borderRadius: '0.75rem',
            fontWeight: 800, fontSize: '0.875rem', cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            transition: 'all 0.2s',
          }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Registering...</> : <><Check size={16} /> Enable Notifications</>}
          </button>

          <p style={{ 
            fontSize: '0.625rem', color: '#86efac', textAlign: 'center', 
            margin: '0.5rem 0 0' 
          }}>
            You'll receive automated updates for your role ({user.role || 'student'}).
            <br />
            Make sure you've joined the Twilio Sandbox first.
          </p>
        </form>
      </div>
    );
  }

  // ── UNREGISTERED STATE: CTA banner ──
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #dcfce7 100%)',
      border: '1px solid #bbf7d0',
      borderRadius: '1rem',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      marginBottom: '1.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onClick={() => setStatus('form')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)',
        }}>
          <Bell size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534' }}>
            Enable WhatsApp Notifications
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>
            Get instant alerts for proposals, approvals & events
          </div>
        </div>
      </div>
      <div style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        color: 'white', padding: '0.375rem 1rem', borderRadius: '0.5rem',
        fontSize: '0.8rem', fontWeight: 700,
        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
      }}>
        Enable →
      </div>
    </div>
  );
};

export default WhatsAppWidget;
