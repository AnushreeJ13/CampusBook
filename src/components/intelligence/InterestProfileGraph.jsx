import { useMemo } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RadarElement, Tooltip } from 'recharts';
import { Sparkles, Target, Activity } from 'lucide-react';
import './InterestProfileGraph.css';

const CATEGORY_MAP = {
  tech: 'Tech',
  culture: 'Culture',
  social: 'Social',
  academic: 'Academic',
  sports: 'Sports'
};

export default function InterestProfileGraph() {
  const { profile } = useProfile();

  const data = useMemo(() => {
    const selectedInterests = profile.interests || [];
    const baseCategories = ['tech', 'culture', 'social', 'academic', 'sports'];
    
    return baseCategories.map(cat => ({
      subject: CATEGORY_MAP[cat],
      A: selectedInterests.includes(cat) ? 90 : 20, // High if selected, base value otherwise
      fullMark: 100,
    }));
  }, [profile]);

  return (
    <div className="interest-graph-card card-smart">
      <div className="graph-header">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          <h3 className="text-sm font-bold tracking-wide">My Interest Profile</h3>
        </div>
        <div className="text-[10px] text-dim font-medium">Status: Calibrated</div>
      </div>

      <div className="graph-visualization">
        <div className="radar-container">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 700 }} 
              />
              <RadarElement
                name="Value"
                dataKey="A"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.4}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  fontSize: '10px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="graph-insights">
          <div className="insight-item">
            <div className="insight-icon"><Activity size={14} /></div>
            <div className="insight-text">
              <span className="insight-label">Primary Interest</span>
              <span className="insight-value">{profile.interests?.[0]?.toUpperCase() || 'NONE'}</span>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon"><Target size={14} /></div>
            <div className="insight-text">
              <span className="insight-label">Skill Count</span>
              <span className="insight-value">{profile.skills?.length || 0} Tags</span>
            </div>
          </div>
        </div>
      </div>

      <div className="graph-footer">
        <span className="footer-text">Personalizing your campus experience...</span>
      </div>
    </div>
  );
}
