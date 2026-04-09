import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { Sparkles, Mail, Lock, User, GraduationCap, Users, BookOpen, Shield, Phone, LogIn } from 'lucide-react';
import './Login.css';

export default function Login({ mode: initialMode = 'login' }) {
  const { 
    user, 
    loginWithEmail, 
    loginWithGoogle, 
    register, 
    completeProfile, 
    setupRecaptcha, 
    loginWithPhone 
  } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'google-setup', 'phone'
  const [method, setMethod] = useState('email'); // 'email', 'google', 'phone'
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [role, setRole] = useState(ROLES.STUDENT);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if logged in and profile complete
  useEffect(() => {
    if (user && !user.incomplete) {
      navigate('/dashboard');
    } else if (user?.incomplete && mode !== 'login' && mode !== 'register') {
      setMode('google-setup');
    }
  }, [user, navigate, mode]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!college) throw new Error("College name is compulsory.");
        await register(email, password, name, college, role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      // useEffect handles the redirect or "google-setup" mode
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetupComplete = async (e) => {
    e.preventDefault();
    if (!college) {
      setError("College is compulsory.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await completeProfile(user.uid, { name: name || user.displayName, college, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setError('');
    setLoading(true);
    try {
      const verifier = await setupRecaptcha('recaptcha-container');
      const confirmation = await loginWithPhone(phoneNumber, verifier);
      setConfirmationResult(confirmation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // useEffect handles profile check
    } catch (err) {
      setError("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="login-logo"><Sparkles size={32} /></div>
          <h1 className="login-title">UniFlow</h1>
          <p className="login-subtitle">Forensic Intelligence Gateway</p>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        {mode === 'google-setup' ? (
          <form className="login-form animate-fade-in" onSubmit={handleSetupComplete}>
            <h2 className="form-title">Complete Your Intelligence Profile</h2>
            <p className="form-desc">Sync your forensic signature with your institution.</p>
            
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Forensic Identity" required />
              </div>
            </div>

            <div className="input-group">
              <label>Institution / College (Compulsory)</label>
              <div className="input-wrapper">
                <BookOpen size={18} />
                <input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="University Name" required />
              </div>
            </div>

            <div className="input-group">
              <label>Intelligence Access Role</label>
              <select className="role-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value={ROLES.STUDENT}>Student Intelligence</option>
                <option value={ROLES.SOCIETY}>Society Hub</option>
                <option value={ROLES.FACULTY}>Faculty Advisor</option>
                <option value={ROLES.ADMIN}>System Admin</option>
              </select>
            </div>

            <button type="submit" className="login-btn active" disabled={loading}>
              {loading ? 'Synchronizing...' : 'Initialize UniFlow Portal'}
            </button>

            <button type="button" className="login-btn" style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={() => logout()}>
              Log Out / Use Different Account
            </button>
          </form>
        ) : (
          <div className="login-card-content">
            {/* Tabs */}
            <div className="login-tabs">
              <button className={`tab-btn ${method === 'email' ? 'active' : ''}`} onClick={() => setMethod('email')}><Mail size={16} /> Email</button>
              <button className={`tab-btn ${method === 'phone' ? 'active' : ''}`} onClick={() => setMethod('phone')}><Phone size={16} /> Phone</button>
              <button className={`tab-btn ${method === 'google' ? 'active' : ''}`} onClick={() => setMethod('google')}><Sparkles size={16} /> Google</button>
            </div>

            {method === 'email' && (
              <form className="login-form" onSubmit={handleEmailAuth}>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@university.edu" required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                </div>

                {mode === 'register' && (
                  <>
                    <div className="input-group">
                      <label>Full Name</label>
                      <div className="input-wrapper"><User size={18} /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" required /></div>
                    </div>
                    <div className="input-group">
                      <label>College Name (Compulsory)</label>
                      <div className="input-wrapper"><BookOpen size={18} /><input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="University" required /></div>
                    </div>
                    <div className="input-group">
                      <label>Role</label>
                      <select className="role-select" value={role} onChange={e => setRole(e.target.value)}>
                        <option value={ROLES.STUDENT}>Student</option>
                        <option value={ROLES.SOCIETY}>Society Member</option>
                        <option value={ROLES.FACULTY}>Faculty Advisor</option>
                        <option value={ROLES.ADMIN}>Admin</option>
                      </select>
                    </div>
                  </>
                )}

                <button type="submit" className="login-btn active" disabled={loading}>
                  {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
                </button>

                <p className="mode-toggle" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                  {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </p>
              </form>
            )}

            {method === 'phone' && (
              <form className="login-form">
                {!confirmationResult ? (
                  <>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <div className="input-wrapper">
                        <Phone size={18} />
                        <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+91 9876543210" required />
                      </div>
                    </div>
                    <div id="recaptcha-container"></div>
                    <button type="button" className="login-btn active" onClick={onPhoneSubmit} disabled={loading}>
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Enter OTP</label>
                      <div className="input-wrapper">
                        <Lock size={18} />
                        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" required />
                      </div>
                    </div>
                    <button type="button" className="login-btn active" onClick={onOtpSubmit} disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <p className="mode-toggle" onClick={() => setConfirmationResult(null)}>Edit Phone Number</p>
                  </>
                )}
              </form>
            )}

            {method === 'google' && (
              <div className="google-login-section">
                <p className="form-desc text-center">Fast, secure login with your University G-Suite account.</p>
                <button className="login-btn active google-btn" onClick={handleGoogleLogin} disabled={loading}>
                  <Sparkles size={18} /> Continue with Google
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
