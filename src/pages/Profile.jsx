import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { User, Mail, Shield, BookOpen, Activity, Tag, Sparkles, Edit2 } from 'lucide-react';
import InterestOnboarding from '../components/profile/InterestOnboarding';
import './Profile.css';

export default function Profile() {
  const { user, university } = useAuth();
  const { profile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

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
          <div className="id-label" style={{color: '#10b981'}}><Shield size={16}/> Account Status</div>
          <div className="id-value font-mono" style={{color: '#10b981', fontSize: '1.5rem'}}>VERIFIED</div>
          <div className="card-scanner-line" style={{background: 'linear-gradient(90deg, transparent, #10b981, transparent)'}} />
        </div>

        {user.role === 'student' && (
          <div className="identity-card glass-pane" style={{ gridColumn: '1 / -1', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <div className="flex justify-between items-center mb-4">
               <div className="id-label" style={{color: '#8b5cf6', margin: 0}}><Sparkles size={16}/> Intelligence Profile (AI Matches)</div>
               <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-mono border border-purple-500/30 transition-colors"
               >
                  <Edit2 size={12} /> RECALIBRATE INTERESTS
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <div className="text-xs text-secondary font-mono mb-2">MAPPED DOMAINS</div>
                  <div className="flex flex-wrap gap-2">
                     {profile?.interests?.map(interest => (
                        <span key={interest} className="px-2 py-1 rounded bg-dark-eval border border-border-color text-xs font-mono flex items-center gap-1">
                           <Tag size={10} className="text-accent"/> {interest}
                        </span>
                     )) || <span className="text-secondary text-xs">NO DOMAINS MAPPED</span>}
                  </div>
               </div>
               <div>
                  <div className="text-xs text-secondary font-mono mb-2">EXTRACTED SKILLS</div>
                  <div className="flex flex-wrap gap-2">
                     {profile?.skills?.map(skill => (
                        <span key={skill} className="px-2 py-1 rounded bg-dark-eval border border-border-color text-xs font-mono flex items-center gap-1 text-cyan-400">
                           <Sparkles size={10} className="text-cyan-500"/> {skill}
                        </span>
                     )) || <span className="text-secondary text-xs">NO SKILLS DETECTED</span>}
                  </div>
               </div>
            </div>
            <div className="card-scanner-line" style={{background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)'}} />
          </div>
        )}
      </div>

      {isEditing && (
        <InterestOnboarding onComplete={() => setIsEditing(false)} />
      )}
    </div>
  );
}
