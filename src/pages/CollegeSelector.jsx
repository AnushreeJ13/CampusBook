import { useState } from 'react';
import { COLLEGES } from '../utils/constants';

export default function CollegeSelector({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold tracking-widest uppercase animate-bounce">
            Select Your Institution
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">CampusOS</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Choose your college to enter the decentralized campus intelligence engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLLEGES.map((college) => (
            <button
              key={college.id}
              onClick={() => onSelect(college)}
              onMouseEnter={() => setHovered(college.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2.5rem] transition-all duration-500 hover:scale-105 hover:bg-slate-800/60 hover:border-indigo-500/50 text-left overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100"
              />
              
              <div className="relative z-10">
                <div className="text-5xl mb-6 transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
                  {college.logo}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                  {college.name}
                </h3>
                <div className="text-slate-500 text-sm font-medium tracking-wider">
                  {college.shortName}
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700" />
            </button>
          ))}
        </div>

        <div className="mt-16 text-center text-slate-500 text-sm font-medium">
          <p>© 2026 CampusOS Intelligence Platform</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
