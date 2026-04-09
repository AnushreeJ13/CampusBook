/**
 * GRAPH ENGINE — Anomaly Detection & Resource Intelligence
 * "We don't just schedule — we detect misuse of institutional resources."
 */

import { SIMULATED_EVENTS } from './campusData';

/**
 * Detect anomalies and suspicious patterns in campus data
 */
export function detectAnomalies(proposals, bookings, venues) {
  const anomalies = [];

  // 1. Society Spam Detection — same society booking too many slots
  const societyCounts = {};
  proposals.forEach(p => {
    const key = p.clubName || p.clubId || 'unknown';
    societyCounts[key] = (societyCounts[key] || 0) + 1;
  });
  Object.entries(societyCounts).forEach(([society, count]) => {
    if (count > 3) {
      anomalies.push({
        id: `spam-${society}`,
        type: 'society_spam',
        severity: count > 5 ? 'high' : 'medium',
        title: 'Slot Hoarding Detected',
        description: `"${society}" has ${count} active bookings — significantly above average`,
        entity: society,
        entityType: 'society',
        value: count,
        threshold: 3,
        icon: '🔁',
      });
    }
  });

  // 2. Venue Monopolization — one group dominating a venue
  const venueOwnership = {};
  proposals.forEach(p => {
    if (!p.venueId) return;
    const key = p.venueId;
    if (!venueOwnership[key]) venueOwnership[key] = {};
    const society = p.clubName || 'unknown';
    venueOwnership[key][society] = (venueOwnership[key][society] || 0) + 1;
  });
  Object.entries(venueOwnership).forEach(([venueId, societies]) => {
    const total = Object.values(societies).reduce((a, b) => a + b, 0);
    Object.entries(societies).forEach(([society, count]) => {
      const share = total > 0 ? count / total : 0;
      if (share > 0.6 && count >= 2) {
        const venue = venues?.find(v => v.id === venueId);
        anomalies.push({
          id: `mono-${venueId}-${society}`,
          type: 'venue_monopoly',
          severity: share > 0.8 ? 'high' : 'medium',
          title: 'Venue Monopolization',
          description: `"${society}" controls ${Math.round(share * 100)}% of bookings for ${venue?.name || venueId}`,
          entity: venue?.name || venueId,
          entityType: 'venue',
          value: Math.round(share * 100),
          threshold: 60,
          icon: '🏢',
        });
      }
    });
  });

  // 3. Low Attendance Events (Simulated from historical data)
  SIMULATED_EVENTS.forEach(event => {
    const ratio = event.actualAttendees / event.expectedAttendees;
    if (ratio < 0.4) {
      anomalies.push({
        id: `low-att-${event.id}`,
        type: 'low_attendance',
        severity: ratio < 0.25 ? 'high' : 'medium',
        title: 'Low Attendance Event',
        description: `"${event.title}" had ${event.actualAttendees}/${event.expectedAttendees} attendance (${Math.round(ratio * 100)}%)`,
        entity: event.title,
        entityType: 'event',
        value: Math.round(ratio * 100),
        threshold: 40,
        icon: '👻',
      });
    }
  });

  // 4. Faculty Overload Detection
  const reviewerLoad = {};
  proposals.forEach(p => {
    if (p.currentReviewer) {
      reviewerLoad[p.currentReviewer] = (reviewerLoad[p.currentReviewer] || 0) + 1;
    }
  });
  Object.entries(reviewerLoad).forEach(([reviewer, count]) => {
    if (count > 2) {
      anomalies.push({
        id: `overload-${reviewer}`,
        type: 'reviewer_overload',
        severity: count > 4 ? 'high' : 'medium',
        title: 'Reviewer Overloaded',
        description: `Reviewer has ${count} pending proposals — may cause approval bottleneck`,
        entity: reviewer,
        entityType: 'faculty',
        value: count,
        threshold: 2,
        icon: '⚡',
      });
    }
  });

  // 5. Time pattern anomalies — all events clustered in same time
  const timeSlotCounts = {};
  proposals.forEach(p => {
    if (p.timeSlot) {
      timeSlotCounts[p.timeSlot] = (timeSlotCounts[p.timeSlot] || 0) + 1;
    }
  });
  const totalSlotted = Object.values(timeSlotCounts).reduce((a, b) => a + b, 0);
  Object.entries(timeSlotCounts).forEach(([slot, count]) => {
    const share = totalSlotted > 0 ? count / totalSlotted : 0;
    if (share > 0.5 && count >= 3) {
      anomalies.push({
        id: `cluster-${slot}`,
        type: 'time_cluster',
        severity: 'low',
        title: 'Time Slot Clustering',
        description: `${Math.round(share * 100)}% of events are in the same time slot — poor distribution`,
        entity: slot,
        entityType: 'time',
        value: Math.round(share * 100),
        threshold: 50,
        icon: '⏰',
      });
    }
  });

  return anomalies.sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 };
    return (sev[b.severity] || 0) - (sev[a.severity] || 0);
  });
}

