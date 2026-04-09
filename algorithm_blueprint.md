# UniFlow Intelligence: Weighted Affinity Algorithm (UWAA)

## Overview
The UniFlow Recommendation Engine uses a **High-Fidelity Weighted Affinity Algorithm** to provide personalized event intelligence to students. Unlike simple keyword matching, UWAA analyzes multiple dimensions of user telemetry to calculate a "Nodal Affinity Score" for every event in the registry.

## Behavioral Telemetry Points
The algorithm consumes four primary telemetry signals:

1.  **Category Proximity (40%)**: Analysis of the user's "Nodal Engagement History" across event categories (e.g., Technical, Cultural, Sports). High frequency in a category increases the weighting for future signals in that sector.
2.  **Relational Affinity (30%)**: Direct interaction history with societies/clubs. Following a society or attending their past events creates a "Trust Link" that boosts their future broadcasts.
3.  **Engagement Flux (20%)**: A global popularity signal. Measures real-time attendee density and projected node occupancy. High-density events are prioritized as "Trending Anomalies."
4.  **Temporal Urgency (10%)**: Analyzes the time window. Events occurring within the next 48 hours receive a "Sync Priority" boost to ensure they appear in the immediate briefing.

## Mathematical Model

The scoring function is defined as:

$$S = \sum (w_i \cdot s_i)$$

Where:
-   $S$ is the final Affinity Score $[0, 1]$
-   $w_i$ is the weight of signal $i$
-   $s_i$ is the normalized signal strength $[0, 1]$

### Signal Normalization
-   **Category Fit**: $C_{count} / C_{total\_engagement}$
-   **Society Affinity**: Binary $[0, 1]$ based on interaction bitmask
-   **Engagement Flux**: $Events_{attendees} / Sector_{capacity}$
-   **Temporal Urgency**: Discrete step function based on $\Delta t$

## UI Integration
The computed **Nodal Affinity Score** is displayed in the following ways:
-   **Dashboard Highlights**: Events with $S > 0.85$ are flagged as "HIGH_AFFINITY_MATCH."
-   **Event Detail**: Detailed telemetry breakdowns showing exactly why an event was recommended.
-   **Discovery Feed**: Automatically sorted by $S$ to ensure high-relevance briefing.

## Future Enhancements: Neural Sync (Phase 2)
In the next iteration, UWAA will integrate with a **Collaborative Filtering Node Layer** to identify community-wide trends ("Cross-Nodal Symmetry") and provide even deeper forensic insights into campus engagement patterns.
