import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, BookOpen } from 'lucide-react';

export default function Profile() {
  const { user, university } = useAuth();

  if (!user) return null;

  return (
    <div className="page-container" style={{maxWidth: 800, padding: 'var(--space-2xl)'}}>
      <div className="card animate-fade-in">
         <div className="flex items-center gap-4 mb-6">
            <div style={{fontSize: '4rem'}}>{user.avatar}</div>
            <div>
               <h1 style={{fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--text-primary)'}}>{user.displayName || user.name || 'User'}</h1>
               <span className={`badge badge-accent`}>{user.role?.toUpperCase() || 'PROFILE INCOMPLETE'}</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{marginTop: 'var(--space-xl)'}}>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2 text-gray-500 font-bold mb-1"><Mail size={16}/> Email</div>
               <div className="text-lg font-medium text-gray-900">{user.email}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2 text-gray-500 font-bold mb-1"><BookOpen size={16}/> University</div>
               <div className="text-lg font-medium text-gray-900">{university}</div>
            </div>

            {user.clubName && (
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-2 text-gray-500 font-bold mb-1"><Shield size={16}/> Associated Society</div>
                 <div className="text-lg font-medium text-gray-900">{user.clubName}</div>
               </div>
            )}

            {user.assignedClubs && (
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-2 text-gray-500 font-bold mb-1"><Shield size={16}/> Assisting Societies</div>
                 <div className="text-lg font-medium text-gray-900">{user.assignedClubs.join(', ')}</div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
