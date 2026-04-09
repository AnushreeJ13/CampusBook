import React, { useState, useMemo } from "react";
import { useProposals } from "../../contexts/ProposalContext";
import { useProfile } from "../../contexts/ProfileContext";
import { useAuth } from "../../contexts/AuthContext";
import { rankEvents } from "../../utils/recommendationEngine";
import { Sparkles, Activity, MapPin, Calendar, ArrowRight, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './EventRecommendations.css';

function ScorePill({ score, label, colorClass }) {
    return (
        <div className="score-pill">
            <div className="score-pill-header">
                <span>{label}</span>
                <strong>{Math.round(score * 100)}%</strong>
            </div>
            <div className="score-bar-track">
                <div 
                    className={`score-bar-fill ${colorClass}`} 
                    style={{ width: `${score * 100}%` }}
                />
            </div>
        </div>
    );
}

function RecommendationCard({ event, index }) {
    // Calculate internal breakdowns for visual fidelity
    const contentMatch = event.affinityScore * 0.9;
    const socialPeer = event.affinityScore * 1.1;

    return (
        <Link to={`/events/${event.id}`} className="rec-card">
            <div className="rec-card-corner"></div>
            <div className="rec-card-top">
                <div className="rec-tags">
                    <span className="rec-tag-type">
                        {event.eventType}
                    </span>
                    <span className="rec-tag-top">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        Top Pick
                    </span>
                </div>
                <div className="rec-match">
                    <span className="rec-match-score">{Math.round(event.affinityScore * 100)}%</span>
                    <span className="rec-match-label">Match</span>
                </div>
            </div>

            <h3 className="rec-card-title">{event.title}</h3>
            <p className="rec-card-desc">
                {event.description}
            </p>

            <div className="rec-scores">
                <ScorePill score={contentMatch} label="Interest Match" colorClass="score-fill-accent" />
                <ScorePill score={socialPeer} label="Popularity" colorClass="score-fill-primary" />
            </div>

            <div className="rec-card-footer">
                <div className="rec-date">
                    <Calendar size={14} /> {event.date}
                </div>
                <div className="rec-action">
                    View Details <ArrowRight size={14} />
                </div>
            </div>
        </Link>
    );
}

export default function EventRecommendations() {
    const { user } = useAuth();
    const { proposals } = useProposals();
    const { profile } = useProfile();
    const [loading, setLoading] = useState(false);

    // Filter valid events
    const validEvents = useMemo(() => {
        return proposals.filter(p => p.status === 'approved' || p.status === 'venue_booked');
    }, [proposals]);

    // Rank events
    const recommendations = useMemo(() => {
        if (!validEvents.length) return [];
        return rankEvents(validEvents, profile || {});
    }, [validEvents, profile]);

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 800);
    };

    return (
        <div className="rec-container">
            <div className="rec-header">
                <div className="rec-title-group">
                    <h2>
                        <Sparkles className="text-accent" />
                        Recommended For You
                    </h2>
                    <p className="rec-subtitle">Based on your interests and recent engagement</p>
                </div>
                
                <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="rec-btn-refresh"
                >
                    <Activity size={14} className={loading ? "animate-spin" : ""} />
                    {loading ? "Updating..." : "Refresh"}
                </button>
            </div>

            <div className="rec-grid">
                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="rec-card" style={{ height: '220px', animation: 'pulse 1.5s infinite' }} />
                    ))
                ) : (
                    recommendations.slice(0, 3).map((event, i) => (
                        <RecommendationCard key={event.id} event={event} index={i} />
                    ))
                )}

                {!loading && recommendations.length === 0 && (
                    <div className="rec-empty">
                        <Activity size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                        <p>Finding events matching your profile...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

