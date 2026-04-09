import { useState, useMemo, useEffect, useRef } from 'react';
import { useProposals } from '../contexts/ProposalContext';
import { useVenues } from '../contexts/VenueContext';
import { detectAnomalies, buildGraphData, getResourceMetrics } from '../core/graphEngine';
import { Shield, AlertTriangle, TrendingUp, Users, BarChart3, Eye } from 'lucide-react';
import './GraphInsights.css';

export default function GraphInsights() {
  const { proposals, bookings } = useProposals();
  const { venues } = useVenues();
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const anomalies = useMemo(() => detectAnomalies(proposals, bookings, venues), [proposals, bookings, venues]);
  const graphData = useMemo(() => buildGraphData(proposals, venues), [proposals, venues]);
  const metrics = useMemo(() => getResourceMetrics(proposals, venues, bookings), [proposals, venues, bookings]);

  // Simple force-directed layout
  const nodePositions = useMemo(() => {
    const positions = {};
    const W = 580, H = 400;
    const cx = W / 2, cy = H / 2;
    const total = graphData.nodes.length || 1;

    graphData.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / total;
      const radius = 100 + Math.random() * 80;
      positions[node.id] = {
        x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
      };
    });
    return positions;
  }, [graphData]);

  return (
    <div className="gi-container">
      {/* Hero */}
      <div className="gi-hero animate-fade-in">
        <div className="flex items-center gap-sm" style={{ marginBottom: 4 }}>
          <Shield size={16} style={{ opacity: 0.8 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>Resource Intelligence</span>
        </div>
        <h1>Graph Intelligence Panel</h1>
        <p>Anomaly detection, resource misuse analysis, and institutional intelligence</p>
      </div>

      {/* Metrics */}
      <div className="gi-metrics">
        <div className="gi-metric-card animate-card-entrance stagger-1">
          <div className="gi-metric-icon" style={{ background: '#edeaff' }}>📊</div>
          <div>
            <div className="gi-metric-value">{metrics.totalProposals}</div>
            <div className="gi-metric-label">Total Proposals</div>
          </div>
        </div>
        <div className="gi-metric-card animate-card-entrance stagger-2">
          <div className="gi-metric-icon" style={{ background: '#f0fdf4' }}>✅</div>
          <div>
            <div className="gi-metric-value" style={{ color: '#22c55e' }}>{metrics.approvalRate}%</div>
            <div className="gi-metric-label">Approval Rate</div>
          </div>
        </div>
        <div className="gi-metric-card animate-card-entrance stagger-3">
          <div className="gi-metric-icon" style={{ background: '#fef2f2' }}>🛡️</div>
          <div>
            <div className="gi-metric-value" style={{ color: anomalies.length > 3 ? '#ef4444' : '#f59e0b' }}>{anomalies.length}</div>
            <div className="gi-metric-label">Anomalies Detected</div>
          </div>
        </div>
        <div className="gi-metric-card animate-card-entrance stagger-4">
          <div className="gi-metric-icon" style={{ background: '#eff6ff' }}>⭐</div>
          <div>
            <div className="gi-metric-value">{metrics.avgRating}</div>
            <div className="gi-metric-label">Avg Event Rating</div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="gi-layout">
        {/* Graph Visualization */}
        <div className="gi-graph-card animate-card-entrance stagger-2">
          <div className="gi-graph-header">
            <h2><Eye size={16} style={{ opacity: 0.5 }} /> Entity Relationship Graph</h2>
          </div>
          <div className="gi-graph-canvas" ref={canvasRef}>
            {/* SVG Edges */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {graphData.edges.map((edge, i) => {
                const from = nodePositions[edge.source];
                const to = nodePositions[edge.target];
                if (!from || !to) return null;
                return (
                  <line
                    key={i}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke="rgba(108, 99, 255, 0.2)"
                    strokeWidth={Math.min(edge.weight + 1, 4)}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {graphData.nodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              return (
                <div
                  key={node.id}
                  className={`gi-node type-${node.type}`}
                  style={{
                    left: pos.x - node.size / 2,
                    top: pos.y - node.size / 2,
                    width: node.size,
                    height: node.size,
                  }}
                  onClick={() => setSelectedNode(node)}
                  title={`${node.label} (${node.type})`}
                >
                  <span className="gi-node-label">{node.label}</span>
                </div>
              );
            })}

            {/* Legend */}
            <div className="gi-legend">
              <div className="gi-legend-item">
                <div className="gi-legend-dot" style={{ background: '#e85d9b' }} />
                Society
              </div>
              <div className="gi-legend-item">
                <div className="gi-legend-dot" style={{ background: '#6c63ff' }} />
                Venue
              </div>
              <div className="gi-legend-item">
                <div className="gi-legend-dot" style={{ background: '#2ac9a8' }} />
                Event Type
              </div>
            </div>

            {graphData.nodes.length === 0 && (
              <div className="gi-empty">
                <div className="gi-empty-icon">🔗</div>
                <p style={{ fontSize: 13 }}>Add proposals to see relationship graph</p>
              </div>
            )}
          </div>
        </div>

        {/* Anomaly Sidebar */}
        <div className="gi-anomalies">
          <div className="gi-anomaly-section-title">
            <AlertTriangle size={16} style={{ opacity: 0.5 }} /> Detected Anomalies
          </div>

          {anomalies.length > 0 ? anomalies.map((anomaly, i) => (
            <div key={anomaly.id} className={`gi-anomaly-card severity-${anomaly.severity} animate-card-entrance stagger-${i + 1}`}>
              <div className="gi-anomaly-header">
                <span className="gi-anomaly-icon">{anomaly.icon}</span>
                <span className="gi-anomaly-title">{anomaly.title}</span>
                <span className={`gi-anomaly-severity ${anomaly.severity}`}>{anomaly.severity}</span>
              </div>
              <div className="gi-anomaly-desc">{anomaly.description}</div>
              <div className="gi-anomaly-bar">
                <div
                  className="gi-anomaly-bar-fill"
                  style={{
                    width: `${Math.min(100, (anomaly.value / anomaly.threshold) * 100)}%`,
                    background: anomaly.severity === 'high' ? '#ef4444' : anomaly.severity === 'medium' ? '#f59e0b' : '#6b7280',
                  }}
                />
              </div>
            </div>
          )) : (
            <div className="gi-anomaly-card" style={{ borderLeftColor: '#22c55e', textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>All Clear</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                No anomalies detected. Add more proposals to see intelligence insights.
              </div>
            </div>
          )}

          {/* Resource Stats */}
          <div className="gi-anomaly-card" style={{ borderLeftColor: '#6c63ff' }}>
            <div className="gi-anomaly-header">
              <span className="gi-anomaly-icon">📈</span>
              <span className="gi-anomaly-title">Resource Health</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block' }}>Attendance Rate</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{metrics.avgAttendanceRate}%</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block' }}>Peak Day</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{metrics.peakDay}</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block' }}>Avg Processing</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{metrics.avgProcessingDays} days</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block' }}>Peak Time</span>
                <span style={{ fontWeight: 700, fontSize: 11 }}>{metrics.peakTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
