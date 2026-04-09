import { useState, useMemo, useEffect, useRef } from 'react';
import { CAMPUS_BUILDINGS, CAMPUS_PATHS } from '../core/campusData';
import { Map, Building2, Users, Zap, BookOpen, Dumbbell, Heart, Coffee, GraduationCap, Home, Shield } from 'lucide-react';
import './CampusTwin.css';

const TYPE_ICONS = {
  academic: '🎓', venue: '🎭', library: '📚', hostel: '🏠', sports: '⚽',
  health: '🏥', social: '🎪', admin: '🏛️', mess: '🍽️', faculty_res: '👔',
};

const TYPE_LABELS = {
  academic: 'Academic', venue: 'Venues', library: 'Library', hostel: 'Hostels',
  sports: 'Sports', health: 'Health', social: 'Student Life', admin: 'Admin',
  mess: 'Dining', faculty_res: 'Faculty',
};

function getOccupancy(building) {
  const hour = new Date().getHours();
  const base = building.type === 'academic' ? 0.7 : building.type === 'hostel' ? 0.5 :
    building.type === 'library' ? 0.4 : building.type === 'sports' ? 0.3 : 0.4;
  const timeMod = hour >= 9 && hour <= 17 ? 1.2 : hour >= 18 && hour <= 22 ? 0.8 : 0.3;
  return Math.min(1, base * timeMod * (0.7 + Math.random() * 0.3));
}

function getStatusColor(occ) {
  if (occ > 0.8) return '#ef4444';
  if (occ > 0.5) return '#f59e0b';
  return '#22c55e';
}

