import React from 'react';

export default function UniflowLogo({ size = 32, className = '' }) {
  // SVG representing the 3 waves (dark blue, gold, light blue/gray) 
  // It naturally fits into dark/light modes due to its distinct, elegant colors.
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`uniflow-logo-svg ${className}`}
    >
      {/* Top Wave - Dark Blue */}
      <path 
        d="M 10 45 C 25 20, 35 20, 50 45 C 65 70, 75 70, 90 45" 
        stroke="#0f172a" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Middle Wave - Gold/Amber */}
      <path 
        d="M 10 55 C 25 30, 35 30, 50 55 C 65 80, 75 80, 90 55" 
        stroke="#f59e0b" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Bottom Wave - Light Gray/Blue */}
      <path 
        d="M 10 65 C 25 40, 35 40, 50 65 C 65 90, 75 90, 90 65" 
        stroke="#94a3b8" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* A nice dot on the end of the top wave to match the aesthetic */}
      <circle cx="90" cy="45" r="5" fill="#f59e0b" />
    </svg>
  );
}
