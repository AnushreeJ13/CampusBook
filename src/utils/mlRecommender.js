/**
 * CAMPUSBOOK CUSTOM ML ENGINE (Zero-Dependency)
 * A lightweight 3-layer Artificial Neural Network (ANN) implementation.
 * Used for predicting event match percentages based on user history.
 */

// Simple Sigmoid Activation
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

class SimpleNeuralNetwork {
  constructor(inputNodes, hiddenNodes, outputNodes) {
    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;

    // Initialize weights with small random values
    this.weightsIH = Array.from({ length: hiddenNodes }, () => 
      Array.from({ length: inputNodes }, () => Math.random() * 2 - 1)
    );
    this.weightsHO = Array.from({ length: outputNodes }, () => 
      Array.from({ length: hiddenNodes }, () => Math.random() * 2 - 1)
    );

    this.learningRate = 0.5;
  }

  // Feed-forward prediction
  predict(inputArray) {
    // Hidden Layer
    const hidden = this.weightsIH.map(row => 
      sigmoid(row.reduce((acc, val, i) => acc + val * inputArray[i], 0))
    );
    // Output Layer
    const output = this.weightsHO.map(row => 
      sigmoid(row.reduce((acc, val, i) => acc + val * hidden[i], 0))
    );
    return output;
  }

  // Very basic stochastic gradient descent for training
  train(inputArray, targetArray) {
    // 1. Feed-forward (to get current errors)
    const hidden = this.weightsIH.map(row => 
      sigmoid(row.reduce((acc, val, i) => acc + val * inputArray[i], 0))
    );
    const output = this.weightsHO.map(row => 
      sigmoid(row.reduce((acc, val, i) => acc + val * hidden[i], 0))
    );

    // 2. Calculate errors & update weights (simplified backprop)
    // Update Hidden -> Output
    for (let i = 0; i < this.outputNodes; i++) {
        const error = targetArray[i] - output[i];
        const gradient = output[i] * (1 - output[i]) * error * this.learningRate;
        for (let j = 0; j < this.hiddenNodes; j++) {
            this.weightsHO[i][j] += gradient * hidden[j];
        }
    }

    // Update Input -> Hidden
    for (let i = 0; i < this.hiddenNodes; i++) {
        let error = 0;
        for (let j = 0; j < this.outputNodes; j++) {
            error += this.weightsHO[j][i] * (targetArray[j] - output[j]);
        }
        const gradient = hidden[i] * (1 - hidden[i]) * error * this.learningRate;
        for (let j = 0; j < this.inputNodes; j++) {
            this.weightsIH[i][j] += gradient * inputArray[j];
        }
    }
  }
}

// --- Integration Logic ---

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
    const s = slot.toLowerCase();
    if (s.includes('morning')) return [1,0,0];
    if (s.includes('afternoon')) return [0,1,0];
    if (s.includes('evening')) return [0,0,1];
    return [0,0,0];
};

const formatFeatureVector = (event) => {
    return [...encodeEventType(event.eventType || ''), ...encodeTimeSlot(event.timeSlot || '')];
};

export const getAIRecommendations = (allEvents, userPastBookings) => {
    const upcomingEvents = allEvents.filter(e => ['VENUE_BOOKED', 'approved'].includes(e.status));

    if (!userPastBookings || userPastBookings.length === 0) {
        return upcomingEvents.map(e => ({ ...e, matchPercentage: 50 }));
    }

    try {
        // Feature vector size = 6 (types) + 3 (slots) = 9
        const net = new SimpleNeuralNetwork(9, 6, 1);

        // Map bookings for training
        const bookedIds = new Set(userPastBookings.map(b => b.proposalId));
        
        // Pseudo-Stochastic Training
        for (let i = 0; i < 50; i++) { // iterations
            allEvents.forEach(event => {
                const input = formatFeatureVector(event);
                const target = [bookedIds.has(event.id) ? 1 : 0];
                net.train(input, target);
            });
        }

        // Infer scores
        const scored = upcomingEvents.map(event => {
            const result = net.predict(formatFeatureVector(event));
            const score = result[0] || 0.1;
            return {
                ...event,
                aiScore: score,
                matchPercentage: Math.max(15, Math.min(99, Math.round(score * 100)))
            };
        });

        return scored.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    } catch (err) {
        console.error("AI Engine error:", err);
        return upcomingEvents.map(e => ({ ...e, matchPercentage: 50 }));
    }
};
