import { useMemo } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, Target, Activity } from 'lucide-react';
import './ForensicInterestGraph.css';

export default function ForensicInterestGraph() {
  const { profile } = useProfile();

  const data = useMemo(() => {
    const categories = profile.attendedCategories || {};
    const baseCategories = ['Tech', 'Culture', 'Social', 'Admin', 'Academic', 'Sports'];
    
    return baseCategories.map(cat => ({
      subject: cat.toUpperCase(),
      A: (categories[cat] || 0) * 20 + 10, // Weighted for visualization
      fullMark: 100,
    }));
  }, [profile]);

  return (
    <div className="interest-graph-card card-forensic">
      <div className="graph-header">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-accent" />
          <h3 className="text-sm font-black tracking-widest font-mono">NEURAL_INTEREST_MAP</h3>
        </div>
        <div className="text-[10px] text-dim font-mono">SYNC_STATE: NOMINAL</div>
      </div>

      <div className="graph-visualization">
        <div className="radar-container">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="var(--border-secondary)" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 700 }} 
              />
              <Radar
                name="Affinity"
                dataKey="A"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.2}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="graph-insights">
          <div className="insight-item">
            <div className="insight-icon"><Zap size={14} /></div>
            <div className="insight-text">
              <span className="insight-label">PRIMARY_DOMAIN</span>
              <span className="insight-value">{data.reduce((prev, current) => (prev.A > current.A) ? prev : current).subject}</span>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon"><Target size={14} /></div>
            <div className="insight-text">
              <span className="insight-label">TRUST_FACTOR</span>
              <span className="insight-value">{(profile.trustFactor || 1).toFixed(2)}_AUTH</span>
            </div>
          </div>
        </div>
      </div>

      <div className="graph-footer">
        <div className="scanner-line"></div>
        <span className="footer-text">GENERATING_PREDICTIVE_CLUSTERS...</span>
      </div>
    </div>
  );
}
