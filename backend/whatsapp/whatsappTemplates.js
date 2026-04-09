/**
 * Message Templates for CampusBook
 * Restored with exact original text as requested.
 */

// --- SOCIETY TEMPLATES ---

const proposalApproved = ({ societyName, eventTitle, eventDate, venueName, portalLink }) =>
`✅ *Proposal Approved!*

Hi *${societyName}*,

Your event *${eventTitle}* has been approved!

📅 Date: ${eventDate}
📍 Venue: ${venueName}

You're all set. View your event details here:
${portalLink}`;

const proposalRejected = ({ societyName, eventTitle, rejectionReason, portalLink }) =>
`❌ *Proposal Not Approved*

Hi *${societyName}*,

Unfortunately, your proposal for *${eventTitle}* was not approved.

📝 Reason: ${rejectionReason}

You can revise and resubmit anytime:
${portalLink}`;

const proposalRevokedForPriority = ({ societyName, eventTitle, portalLink }) =>
`⚠️ *Event Slot Reassigned*

Hi *${societyName}*,

Your approved event *${eventTitle}* has been rescheduled because a higher-priority event was assigned to the same venue and time. 

We're sorry for the inconvenience. Please log in to reschedule:
${portalLink}`;

const eventTomorrowReminder = ({ societyName, eventTitle, eventTime, venueName, portalLink }) =>
`🔔 *Event Tomorrow!*

Hi *${societyName}*,

Just a reminder — your event *${eventTitle}* is tomorrow!

⏰ Time: ${eventTime}
📍 Venue: ${venueName}

View full details and checklist:
${portalLink}`;

// --- FACULTY TEMPLATES ---

const newProposalAssigned = ({ facultyName, societyName, eventTitle, eventDate, eventDescription, reviewLink }) =>
`📋 *New Event Proposal for Your Review*

Hi *${facultyName}*,

*${societyName}* has submitted a new event proposal for your approval.

🎯 *${eventTitle}*
📅 Date: ${eventDate}
📝 ${eventDescription}

Please review and take action here:
${reviewLink}`;

const proposalUpdated = ({ facultyName, eventTitle, updateDescription, reviewLink }) =>
`🔄 *Proposal Updated*

Hi *${facultyName}*,

A proposal assigned to you has been updated.

📌 Event: *${eventTitle}*
✏️ What changed: ${updateDescription}

View the latest version:
${reviewLink}`;

// --- STUDENT TEMPLATES ---

const eventRecommendation = ({ studentName, eventTitle, eventDate, eventCategory, shortDescription, registrationLink }) =>
`🎉 *You might love this!*

Hi *${studentName}*,

Based on events you've attended, we think you'd enjoy:

✨ *${eventTitle}*
🏷️ ${eventCategory}
📅 ${eventDate}

${shortDescription}

Register here (free):
${registrationLink}`;

// --- GLOBAL ---

const eventCatalogue = (events) => {
    if (!events || events.length === 0) {
        return `📚 *CampusBook — Event Catalogue*

No upcoming events at the moment. Check back soon! 🎓`;
    }

    const eventList = events.map((e, i) => {
        return `${i + 1}️⃣ *${e.title}*
   🏷️ ${e.eventType || 'General'} | 🏛️ ${e.clubName || 'Host'}
   📅 ${e.date || 'TBD'} | 📍 ${e.venueName || 'TBD'}`;
    }).join('\n\n');

    return `📚 *CampusBook — Event Catalogue*

Upcoming events:

${eventList}

Type *help* for more options.`;
};

const proposalStatusUpdate = ({ societyName, eventTitle, newStatus, portalLink }) =>
`🔄 *Proposal Status Update*

Hi *${societyName}*,

Your proposal for *${eventTitle}* has a new update.

📌 *Current Status:* ${newStatus}

Check the portal for details or next steps:
${portalLink}`;

const TEMPLATE_REGISTRY = {
    proposalApproved,
    proposalRejected,
    proposalRevokedForPriority,
    eventTomorrowReminder,
    newProposalAssigned,
    proposalUpdated,
    proposalStatusUpdate,
    eventRecommendation,
    eventCatalogue,
};

module.exports = { TEMPLATE_REGISTRY, ...TEMPLATE_REGISTRY };
