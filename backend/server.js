require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getRecommendations } = require('./utils/recommendationEngine');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

// Load .env.local manually so our backend has exactly what Vite has
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

// Supabase client initialization
// For server-side operations, we MUST use the Service Role Key if available to bypass RLS when needed
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL or AUTH credentials missing from .env/.env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataFile = path.join(__dirname, 'data.json');
const studentsFile = path.join(__dirname, 'data', 'students.json');
const eventsFile = path.join(__dirname, 'data', 'events.json');
const attendanceFile = path.join(__dirname, 'data', 'attendance_history.json');

// Import WhatsApp service
let whatsappService;
try {
    whatsappService = require('./whatsapp/whatsappService');
    console.log('✅ WhatsApp service loaded');
} catch (e) {
    console.error('⚠️ WhatsApp service failed to load:', e.message);
}

const STATUS_LABELS = {
    submitted: 'Submitted',
    faculty_review: 'Faculty Review',
    hod_review: 'HoD Review',
    admin_review: 'Admin Review',
    approved: 'Approved',
    rejected: 'Rejected',
    revision_requested: 'Revision Requested',
    venue_booked: 'Venue Booked',
};

/**
 * Map frontend camelCase fields to Supabase snake_case columns.
 * This is the SINGLE source of truth for field name translation.
 */
const mapToDbSchema = (proposal) => {
    /**
     * The Supabase `proposals` table uses a MIX of naming conventions:
     *   snake_case: venue_id, submitted_by, club_id, created_at, updated_at
     *   camelCase:  auditTrail, rejectionReason, collegeId, currentReviewer,
     *               submittedByName, clubId, clubName, eventType, expectedAttendees,
     *               timeSlot, startTime, endTime
     *
     * This mapper accepts EITHER convention from the frontend and outputs
     * the column name that Supabase actually has.
     */
    const mapped = {};

    // Direct copy fields (same name in DB)
    const directFields = [
        'title', 'description', 'date', 'status', 'resources',
        'documents', 'feedback', 'bundle',
    ];
    directFields.forEach(f => {
        if (proposal[f] !== undefined) mapped[f] = proposal[f];
    });

    // ─── snake_case columns in DB ───
    mapped.venue_id     = proposal.venue_id     || proposal.venueId     || null;
    mapped.submitted_by = proposal.submitted_by || proposal.submittedBy || null;
    mapped.club_id      = proposal.club_id      || proposal.clubId     || null;
    mapped.created_at   = proposal.created_at   || proposal.createdAt  || new Date().toISOString();
    mapped.updated_at   = proposal.updated_at   || proposal.updatedAt  || new Date().toISOString();

    // ─── camelCase columns in DB ───
    mapped.auditTrail       = proposal.auditTrail       || proposal.audit_trail       || [];
    mapped.rejectionReason  = proposal.rejectionReason  || proposal.rejection_reason  || null;
    mapped.collegeId        = proposal.collegeId        || proposal.college_id        || null;
    mapped.currentReviewer  = proposal.currentReviewer  || proposal.current_reviewer  || null;
    mapped.submittedByName  = proposal.submittedByName  || proposal.submitted_by_name || null;
    mapped.clubName         = proposal.clubName         || proposal.club_name         || null;
    mapped.eventType        = proposal.eventType        || proposal.event_type        || null;
    mapped.expectedAttendees = proposal.expectedAttendees ?? proposal.expected_attendees ?? 0;
    mapped.timeSlot         = proposal.timeSlot         || proposal.time_slot         || null;
    mapped.startTime        = proposal.startTime        || proposal.start_time        || null;
    mapped.endTime          = proposal.endTime          || proposal.end_time          || null;

    // If an explicit id was passed and looks like a UUID, include it
    if (proposal.id && /^[0-9a-f]{8}-/i.test(proposal.id)) {
        mapped.id = proposal.id;
    }

    // Strip null/undefined values to let Supabase defaults kick in
    Object.keys(mapped).forEach(k => {
        if (mapped[k] === undefined) delete mapped[k];
    });

    return mapped;
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
app.get('/api/proposals', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) return res.status(500).json({ error: error.message });
        res.json(data || []);
    } catch (e) {
        console.error('GET /api/proposals error:', e);
        res.status(500).json({ error: e.message });
    }
});
// ... (rest of the file remains same, I'll use multi_replace if needed but for now I'll replace the top part)