export default function CampusTwin() {
  const svgRef = useRef(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [occupancies, setOccupancies] = useState({});
  const [particles, setParticles] = useState([]);
  const [time, setTime] = useState(Date.now());

  // Simulate live occupancy
  useEffect(() => {
    const update = () => {
      const occ = {};
      CAMPUS_BUILDINGS.forEach(b => { occ[b.id] = getOccupancy(b); });
      setOccupancies(occ);
    };
    update();
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, []);

  // Animated particles
  useEffect(() => {
    const iv = setInterval(() => {
      setTime(Date.now());
      setParticles(prev => {
        const pNew = prev.filter(p => p.progress < 1).map(p => ({ ...p, progress: p.progress + 0.02 }));
        if (Math.random() < 0.4 && CAMPUS_PATHS.length > 0) {
          const path = CAMPUS_PATHS[Math.floor(Math.random() * CAMPUS_PATHS.length)];
          pNew.push({ id: Date.now() + Math.random(), from: path.from, to: path.to, progress: 0 });
        }
        return pNew.slice(-20);
      });
    }, 80);
    return () => clearInterval(iv);
  }, []);

  const buildingMap = useMemo(() => {
    const m = {};
    CAMPUS_BUILDINGS.forEach(b => { m[b.id] = b; });
    return m;
  }, []);

  const filteredBuildings = useMemo(() => {
    if (activeFilter === 'all') return CAMPUS_BUILDINGS;
    return CAMPUS_BUILDINGS.filter(b => b.type === activeFilter);
  }, [activeFilter]);

  const zoneTypes = useMemo(() => {
    const types = [...new Set(CAMPUS_BUILDINGS.map(b => b.type))];
    return types;
  }, []);

  const stats = useMemo(() => {
    const totalCap = CAMPUS_BUILDINGS.reduce((s, b) => s + b.capacity, 0);
    const totalOcc = CAMPUS_BUILDINGS.reduce((s, b) => s + (occupancies[b.id] || 0) * b.capacity, 0);
    const avgOcc = CAMPUS_BUILDINGS.length > 0 ? Object.values(occupancies).reduce((s, v) => s + v, 0) / CAMPUS_BUILDINGS.length : 0;
    return { totalCap, totalOcc: Math.round(totalOcc), avgOcc: Math.round(avgOcc * 100), buildings: CAMPUS_BUILDINGS.length };
  }, [occupancies]);

  return (
    <div className="ct-container">
      {/* Hero */}
      <div className="ct-hero animate-fade-in">
        <div className="ct-hero-badge">
          <Map size={14} />
          <span>LIVE CAMPUS INTELLIGENCE</span>
          <span className="live-dot" />
        </div>
        <h1>Campus Digital Twin</h1>
        <p>Real-time occupancy, student flow, and facility monitoring across {CAMPUS_BUILDINGS.length} zones</p>
      </div>

      {/* Stats Row */}
      <div className="ct-stats">
        <div className="ct-stat animate-card-entrance stagger-1">
          <div className="ct-stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6c63ff' }}><Building2 size={18} /></div>
          <div><div className="ct-stat-val">{stats.buildings}</div><div className="ct-stat-lbl">Total Zones</div></div>
        </div>
        <div className="ct-stat animate-card-entrance stagger-2">
          <div className="ct-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}><Users size={18} /></div>
          <div><div className="ct-stat-val">{stats.totalOcc.toLocaleString()}</div><div className="ct-stat-lbl">Live Occupancy</div></div>
        </div>
        <div className="ct-stat animate-card-entrance stagger-3">
          <div className="ct-stat-icon" style={{ background: 'rgba(245, 165, 36, 0.15)', color: '#f5a524' }}><Zap size={18} /></div>
          <div><div className="ct-stat-val">{stats.avgOcc}%</div><div className="ct-stat-lbl">Avg Utilization</div></div>
        </div>
        <div className="ct-stat animate-card-entrance stagger-4">
          <div className="ct-stat-icon" style={{ background: 'rgba(232, 93, 155, 0.15)', color: '#e85d9b' }}><GraduationCap size={18} /></div>
          <div><div className="ct-stat-val">{stats.totalCap.toLocaleString()}</div><div className="ct-stat-lbl">Total Capacity</div></div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="ct-filters">
        <button
          className={`ct-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >All Zones</button>
        {zoneTypes.map(type => (
          <button
            key={type}
            className={`ct-filter-pill ${activeFilter === type ? 'active' : ''}`}
            onClick={() => setActiveFilter(type)}
          >
            <span>{TYPE_ICONS[type]}</span>
            {TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="ct-layout">
        {/* Map Area */}
        <div className="ct-map-card animate-card-entrance stagger-2">
          <div className="ct-map-header">
            <h2>🗺️ Interactive Campus Map</h2>
            <span className="ct-map-live"><span className="live-dot" /> Live</span>
          </div>
          <div className="ct-map-canvas">
            <svg ref={svgRef} viewBox="0 0 800 520" className="ct-svg">
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(108,99,255,0.06)" strokeWidth="0.5" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="800" height="520" fill="url(#grid)" />

              {/* Zone Backgrounds */}
              <rect x="30" y="30" width="730" height="120" rx="8" fill="rgba(108,99,255,0.04)" stroke="rgba(108,99,255,0.1)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="40" y="50" fill="rgba(108,99,255,0.3)" fontSize="10" fontWeight="600">ACADEMIC ZONE</text>

              <rect x="660" y="140" width="130" height="400" rx="8" fill="rgba(100,116,139,0.04)" stroke="rgba(100,116,139,0.1)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="670" y="158" fill="rgba(100,116,139,0.3)" fontSize="10" fontWeight="600">RESIDENTIAL</text>

              <rect x="30" y="360" width="280" height="140" rx="8" fill="rgba(42,201,168,0.04)" stroke="rgba(42,201,168,0.1)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="40" y="378" fill="rgba(42,201,168,0.3)" fontSize="10" fontWeight="600">SPORTS & WELLNESS</text>

              {/* Paths */}
              {CAMPUS_PATHS.map((path, i) => {
                const fromB = buildingMap[path.from];
                const toB = buildingMap[path.to];
                if (!fromB || !toB) return null;
                const x1 = fromB.x + fromB.w / 2, y1 = fromB.y + fromB.h / 2;
                const x2 = toB.x + toB.w / 2, y2 = toB.y + toB.h / 2;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(108,99,255,0.12)" strokeWidth={1 + path.flow * 2}
                    strokeDasharray={path.flow > 0.6 ? "none" : "4 4"}
                  />
                );
              })}

              {/* Particles */}
              {particles.map(p => {
                const fromB = buildingMap[p.from];
                const toB = buildingMap[p.to];
                if (!fromB || !toB) return null;
                const x = fromB.x + fromB.w / 2 + (toB.x + toB.w / 2 - fromB.x - fromB.w / 2) * p.progress;
                const y = fromB.y + fromB.h / 2 + (toB.y + toB.h / 2 - fromB.y - fromB.h / 2) * p.progress;
                return <circle key={p.id} cx={x} cy={y} r={3} fill="#6c63ff" opacity={1 - p.progress} filter="url(#glow)" />;
              })}

              {/* Buildings */}
              {filteredBuildings.map(b => {
                const occ = occupancies[b.id] || 0;
                const statusCol = getStatusColor(occ);
                const isSelected = selectedBuilding?.id === b.id;
                return (
                  <g key={b.id} onClick={() => setSelectedBuilding(b)} style={{ cursor: 'pointer' }}>
                    {/* Shadow */}
                    <rect x={b.x + 2} y={b.y + 2} width={b.w} height={b.h} rx={6}
                      fill="rgba(0,0,0,0.08)" />
                    {/* Building */}
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={6}
                      fill={b.color} fillOpacity={isSelected ? 0.95 : 0.8}
                      stroke={isSelected ? '#fff' : b.color} strokeWidth={isSelected ? 3 : 1}
                      strokeOpacity={isSelected ? 1 : 0.3}
                    />
                    {/* Occupancy bar */}
                    <rect x={b.x + 4} y={b.y + b.h - 8} width={(b.w - 8) * occ} height={4} rx={2}
                      fill={statusCol} opacity={0.9} />
                    <rect x={b.x + 4} y={b.y + b.h - 8} width={b.w - 8} height={4} rx={2}
                      fill="rgba(255,255,255,0.15)" />
                    {/* Label */}
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 4}
                      textAnchor="middle" fill="white" fontSize={b.w > 100 ? 12 : 10}
                      fontWeight="700" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {b.short}
                    </text>
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 10}
                      textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={8}>
                      {Math.round(occ * b.capacity)}/{b.capacity}
                    </text>
                    {/* Type icon */}
                    <text x={b.x + 6} y={b.y + 14} fontSize={10}>{TYPE_ICONS[b.type]}</text>
                    {/* Status dot */}
                    <circle cx={b.x + b.w - 8} cy={b.y + 8} r={4} fill={statusCol} />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="ct-legend">
            <div className="ct-legend-item"><span className="ct-legend-dot" style={{ background: '#22c55e' }} />Low (&lt;50%)</div>
            <div className="ct-legend-item"><span className="ct-legend-dot" style={{ background: '#f59e0b' }} />Medium (50-80%)</div>
            <div className="ct-legend-item"><span className="ct-legend-dot" style={{ background: '#ef4444' }} />High (&gt;80%)</div>
            <div className="ct-legend-item"><span className="ct-legend-particle" />Student Flow</div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="ct-sidebar">
          {/* Selected Building Detail */}
          {selectedBuilding ? (
            <div className="ct-detail-card animate-card-entrance">
              <div className="ct-detail-header" style={{ background: selectedBuilding.color }}>
                <span className="ct-detail-icon">{TYPE_ICONS[selectedBuilding.type]}</span>
                <div>
                  <h3>{selectedBuilding.name}</h3>
                  <span className="ct-detail-type">{TYPE_LABELS[selectedBuilding.type] || selectedBuilding.type}</span>
                </div>
              </div>
              <div className="ct-detail-body">
                <div className="ct-detail-grid">
                  <div className="ct-detail-item">
                    <span className="ct-detail-label">Capacity</span>
                    <span className="ct-detail-value">{selectedBuilding.capacity}</span>
                  </div>
                  <div className="ct-detail-item">
                    <span className="ct-detail-label">Floors</span>
                    <span className="ct-detail-value">{selectedBuilding.floors}</span>
                  </div>
                  <div className="ct-detail-item">
                    <span className="ct-detail-label">Occupancy</span>
                    <span className="ct-detail-value" style={{ color: getStatusColor(occupancies[selectedBuilding.id] || 0) }}>
                      {Math.round((occupancies[selectedBuilding.id] || 0) * 100)}%
                    </span>
                  </div>
                  <div className="ct-detail-item">
                    <span className="ct-detail-label">Current</span>
                    <span className="ct-detail-value">
                      {Math.round((occupancies[selectedBuilding.id] || 0) * selectedBuilding.capacity)}
                    </span>
                  </div>
                </div>
                {selectedBuilding.amenities && (
                  <div className="ct-detail-amenities">
                    <span className="ct-detail-label">Amenities</span>
                    <div className="ct-detail-tags">
                      {selectedBuilding.amenities.map(a => (
                        <span key={a} className="ct-detail-tag">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="ct-detail-card ct-hint-card animate-card-entrance">
              <div className="ct-hint-icon">👆</div>
              <p>Click a building on the map to see details</p>
            </div>
          )}

          {/* Zone Summary */}
          <div className="ct-zone-summary animate-card-entrance stagger-3">
            <h3>Zone Summary</h3>
            {zoneTypes.map(type => {
              const buildings = CAMPUS_BUILDINGS.filter(b => b.type === type);
              const avgOcc = buildings.reduce((s, b) => s + (occupancies[b.id] || 0), 0) / buildings.length;
              return (
                <div key={type} className="ct-zone-row" onClick={() => setActiveFilter(type === activeFilter ? 'all' : type)}>
                  <span className="ct-zone-icon">{TYPE_ICONS[type]}</span>
                  <div className="ct-zone-info">
                    <span className="ct-zone-name">{TYPE_LABELS[type]}</span>
                    <span className="ct-zone-count">{buildings.length} {buildings.length === 1 ? 'zone' : 'zones'}</span>
                  </div>
                  <div className="ct-zone-bar-wrap">
                    <div className="ct-zone-bar" style={{ width: `${avgOcc * 100}%`, background: getStatusColor(avgOcc) }} />
                  </div>
                  <span className="ct-zone-pct" style={{ color: getStatusColor(avgOcc) }}>{Math.round(avgOcc * 100)}%</span>
                </div>
              );
            })}
          </div>

          {/* Live Feed */}
          <div className="ct-live-feed animate-card-entrance stagger-4">
            <h3><span className="live-dot" /> Live Activity</h3>
            {[
              { text: 'CSE Lab 3 — capacity reached 85%', time: '2m ago', type: 'warning' },
              { text: 'Sports Complex — badminton court booked', time: '5m ago', type: 'info' },
              { text: 'Library — 45 new check-ins today', time: '8m ago', type: 'success' },
              { text: 'Health Center — Dr. Sharma available', time: '12m ago', type: 'info' },
              { text: "Girls Hostel — mess now open", time: '15m ago', type: 'success' },
            ].map((item, i) => (
              <div key={i} className={`ct-feed-item feed-${item.type}`}>
                <div className="ct-feed-dot" />
                <div className="ct-feed-text">{item.text}</div>
                <div className="ct-feed-time">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
