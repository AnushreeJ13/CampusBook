import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { fetchFacultyByCollege } from '../api';
import { Sparkles, Mail, Lock, User, GraduationCap, Users, BookOpen, Shield, Phone, LogIn, FileText, UserCheck } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { 
    user, 
    loginWithEmail, 
    loginWithGoogle, 
    register, 
    completeProfile, 
    setupRecaptcha, 
    loginWithPhone 
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login', 'register', 'google-setup', 'phone'
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

  // Society-specific fields
  const [societyDescription, setSocietyDescription] = useState('');
  const [facultyAdvisorId, setFacultyAdvisorId] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const navigate = useNavigate();

  // Redirect if logged in and profile complete (and not pending approval)
  useEffect(() => {
    if (user && !user.incomplete && !user.pendingApproval && !user.rejectedApproval) {
      navigate('/dashboard');
    } else if (user?.incomplete) {
      setMode('google-setup');
    }
  }, [user, navigate]);

  // Fetch faculty list when college changes and role is society
  useEffect(() => {
    if (role === ROLES.SOCIETY && college && college.length >= 3) {
      setLoadingFaculty(true);
      fetchFacultyByCollege(college).then(list => {
        setFacultyList(list);
        setLoadingFaculty(false);
      }).catch(() => {
        setFacultyList([]);
        setLoadingFaculty(false);
      });
    } else {
      setFacultyList([]);
      setFacultyAdvisorId('');
    }
  }, [college, role]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!college) throw new Error("College name is compulsory.");
        
        // Society-specific validation
        if (role === ROLES.SOCIETY) {
          if (!societyDescription.trim()) throw new Error("Please describe your society's purpose.");
          if (!facultyAdvisorId) throw new Error("Please select a faculty advisor for your society.");
        }

        const selectedFaculty = facultyList.find(f => f.id === facultyAdvisorId);
        await register(email, password, name, college, role, {
          societyDescription: societyDescription.trim(),
          facultyAdvisorId,
          facultyAdvisorName: selectedFaculty?.name || '',
        });

        // If society, show the pending screen instead of navigating
        if (role === ROLES.SOCIETY) {
          setRegistrationComplete(true);
          setLoading(false);
          return;
        }

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
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

  // Pending Approval Screen — shown after successful society registration
  if (registrationComplete || user?.pendingApproval) {
    return (
      <div className="login-page">
        <div className="login-bg">
          <div className="login-bg-orb login-bg-orb-1" />
          <div className="login-bg-orb login-bg-orb-2" />
          <div className="login-bg-grid" />
        </div>
        <div className="login-container" style={{ maxWidth: 480 }}>
          <div className="login-header">
            <div className="login-logo" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <UserCheck size={32} />
            </div>
            <h1 className="login-title">Pending Approval</h1>
            <p className="login-subtitle" style={{ maxWidth: 360 }}>
              Your society registration is being reviewed by your faculty advisor.
            </p>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>Awaiting Faculty Approval</h3>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
              Your account has been created but is pending approval from your chosen faculty advisor. 
              You'll be able to log in once they approve your registration.
            </p>
            {user?.facultyAdvisorName && (
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
                <strong style={{ color: '#e5e7eb' }}>Faculty Advisor:</strong> {user.facultyAdvisorName}
              </p>
            )}
          </div>

          <button className="login-btn" onClick={async () => {
            if (window.confirm('You can check back later. Sign out now?')) {
              try {
                await loginWithEmail; // no-op to reference
              } catch(e) {}
              // Force sign out and reload
              window.location.reload();
            }
          }} style={{ 
            background: 'transparent', 
            border: '1px solid rgba(255,255,255,0.15)', 
            color: '#9ca3af',
            cursor: 'pointer',
          }}>
            Sign Out & Check Back Later
          </button>
        </div>
      </div>
    );
  }

  // Rejected Screen
  if (user?.rejectedApproval) {
    return (
      <div className="login-page">
        <div className="login-bg">
          <div className="login-bg-orb login-bg-orb-1" />
          <div className="login-bg-orb login-bg-orb-2" />
          <div className="login-bg-grid" />
        </div>
        <div className="login-container" style={{ maxWidth: 480 }}>
          <div className="login-header">
            <div className="login-logo" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
              <Shield size={32} />
            </div>
            <h1 className="login-title">Registration Rejected</h1>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
              Your society registration was not approved by the faculty advisor. 
              Please contact them for more details or try registering again with a different advisor.
            </p>
            {user?.approvalNote && (
              <p style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>
                <strong>Reason:</strong> {user.approvalNote}
              </p>
            )}
          </div>
          <button className="login-btn" onClick={() => window.location.reload()} style={{ 
            background: 'transparent', 
            border: '1px solid rgba(255,255,255,0.15)', 
            color: '#9ca3af',
            cursor: 'pointer',
          }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="login-title">CampusBook</h1>
          <p className="login-subtitle">Secure University Gateway</p>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        {mode === 'google-setup' ? (
          <form className="login-form animate-fade-in" onSubmit={handleSetupComplete}>
            <h2 className="form-title">Complete Your Profile</h2>
            <p className="form-desc">Almost there! We just need your college and role.</p>
            
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />
              </div>
            </div>

            <div className="input-group">
              <label>College / University (Compulsory)</label>
              <div className="input-wrapper">
                <BookOpen size={18} />
                <input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="University Name" required />
              </div>
            </div>

            <div className="input-group">
              <label>Select Role</label>
              <select className="role-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value={ROLES.STUDENT}>Student</option>
                <option value={ROLES.SOCIETY}>Society Member</option>
                <option value={ROLES.FACULTY}>Faculty Advisor</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
            </div>

            <button type="submit" className="login-btn active" disabled={loading}>
              {loading ? 'Finalizing...' : 'Start Using CampusBook'}
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

                    {/* === SOCIETY-SPECIFIC FIELDS === */}
                    {role === ROLES.SOCIETY && (
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.06)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: 12,
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <Users size={16} color="#8b5cf6" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>Society Details</span>
                        </div>

                        {/* Society Description / Purpose */}
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 12, color: '#9ca3af' }}>
                            <FileText size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                            Purpose / Description *
                          </label>
                          <textarea
                            className="role-select"
                            placeholder="Describe what your society does, its goals, and what kind of events you organize..."
                            rows={3}
                            value={societyDescription}
                            onChange={e => setSocietyDescription(e.target.value)}
                            required
                            style={{
                              resize: 'vertical',
                              minHeight: 70,
                              fontFamily: 'inherit',
                              fontSize: 13,
                              padding: '10px 12px',
                              lineHeight: 1.5,
                            }}
                          />
                        </div>

                        {/* Faculty Advisor Dropdown */}
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 12, color: '#9ca3af' }}>
                            <UserCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                            Choose Faculty Advisor *
                          </label>
                          {!college || college.length < 3 ? (
                            <p style={{ fontSize: 12, color: '#6b7280', padding: '8px 0' }}>
                              ↑ Enter your college name above to see available faculty advisors
                            </p>
                          ) : loadingFaculty ? (
                            <p style={{ fontSize: 12, color: '#6b7280', padding: '8px 0' }}>Loading faculty members...</p>
                          ) : (
                            <>
                              <select
                                className="role-select"
                                value={facultyAdvisorId}
                                onChange={e => setFacultyAdvisorId(e.target.value)}
                                required
                                style={{
                                  border: facultyAdvisorId ? '2px solid #22c55e' : undefined,
                                  transition: 'border-color 0.2s',
                                }}
                              >
                                <option value="">— Select a faculty advisor —</option>
                                {facultyList.map(f => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.email})
                                  </option>
                                ))}
                              </select>
                              {facultyList.length === 0 && (
                                <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                                  ⚠️ No faculty found for "{college}". Make sure faculty have registered with the exact same college name.
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div style={{
                          padding: '8px 12px', background: 'rgba(245, 158, 11, 0.08)',
                          borderRadius: 8, fontSize: 11, color: '#9ca3af', lineHeight: 1.5,
                        }}>
                          💡 Your faculty advisor will receive a request and must approve your registration before you can log in.
                        </div>
                      </div>
                    )}
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
