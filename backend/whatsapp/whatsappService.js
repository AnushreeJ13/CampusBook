const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');
const { TEMPLATE_REGISTRY } = require('./whatsappTemplates');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

let twilioClient = null;

function getClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            console.error('⚠️ Twilio credentials missing — running in DRY RUN mode');
            return null;
        }
        twilioClient = twilio(accountSid, authToken);
        console.log('✅ Twilio client initialized');
    }
    return twilioClient;
}

const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'http://localhost:5173';

const VENUES_FALLBACK = {
    v1: 'Main Auditorium',
    v2: 'Seminar Hall A',
    v3: 'Open Air Theatre',
    v4: 'Conference Room B',
    v5: 'Sports Complex',
    v6: 'Computer Lab 1',
};

const TIME_SLOTS = {
    morning_1: '8:00 AM – 10:00 AM',
    morning_2: '10:00 AM – 12:00 PM',
    afternoon_1: '12:00 PM – 2:00 PM',
    afternoon_2: '2:00 PM – 4:00 PM',
    evening_1: '4:00 PM – 6:00 PM',
    evening_2: '6:00 PM – 8:00 PM',
};

/**
 * Get venue name from ID (DB or fallback)
 */
async function getVenueName(venueId) {
    if (!venueId) return 'TBD';
    // Short-form mock IDs
    if (VENUES_FALLBACK[venueId]) return VENUES_FALLBACK[venueId];
    // UUID-style — lookup from DB
    try {
        const { data } = await supabase.from('venues').select('name').eq('id', venueId).single();
        if (data?.name) return data.name;
    } catch (e) {}
    return 'TBD';
}

/**
 * Get WhatsApp registration for a user.
 * Searches by user_id (Supabase auth UUID or mock ID like "u2").
 */
async function getRegistration(userId) {
    if (!userId) return null;
    try {
        const { data } = await supabase
            .from('whatsapp_registrations')
            .select('*')
            .eq('user_id', userId)
            .eq('enabled', true)
            .single();
        return data;
    } catch (e) {
        return null;
    }
}

/**
 * Get all enabled WhatsApp registrations for a given role
 */
async function getRegistrationsByRole(role) {
    try {
        const { data } = await supabase
            .from('whatsapp_registrations')
            .select('*')
            .eq('role', role)
            .eq('enabled', true);
        return data || [];
    } catch (e) {
        return [];
    }
}

/**
 * Get all approved proposals from Supabase
 */
async function getApprovedProposals() {
    const { data } = await supabase
        .from('proposals')
        .select('*')
        .in('status', ['approved', 'venue_booked'])
        .order('date', { ascending: true });
    return data || [];
}

/**
 * Send a WhatsApp message via Twilio
 */
async function sendWhatsAppMessage(to, body) {
    const client = getClient();
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    if (!client) {
        console.log(`📱 [DRY RUN] → ${toFormatted}\n${body.substring(0, 100)}...`);
        return { success: true, dryRun: true };
    }

    try {
        const message = await client.messages.create({ from, to: toFormatted, body });
        console.log(`✅ Message sent to ${toFormatted}: ${message.sid}`);
        
        // Log to Supabase
        try {
            await supabase.from('whatsapp_logs').insert({
                to: toFormatted,
                body_preview: body.substring(0, 150),
                status: 'sent',
                sid: message.sid,
                sent_at: new Date().toISOString()
            });
        } catch (logErr) {
            console.warn('⚠️ Failed to log message to DB (non-fatal):', logErr.message);
        }

        return { success: true, sid: message.sid };
    } catch (e) {
        console.error(`❌ Send failed to ${toFormatted}: ${e.message}`);
        return { success: false, error: e.message };
    }
}

/**
 * MAIN NOTIFICATION DISPATCHER
 * Called from server.js on proposal status changes.
 */
