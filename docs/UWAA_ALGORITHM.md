# UniFlow Weighted Affinity Algorithm (UWAA)

## Overview
The **UWAA** is the core intelligence engine powering the UniFlow forensic recommendations. It dynamically computes a "Signal Affinity" score between students and campus events based on real-time telemetry synced from the user's behavioral profile.

## The Formula
The Signal Affinity Score ($S$) is calculated as follows:

$$S = (W_{cat} \cdot C_{fit}) + (W_{soc} \cdot S_{aff}) + (W_{eng} \cdot E_{flux}) + (W_{prox} \cdot T_{urg})$$

### 1. Variables & Weights

| Component | Variable | Weight ($W$) | Description |
| :--- | :---: | :---: | :--- |
| **Category Fit** | $C_{fit}$ | 0.40 | Alignment with historical attendance categories (Tech, Culture, etc.) |
| **Society Affinity** | $S_{aff}$ | 0.30 | Direct relational proximity based on past society interactions |
| **Engagement Flux** | $E_{flux}$ | 0.20 | Global popularity signal (expected vs actual attendance density) |
| **Temporal Urgency** | $T_{urg}$ | 0.10 | Time-decay factor; bonus for imminent events (within 48h) |

---

## Technical Details

### A. Category Fit ($C_{fit}$)
Calculates the normalized frequency of a specific category in the student's attendance history.
$$C_{fit} = \frac{\text{Count of specific category attended}}{\text{Total events attended}}$$
*Implementation Location:* `src/utils/recommendationEngine.js`

### B. Society Affinity ($S_{aff}$)
A boolean boost (1.0 or 0.0) applied if the user has previously interacted with the hosting society's events or clicked on their profile.

### C. Engagement Flux ($E_{flux}$)
A normalized popularity metric.
$$E_{flux} = \min\left(\frac{\text{Expected Attendance}}{500}, 1.0\right)$$

### D. Temporal Urgency ($T_{urg}$)
- **< 48 hours:** 1.0 (Critical)
- **< 7 days:** 0.5 (High)
- **> 7 days:** 0.1 (Stable)

---

## Use Cases
1. **Student Dashboard:** Ranks the "Live Event Feed" to ensure high-affinity signals are processed first.
2. **Intelligence Ticker:** Displays "High Affinity" alerts for events that crossing a 0.75 threshold.
3. **Forensic Interest Map:** Visualizes the student's telemetry in a Neural Radar chart.

## Compliance
The UWAA is 100% deterministic and runs locally on the unit's client after fetching encrypted telemetry profiles from the Supabase core.
