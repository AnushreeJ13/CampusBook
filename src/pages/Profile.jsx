import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, BookOpen, Activity } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, university } = useAuth();

  if (!user) return null;

  return (
    <div className="profile-container animate-card-entrance">
      <div className="profile-header glass-pane">
        <div className="profile-avatar-wrapper">
          {user.avatar || '👤'}
        </div>
        <div className="profile-info">
          <span className="badge-scan mb-4">ACTIVE STUDENT</span>
          <h1>{user.displayName || user.name || 'User'}</h1>
          <div className="flex items-center gap-4">
            <span className="badge badge-accent font-mono">{user.role?.toUpperCase() || 'PROFILE INCOMPLETE'}</span>
            <div className="flex items-center gap-2 text-secondary font-mono text-xs">
               <Activity size={14} className="text-accent animate-pulse" />
               STATUS: ACTIVE
            </div>
          </div>
        </div>

        {/* Decoder background decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Shield size={200} />
        </div>
      </div>

      <div className="identity-grid">
        <div className="identity-card glass-pane">
          <div className="id-label"><Mail size={16}/> University Email</div>
          <div className="id-value font-mono">{user.email}</div>
          <div className="card-scanner-line" />
        </div>
        
        <div className="identity-card glass-pane">
          <div className="id-label"><BookOpen size={16}/> Affiliated Institution</div>
          <div className="id-value font-mono">{university}</div>
          <div className="card-scanner-line" />
        </div>

        {user.clubName && (
          <div className="identity-card glass-pane">
            <div className="id-label"><Shield size={16}/> Primary Club/Society</div>
            <div className="id-value font-mono">{user.clubName}</div>
            <div className="card-scanner-line" />
          </div>
        )}

        {user.assignedClubs && (
          <div className="identity-card glass-pane">
            <div className="id-label"><Shield size={16}/> Other Club Memberships</div>
            <div className="id-value font-mono">{user.assignedClubs.join(', ')}</div>
            <div className="card-scanner-line" />
          </div>
        )}

        <div className="identity-card glass-pane" style={{borderColor: 'rgba(245, 158, 11, 0.2)'}}>
          <div className="id-label" style={{color: '#f59e0b'}}><Activity size={16}/> Campus Engagement Score</div>
          <div className="id-value font-mono" style={{color: '#f59e0b', fontSize: '1.5rem'}}>842.5</div>
          <div className="card-scanner-line" style={{background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)'}} />
        </div>

        <div className="identity-card glass-pane" style={{borderColor: 'rgba(16, 185, 129, 0.2)'}}>
          <div className="id-label" style={{color: '#10b981'}}><Activity size={16}/> Account Status</div>
          <div className="id-value font-mono" style={{color: '#10b981', fontSize: '1.5rem'}}>VERIFIED</div>
          <div className="card-scanner-line" style={{background: 'linear-gradient(90deg, transparent, #10b981, transparent)'}} />
        </div>
      </div>
    </div>
  );
}
