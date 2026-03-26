import * as brain from 'brain.js';

// We use Brain.js to train a Neural Network directly in the browser!
// This predicts the likelihood of a student attending an event based on EventType and TimeSlot.

const encodeEventType = (type) => {
    const map = {
        'hackathon': [1,0,0,0,0,0],
        'talk':      [0,1,0,0,0,0],
        'cultural':  [0,0,1,0,0,0],
        'fest':      [0,0,0,1,0,0],
        'workshop':  [0,0,0,0,1,0],
        'sports':    [0,0,0,0,0,1]
    };
    return map[type] || [0,0,0,0,0,0];
};

const encodeTimeSlot = (slot) => {
    if (!slot) return [0,0,0];
    if (slot.includes('morning')) return [1,0,0];
    if (slot.includes('afternoon')) return [0,1,0];
    if (slot.includes('evening')) return [0,0,1];
    return [0,0,0];
};

const formatFeatureVector = (event) => {
    return [...encodeEventType(event.eventType), ...encodeTimeSlot(event.timeSlot)];
};

export const trainAndRecommend = (allEvents, userPastBookings) => {
    const upcomingEvents = allEvents.filter(e => e.status === 'VENUE_BOOKED' || e.status === 'approved');

    if (!userPastBookings || userPastBookings.length === 0) {
        // Fallback if no history to learn from
        return upcomingEvents.map(e => ({ ...e, aiScore: 0.5, matchPercentage: 50 }));
    }

    const trainingData = [];
    const bookedIds = new Set(userPastBookings.map(b => b.proposalId));

    // Prepare Training Dataset
    allEvents.forEach(event => {
        const isBooked = bookedIds.has(event.id) ? 1 : 0;
        trainingData.push({
            input: formatFeatureVector(event),
            output: [isBooked] // 1 if they booked it, 0 if they ignored it
        });
    });

    // Initialize Neural Network
    const net = new brain.NeuralNetwork({ hiddenLayers: [4] });
    
    // Train the Model!
    net.train(trainingData, {
        iterations: 200, 
        errorThresh: 0.01,
        log: false
    });

    // Infer predictions for upcoming events
    const scoredEvents = upcomingEvents.map(event => {
        const result = net.run(formatFeatureVector(event));
        const score = result[0] || 0.1; // fallback
        
        return {
            ...event,
            aiScore: score,
            matchPercentage: Math.max(15, Math.min(99, Math.round(score * 100)))
        };
    });

    return scoredEvents.sort((a, b) => b.aiScore - a.aiScore);
};

export const getAIRecommendations = (allEvents, userBookings) => {
    try {
        return trainAndRecommend(allEvents, userBookings);
    } catch (e) {
        console.error("AI Engine failed", e);
        return allEvents.filter(e => e.status === 'VENUE_BOOKED' || e.status === 'approved').map(e => ({...e, matchPercentage: 50}));
    }
}
