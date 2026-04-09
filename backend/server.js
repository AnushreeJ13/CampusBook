const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getRecommendations } = require('./utils/recommendationEngine');

const app = express();
const PORT = 5001;

// Load .env.local manually for GROQ_API_KEY if process.env doesn't have it
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim();
        }
    });
}

app.use(cors());
app.use(express.json());

const dataFile = path.join(__dirname, 'data.json');
const studentsFile = path.join(__dirname, 'data', 'students.json');
const eventsFile = path.join(__dirname, 'data', 'events.json');
const attendanceFile = path.join(__dirname, 'data', 'attendance_history.json');

const readData = () => {
    try {
        const raw = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return { proposals: [], notifications: [], bookings: [] };
    }
};

const writeData = (data) => {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
};

const readIntelligenceData = () => {
    try {
        return {
            students: JSON.parse(fs.readFileSync(studentsFile, 'utf8')),
            events: JSON.parse(fs.readFileSync(eventsFile, 'utf8')),
            attendanceHistory: JSON.parse(fs.readFileSync(attendanceFile, 'utf8'))
        };
    } catch (e) {
        console.error("Error reading intelligence data:", e);
        return { students: [], events: [], attendanceHistory: {} };
    }
};

// --- INTELLIGENCE & RECOMMENDATIONS ---
app.post('/api/recommend', async (req, res) => {
    try {
        const { studentId } = req.body;
        if (!studentId) return res.status(400).json({ error: "studentId is required" });

        const data = readIntelligenceData();
        const { student, recommendations } = getRecommendations(studentId, data, 3);

        if (!process.env.GROQ_API_KEY) {
            console.warn("GROQ_API_KEY missing - skipping AI explanation");
            return res.json({ student, recommendations });
        }

        const buildPrompt = (student, recommendations) => {
            const eventList = recommendations.map((r, i) =>
                `${i + 1}. "${r.event.title}" (${r.event.domain}) - match score ${r.scores.final}%, matched skills: ${r.matchedSkills.join(", ") || "none"}`
            ).join("\n");

            return `You are an academic advisor for a college student portal.
Student profile:
- Name: ${student.name}
- Skills: ${student.skills.join(", ")}
- Interests: ${student.interests.join(", ")}

Recommended events:
${eventList}

Write a short, friendly, personalised explanation (2-3 sentences per event) of WHY each event suits this student specifically. Format as a JSON array of objects with keys "eventTitle" and "explanation". Return ONLY the JSON.`;
        };

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                messages: [{ role: "user", content: buildPrompt(student, recommendations) }],
            }),
        });

        const groqData = await groqResponse.json();
        let explanations = [];
        try {
            const content = groqData.choices[0].message.content;
            explanations = JSON.parse(content.replace(/```json|```/g, ''));
        } catch (e) {
            explanations = recommendations.map(r => ({ eventTitle: r.event.title, explanation: "Highly recommended for your profile." }));
        }

        const enriched = recommendations.map((rec, i) => ({
            ...rec,
            explanation: explanations.find(e => e.eventTitle === rec.event.title)?.explanation || explanations[i]?.explanation || ""
        }));

        res.json({ student, recommendations: enriched });
    } catch (error) {
        console.error("Recommend error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- PROPOSALS ---
app.get('/api/proposals', (req, res) => {
    const data = readData();
    res.json(data.proposals || []);
});
// ... (rest of the file remains same, I'll use multi_replace if needed but for now I'll replace the top part)

app.post('/api/proposals', (req, res) => {
    const data = readData();
    const newProposal = req.body;
    data.proposals = [newProposal, ...data.proposals];
    writeData(data);
    res.json(newProposal);
});

app.put('/api/proposals/:id', (req, res) => {
    const data = readData();
    const updatedProposal = req.body;
    data.proposals = data.proposals.map(p => p.id === req.params.id ? updatedProposal : p);
    writeData(data);
    res.json(updatedProposal);
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', (req, res) => {
    const data = readData();
    res.json(data.notifications || []);
});

app.post('/api/notifications', (req, res) => {
    const data = readData();
    const newNotif = req.body;
    data.notifications = [newNotif, ...data.notifications];
    writeData(data);
    res.json(newNotif);
});

app.put('/api/notifications/:id', (req, res) => {
    const data = readData();
    data.notifications = data.notifications.map(n => 
        n.id === req.params.id ? { ...n, read: true } : n
    );
    writeData(data);
    res.json({ success: true });
});

// --- BOOKINGS ---
app.get('/api/bookings', (req, res) => {
    const data = readData();
    res.json(data.bookings || []);
});

app.post('/api/bookings', (req, res) => {
    const data = readData();
    const newBooking = req.body;
    data.bookings = [...data.bookings, newBooking];
    writeData(data);
    res.json(newBooking);
});

// --- RESET & SEED ---
app.post('/api/reset', (req, res) => {
    const seedData = req.body;
    writeData(seedData);
    res.json({ success: true, message: 'Data reset successfully' });
});

app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
});
