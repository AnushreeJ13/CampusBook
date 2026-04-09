// recommendationEngine.js
// Core logic: content-based filtering + collaborative boost

// ─── 1. Build shared vocabulary ────────────────────────────────────────────
function buildVocab(students, events) {
    const vocab = new Set();
    students.forEach((s) => {
        if (s.skills) s.skills.forEach((k) => vocab.add(k));
        if (s.interests) s.interests.forEach((k) => vocab.add(k));
    });
    events.forEach((e) => {
        if (e.tags) e.tags.forEach((k) => vocab.add(k));
    });
    return Array.from(vocab).sort();
}

// ─── 2. Vectorise a profile into binary array over vocab ───────────────────
function vectorise(terms, vocab) {
    return vocab.map((word) => (terms.includes(word) ? 1 : 0));
}

// ─── 3. Cosine similarity between two vectors ──────────────────────────────
function cosineSimilarity(vecA, vecB) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

// ─── 4. Content-based scores: student vs every event ──────────────────────
function contentBasedScores(student, events, vocab) {
    const studentTerms = [...(student.skills || []), ...(student.interests || [])];
    const studentVec = vectorise(studentTerms, vocab);

    return events.map((event) => {
        const eventVec = vectorise(event.tags || [], vocab);
        const score = cosineSimilarity(studentVec, eventVec);

        // Skill match breakdown for UI display
        const matchedSkills = (event.tags || []).filter((t) =>
            (student.skills || []).includes(t)
        );
        const matchedInterests = (event.tags || []).filter((t) =>
            (student.interests || []).includes(t)
        );

        return {
            eventId: event.id,
            contentScore: score,
            matchedSkills,
            matchedInterests,
        };
    });
}

// ─── 5. Collaborative filter boost ────────────────────────────────────────
function collaborativeBoost(student, allStudents, attendanceHistory, events, vocab) {
    const studentTerms = [...(student.skills || []), ...(student.interests || [])];
    const studentVec = vectorise(studentTerms, vocab);

    // Find top-3 similar students (excluding self)
    const similarities = allStudents
        .filter((s) => s.id !== student.id)
        .map((s) => {
            const sTerms = [...(s.skills || []), ...(s.interests || [])];
            const sVec = vectorise(sTerms, vocab);
            return { student: s, sim: cosineSimilarity(studentVec, sVec) };
        })
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 3);

    // Collect weighted event scores from similar students
    const boostMap = {};
    similarities.forEach(({ student: peer, sim }) => {
        const peerHistory = attendanceHistory[peer.id] || {};
        Object.entries(peerHistory).forEach(([eventId, rating]) => {
            // Skip events the student already attended
            if ((student.past_events || []).includes(eventId)) return;
            boostMap[eventId] = (boostMap[eventId] || 0) + (sim * rating) / 5;
        });
    });

    // Normalise boost scores to 0–0.3 range (keeps content score dominant)
    const maxBoost = Math.max(...Object.values(boostMap), 0.001);
    const normalised = {};
    Object.entries(boostMap).forEach(([id, val]) => {
        normalised[id] = (val / maxBoost) * 0.3;
    });

    return normalised;
}

// ─── 6. Main: get top-N recommendations ───────────────────────────────────
function getRecommendations(studentId, { students, events, attendanceHistory }, topN = 3) {
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    // Filter out already-attended events
    const unseenEvents = events.filter(
        (e) => !(student.past_events || []).includes(e.id)
    );

    const vocab = buildVocab(students, events);
    const contentScores = contentBasedScores(student, unseenEvents, vocab);
    const colabBoosts = collaborativeBoost(
        student, students, attendanceHistory, events, vocab
    );

    // Combine scores
    const combined = contentScores.map((cs) => ({
        ...cs,
        collabBoost: colabBoosts[cs.eventId] || 0,
        finalScore: cs.contentScore + (colabBoosts[cs.eventId] || 0),
    }));

    // Sort and take top-N
    const topEvents = combined
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, topN)
        .map((result) => {
            const event = events.find((e) => e.id === result.eventId);
            return {
                event,
                scores: {
                    content: Math.round(result.contentScore * 100),
                    collab: Math.round(result.collabBoost * 100),
                    final: Math.min(Math.round(result.finalScore * 100), 99), // cap at 99%
                },
                matchedSkills: result.matchedSkills,
                matchedInterests: result.matchedInterests,
            };
        });

    return { student, recommendations: topEvents };
}

module.exports = {
    getRecommendations
};