/**
 * Build relationship graph data for visualization
 */
export function buildGraphData(proposals, venues) {
  const nodes = [];
  const edges = [];
  const nodeMap = new Set();

  // Add society nodes
  proposals.forEach(p => {
    const name = p.clubName || p.clubId;
    if (name && !nodeMap.has(`soc-${name}`)) {
      nodeMap.add(`soc-${name}`);
      nodes.push({ id: `soc-${name}`, label: name, type: 'society', size: 20, color: '#e85d9b' });
    }
  });

  // Add venue nodes
  (venues || []).forEach(v => {
    if (!nodeMap.has(`ven-${v.id}`)) {
      nodeMap.add(`ven-${v.id}`);
      nodes.push({ id: `ven-${v.id}`, label: v.name, type: 'venue', size: 25, color: '#6c63ff' });
    }
  });

  // Add event type nodes
  const eventTypes = new Set();
  proposals.forEach(p => { if (p.eventType) eventTypes.add(p.eventType); });
  eventTypes.forEach(t => {
    nodes.push({ id: `type-${t}`, label: t, type: 'eventType', size: 15, color: '#2ac9a8' });
  });

  // Build edges: society → venue (weighted by booking count)
  const edgeWeights = {};
  proposals.forEach(p => {
    const socId = `soc-${p.clubName || p.clubId}`;
    const venId = `ven-${p.venueId}`;
    const typeId = `type-${p.eventType}`;

    if (nodeMap.has(socId) && nodeMap.has(venId)) {
      const key = `${socId}-${venId}`;
      edgeWeights[key] = (edgeWeights[key] || 0) + 1;
    }
    if (nodeMap.has(socId) && p.eventType) {
      const key = `${socId}-${typeId}`;
      edgeWeights[key] = (edgeWeights[key] || 0) + 1;
    }
  });

  Object.entries(edgeWeights).forEach(([key, weight]) => {
    const [source, target] = key.split('-').reduce((acc, part, i, arr) => {
      // Reconstruct the two IDs from the key
      if (acc.length === 0) return [part];
      const combined = acc[acc.length - 1] + '-' + part;
      if (nodes.find(n => n.id === combined)) {
        acc[acc.length - 1] = combined;
      } else {
        acc.push(part);
      }
      return acc;
    }, []);

    if (source && target) {
      edges.push({ source, target, weight });
    }
  });

  // Simpler edge parsing
  const simpleEdges = [];
  proposals.forEach(p => {
    const socId = `soc-${p.clubName || p.clubId}`;
    const venId = `ven-${p.venueId}`;
    if (p.clubName && p.venueId) {
      simpleEdges.push({ source: socId, target: venId, weight: 1 });
    }
    if (p.clubName && p.eventType) {
      simpleEdges.push({ source: socId, target: `type-${p.eventType}`, weight: 1 });
    }
  });

  return { nodes, edges: simpleEdges };
}

/**
 * Calculate resource utilization metrics
 */
export function getResourceMetrics(proposals, venues, bookings) {
  const totalVenues = venues?.length || 1;
  const totalProposals = proposals?.length || 0;
  const approvedCount = proposals?.filter(p => ['approved', 'venue_booked'].includes(p.status))?.length || 0;
  const rejectedCount = proposals?.filter(p => p.status === 'rejected')?.length || 0;

  // Venue utilization
  const venueBookings = {};
  (bookings || []).forEach(b => {
    venueBookings[b.venueId] = (venueBookings[b.venueId] || 0) + 1;
  });
  const avgVenueUtil = totalVenues > 0 ? Math.round((Object.keys(venueBookings).length / totalVenues) * 100) : 0;

  return {
    totalProposals,
    approvalRate: totalProposals > 0 ? Math.round((approvedCount / totalProposals) * 100) : 0,
    rejectionRate: totalProposals > 0 ? Math.round((rejectedCount / totalProposals) * 100) : 0,
    venueUtilization: Math.min(100, avgVenueUtil),
    avgProcessingDays: 3.2, // Simulated
    peakDay: 'Wednesday',
    peakTime: '4:00 PM – 6:00 PM',
    // From simulated data
    avgAttendanceRate: Math.round(SIMULATED_EVENTS.reduce((acc, e) => acc + (e.actualAttendees / e.expectedAttendees), 0) / SIMULATED_EVENTS.length * 100),
    avgRating: Math.round(SIMULATED_EVENTS.reduce((acc, e) => acc + e.rating, 0) / SIMULATED_EVENTS.length * 10) / 10,
  };
}
