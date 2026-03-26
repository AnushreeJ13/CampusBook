const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const dataFile = path.join(__dirname, 'data.json');

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

// --- PROPOSALS ---
app.get('/api/proposals', (req, res) => {
    const data = readData();
    res.json(data.proposals || []);
});

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
