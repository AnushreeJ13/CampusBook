const express = require('express');
const router = express.Router();
const { notifyByEvent, sendEventCatalogue, sendWhatsAppMessage, getRegistration } = require('./whatsappService');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Send event catalogue to a phone number ───
router.post('/catalogue', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number required' });
        const result = await sendEventCatalogue(phone);
        res.json(result);
    } catch (e) {
        console.error('Catalogue error:', e);
        res.status(500).json({ error: e.message });
    }
});

// ─── Twilio Incoming Webhook ───
router.post('/webhook', async (req, res) => {
    try {
        console.log('--- WHATSAPP WEBHOOK ---');
        
        const incomingMsg = (req.body.Body || '').trim().toLowerCase();
        const from = req.body.From;
        
        if (!from) {
            console.error('❌ No "From" number in webhook body');
            return res.status(400).send('<Response></Response>');
        }
        
        console.log(`📩 "${incomingMsg}" from ${from}`);

        // Catalogue keywords
        const catalogueKeywords = ['events', 'event', 'catalogue', 'catalog', 'upcoming', 'list'];
        if (catalogueKeywords.includes(incomingMsg)) {
            await sendEventCatalogue(from);
            res.set('Content-Type', 'text/xml');
            return res.send('<Response></Response>');
        }

        // Help / greeting keywords
        const helpKeywords = ['help', 'hi', 'hello', 'menu', 'start'];
        if (helpKeywords.includes(incomingMsg)) {
            const helpBody = `👋 *Welcome to CampusBook!*

Here's what you can do:

📚 Type *events* — View upcoming approved events
ℹ️ Type *help* — See this menu

Stay connected! 🎓`;
            await sendWhatsAppMessage(from, helpBody);
            res.set('Content-Type', 'text/xml');
            return res.send('<Response></Response>');
        }

        // Fallback
        const fallback = `🤖 I didn't understand that.

Try:
📚 *events* — See upcoming campus events
ℹ️ *help* — See available commands`;
        await sendWhatsAppMessage(from, fallback);

        res.set('Content-Type', 'text/xml');
        res.send('<Response></Response>');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('<Response></Response>');
    }
});

// ─── User Registration ───
router.post('/users/register', async (req, res) => {
    try {
        const { userId, name, phone, role } = req.body;
        if (!userId || !phone) return res.status(400).json({ error: 'userId and phone are required' });

        // Ensure phone format
        const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`;

        const { data, error } = await supabase.from('whatsapp_registrations').upsert({
            user_id: userId,
            name: name || 'User',
            phone: cleanPhone,
            role: role || 'student',
            enabled: true,
            created_at: new Date().toISOString()
        }, { onConflict: 'user_id' }).select().single();

        if (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`✅ WhatsApp registered: ${name} (${role}) → ${cleanPhone}`);
        res.json({ success: true, data });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(500).json({ error: e.message });
    }
});

// ─── Check registration status ───
router.get('/users/status/:userId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('whatsapp_registrations')
            .select('*')
            .eq('user_id', req.params.userId)
            .single();

        if (error || !data) {
            return res.json({ registered: false });
        }
        res.json({ registered: true, phone: data.phone, enabled: data.enabled });
    } catch (e) {
        res.json({ registered: false });
    }
});

// ─── Disable notifications ───
router.post('/users/disable', async (req, res) => {
    try {
        const { userId } = req.body;
        const { error } = await supabase
            .from('whatsapp_registrations')
            .update({ enabled: false })
            .eq('user_id', userId);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Test notification endpoint (debug) ───
router.post('/test-notify', async (req, res) => {
    try {
        const { eventType, proposalId, phone } = req.body;
        
        if (phone) {
            // Direct message test
            const result = await sendWhatsAppMessage(phone, `🧪 Test message from CampusBook!\nTimestamp: ${new Date().toISOString()}`);
            return res.json(result);
        }

        if (eventType && proposalId) {
            const result = await notifyByEvent(eventType, { proposalId });
            return res.json(result);
        }

        res.status(400).json({ error: 'Provide (eventType + proposalId) or (phone)' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