app.post('/api/proposals', async (req, res) => {
    try {
        const mappedData = mapToDbSchema(req.body);
        // Don't send 'id' on insert — let Supabase generate UUID
        delete mappedData.id;

        console.log('📨 Inserting proposal:', JSON.stringify(mappedData, null, 2));

        const { data, error } = await supabase
            .from('proposals')
            .insert(mappedData)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Proposal insert error:', error);
            return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
        }

        console.log(`✅ Proposal saved: ${data.id} — "${data.title}"`);

        // --- NOTIFICATIONS ---
        if (whatsappService) {
            try {
                // Notify faculty/admin about new submission
                await whatsappService.notifyByEvent('newProposalAssigned', { proposalId: data.id });
            } catch (e) {
                console.error('⚠️ WhatsApp notification failed (non-fatal):', e.message);
            }
        }

        res.json(data);
    } catch (e) {
        console.error('POST /api/proposals error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/proposals/:id', async (req, res) => {
    try {
        // Fetch old status for comparison
        const { data: oldProposal } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!oldProposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const updateData = mapToDbSchema(req.body);
        updateData.updated_at = new Date().toISOString();
        delete updateData.id; // Never update the PK
        delete updateData.created_at; // Don't change creation time

        console.log(`📝 Updating proposal ${req.params.id}:`, JSON.stringify(updateData, null, 2));

        const { data, error } = await supabase
            .from('proposals')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            console.error('❌ Proposal update error:', error);
            return res.status(500).json({ error: error.message, details: error.details });
        }

        console.log(`📝 Proposal updated: ${data.id} [${oldProposal.status} → ${data.status}]`);

        // --- TRIGGER WHATSAPP NOTIFICATIONS ---
        if (whatsappService && oldProposal.status !== data.status) {
            try {
                const { status, id } = data;
                
                switch (status) {
                    case 'approved':
                    case 'venue_booked':
                        // Notify society their event was approved
                        await whatsappService.notifyByEvent('proposalApproved', { proposalId: id });
                        // Notify students about the new event
                        await whatsappService.notifyByEvent('eventRecommendation', { proposalId: id });
                        break;

                    case 'rejected':
                        await whatsappService.notifyByEvent('proposalRejected', { proposalId: id });
                        break;

                    case 'revision_requested':
                        await whatsappService.notifyByEvent('proposalStatusUpdate', { 
                            proposalId: id, 
                            statusLabel: STATUS_LABELS[status] 
                        });
                        break;

                    case 'faculty_review':
                        // Society resubmitted → notify faculty
                        if (oldProposal.status === 'revision_requested') {
                            await whatsappService.notifyByEvent('proposalUpdated', { proposalId: id });
                        }
                        // Also notify admin/faculty about new submission entering review
                        await whatsappService.notifyByEvent('newProposalAssigned', { proposalId: id });
                        break;

                    case 'hod_review':
                    case 'admin_review':
                        // Notify society about status progress
                        await whatsappService.notifyByEvent('proposalStatusUpdate', { 
                            proposalId: id, 
                            statusLabel: STATUS_LABELS[status] 
                        });
                        // Notify the next reviewer
                        await whatsappService.notifyByEvent('newProposalAssigned', { proposalId: id });
                        break;
                }
            } catch (e) {
                console.error('⚠️ WhatsApp notification failed (non-fatal):', e.message);
            }
        }

        res.json(data);
    } catch (e) {
        console.error('PUT /api/proposals/:id error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- VENUE SLOT REVOKE ---
app.post('/api/proposals/:id/revoke', async (req, res) => {
    try {
        const { data: proposal, error: fetchError } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !proposal) return res.status(404).json({ error: 'Proposal not found' });

        const { data, error } = await supabase
            .from('proposals')
            .update({
                status: 'faculty_review',
                current_reviewer: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });

        if (whatsappService) {
            try {
                await whatsappService.notifyByEvent('proposalRevokedForPriority', { proposalId: data.id });
            } catch (e) {
                console.error('⚠️ Revoke notification failed:', e.message);
            }
        }

        res.json(data);
    } catch (e) {
        console.error('POST /api/proposals/:id/revoke error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        whatsapp: !!whatsappService,
        supabase: !!supabase,
        timestamp: new Date().toISOString()
    });
});

// --- WHATSAPP ROUTES ---
const whatsappRoutes = require('./whatsapp/notificationRoutes');
app.use('/api/whatsapp', whatsappRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
    console.log(`📱 WhatsApp API: http://localhost:${PORT}/api/whatsapp`);
    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);

    // Start cron jobs
    if (whatsappService && whatsappService.startCronJobs) {
        whatsappService.startCronJobs();
    }
});
