"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Send an outbound message from a Visitor to the Google Chat Space via Incoming Webhook.
 * It groups them into the same thread by appending threadKey.
 */
exports.chatWebhook = (0, https_1.onRequest)({ cors: true, secrets: ["GOOGLE_CHAT_WEBHOOK_URL"] }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const payload = req.body;
    // Acknowledge Dialogflow CX pre-flight or missing payload elegantly
    if (!payload || !payload.sessionId || !payload.message || !payload.role) {
        console.warn("Invalid payload received", payload);
        // Return early to avoid dropping legit pings or preflight unhandled
        res.status(400).send('Missing sessionId, message, or role');
        return;
    }
    const { sessionId, message, role } = payload;
    const db = admin.firestore();
    // 1. Save the message to Firestore to maintain conversation state
    const sessionRef = db.collection('sessions').doc(sessionId);
    // Merge mode to keep it if it's "human", default to "bot" if new
    await sessionRef.set({
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const msgRef = sessionRef.collection('messages').doc();
    await msgRef.set({
        text: message,
        role: role, // 'visitor' or 'bot'
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    // 2. Forward "visitor" and "bot" messages to Google Chat via the Incoming Webhook
    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('Webhook URL not configured in secrets!');
        res.status(500).send('Webhook URL not configured');
        return;
    }
    // Append ?threadKey=sessionId to ensure Google Chat groups it into the same thread natively
    // Note: Incoming Webhooks use &threadKey= if ?key= is already in the URL
    const separator = webhookUrl.includes('?') ? '&' : '?';
    const threadedWebhookUrl = `${webhookUrl}${separator}threadKey=${encodeURIComponent(sessionId)}`;
    try {
        const chatResponse = await fetch(threadedWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: role === 'bot'
                    ? `🤖 *Bot:* ${message}`
                    : `👤 *Visitor:* ${message}`
            })
        });
        if (!chatResponse.ok) {
            console.error('Failed to post to Google Chat:', await chatResponse.text());
        }
    }
    catch (error) {
        console.error('Google Chat post error:', error);
    }
    res.status(200).json({ success: true, messageId: msgRef.id });
});
//# sourceMappingURL=chatWebhook.js.map