async function notifyByEvent(eventType, payload) {
    console.log(`🔔 notifyByEvent: ${eventType}`, JSON.stringify(payload));
    const { proposalId } = payload;
    
    // Fetch full proposal
    let proposal;
    try {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', proposalId)
            .single();
        if (error || !data) {
            console.error(`❌ notifyByEvent: Proposal ${proposalId} not found`, error?.message);
            return { error: 'Proposal not found' };
        }
        proposal = data;
    } catch (e) {
        console.error('❌ notifyByEvent: DB error', e.message);
        return { error: e.message };
    }

    const portalLink = `${PORTAL_BASE_URL}/proposals/${proposalId}`;
    const results = [];

    switch (eventType) {
        // ─── SOCIETY NOTIFICATIONS ─────────────────────────────
        case 'proposalApproved': {
            const reg = await getRegistration(proposal.submitted_by);
            if (!reg) { console.log('⚠️ No WhatsApp registration for submitter'); break; }
            const venueName = await getVenueName(proposal.venue_id);
            const body = TEMPLATE_REGISTRY.proposalApproved({
                societyName: proposal.clubName || 'Society',
                eventTitle: proposal.title,
                eventDate: proposal.date || 'TBD',
                venueName,
                portalLink
            });
            results.push(await sendWhatsAppMessage(reg.phone, body));
            break;
        }

        case 'proposalRejected': {
            const reg = await getRegistration(proposal.submitted_by);
            if (!reg) { console.log('⚠️ No WhatsApp registration for submitter'); break; }
            const body = TEMPLATE_REGISTRY.proposalRejected({
                societyName: proposal.clubName || 'Society',
                eventTitle: proposal.title,
                rejectionReason: proposal.rejectionReason || 'No specific reason provided.',
                portalLink
            });
            results.push(await sendWhatsAppMessage(reg.phone, body));
            break;
        }

        case 'proposalRevokedForPriority': {
            const reg = await getRegistration(proposal.submitted_by);
            if (!reg) break;
            const body = TEMPLATE_REGISTRY.proposalRevokedForPriority({
                societyName: proposal.clubName || 'Society',
                eventTitle: proposal.title,
                portalLink
            });
            results.push(await sendWhatsAppMessage(reg.phone, body));
            break;
        }

        case 'proposalStatusUpdate': {
            // Notify the society submitter about status changes 
            const reg = await getRegistration(proposal.submitted_by);
            if (!reg) break;
            const body = TEMPLATE_REGISTRY.proposalStatusUpdate({
                societyName: proposal.clubName || 'Society',
                eventTitle: proposal.title,
                newStatus: payload.statusLabel || proposal.status,
                portalLink
            });
            results.push(await sendWhatsAppMessage(reg.phone, body));
            break;
        }

        // ─── FACULTY NOTIFICATIONS ─────────────────────────────
        case 'newProposalAssigned': {
            // Notify all faculty + admin with WhatsApp registered
            const faculty = await getRegistrationsByRole('faculty');
            const admins = await getRegistrationsByRole('admin');
            const reviewers = [...faculty, ...admins];
            
            if (reviewers.length === 0) {
                console.log('⚠️ No WhatsApp-registered reviewers found');
                break;
            }

            for (const reviewer of reviewers) {
                const body = TEMPLATE_REGISTRY.newProposalAssigned({
                    facultyName: reviewer.name || 'Reviewer',
                    societyName: proposal.clubName || 'Society',
                    eventTitle: proposal.title,
                    eventDate: proposal.date || 'TBD',
                    eventDescription: (proposal.description || 'New proposal for your review.').substring(0, 120),
                    reviewLink: portalLink
                });
                results.push(await sendWhatsAppMessage(reviewer.phone, body));
            }
            break;
        }

        case 'proposalUpdated': {
            // Society resubmitted after revision — notify the assigned faculty
            if (proposal.currentReviewer) {
                const reg = await getRegistration(proposal.currentReviewer);
                if (reg) {
                    const body = TEMPLATE_REGISTRY.proposalUpdated({
                        facultyName: reg.name || 'Faculty',
                        eventTitle: proposal.title,
                        updateDescription: 'The proposal has been revised and resubmitted.',
                        reviewLink: portalLink
                    });
                    results.push(await sendWhatsAppMessage(reg.phone, body));
                }
            }
            break;
        }

        // ─── STUDENT NOTIFICATIONS ─────────────────────────────
        case 'eventRecommendation': {
            const students = await getRegistrationsByRole('student');
            if (students.length === 0) {
                console.log('⚠️ No WhatsApp-registered students for recommendations');
                break;
            }
            for (const student of students) {
                const body = TEMPLATE_REGISTRY.eventRecommendation({
                    studentName: student.name || 'Student',
                    eventTitle: proposal.title,
                    eventDate: proposal.date || 'TBD',
                    eventCategory: proposal.eventType || 'Campus Life',
                    shortDescription: (proposal.description || 'Join us for this amazing event!').substring(0, 100),
                    registrationLink: `${PORTAL_BASE_URL}/events/${proposalId}`
                });
                results.push(await sendWhatsAppMessage(student.phone, body));
            }
            break;
        }

        // ─── EVENT TOMORROW REMINDER ─────────────────────────────
        case 'eventTomorrowReminder': {
            const reg = await getRegistration(proposal.submitted_by);
            if (!reg) break;
            const venueName = await getVenueName(proposal.venue_id);
            const body = TEMPLATE_REGISTRY.eventTomorrowReminder({
                societyName: proposal.clubName || 'Society',
                eventTitle: proposal.title,
                eventTime: TIME_SLOTS[proposal.timeSlot] || proposal.startTime || 'Check portal',
                venueName,
                portalLink
            });
            results.push(await sendWhatsAppMessage(reg.phone, body));
            break;
        }

        default:
            console.warn(`⚠️ Unknown event type: ${eventType}`);
    }

    return { sent: results.length, results };
}

/**
 * Send event catalogue to a phone number
 */
async function sendEventCatalogue(phone) {
    const approved = await getApprovedProposals();
    
    // Enrich with venue names  
    const events = [];
    for (const p of approved) {
        const venueName = await getVenueName(p.venue_id || p.venueId);
        events.push({ ...p, venueName, clubName: p.clubName });
    }

    const body = TEMPLATE_REGISTRY.eventCatalogue(events);
    return await sendWhatsAppMessage(phone, body);
}

/**
 * Start cron jobs (event tomorrow reminders)
 */
function startCronJobs() {
    let cron;
    try {
        cron = require('node-cron');
    } catch (e) {
        console.warn('⚠️ node-cron not installed — skipping reminder cron. Run: npm install node-cron');
        return;
    }

    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running event tomorrow reminder cron...');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const { data: events } = await supabase
            .from('proposals')
            .select('*')
            .in('status', ['approved', 'venue_booked'])
            .eq('date', tomorrowStr);

        if (!events || events.length === 0) {
            console.log('📅 No events tomorrow');
            return;
        }

        for (const event of events) {
            try {
                await notifyByEvent('eventTomorrowReminder', { proposalId: event.id });
            } catch (e) {
                console.error(`❌ Reminder failed for ${event.id}:`, e.message);
            }
        }

        console.log(`📅 Sent ${events.length} event reminders`);
    });

    console.log('⏰ Cron: Event tomorrow reminder scheduled (daily 9:00 AM)');
}

module.exports = {
    notifyByEvent,
    sendEventCatalogue,
    sendWhatsAppMessage,
    getRegistration,
    startCronJobs,
};
