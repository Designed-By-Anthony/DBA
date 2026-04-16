import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Listens for replies from an operator (Anthony) inside the Google Chat App space.
 * When they type on a thread mapped to a sessionId, this function bridges it to Firestore.
 */
export const chatAppListener = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const payload = req.body;
  if (!payload || payload.type !== 'MESSAGE') {
    // Acknowledge non-message events (like being added to space) cleanly
    res.status(200).json({});
    return;
  }

  const chatMessage = payload.message;
  // Note: threadKey is only present if the thread was originally created with a threadKey
  const threadKey = chatMessage.thread?.threadKey;
  
  if (!threadKey) {
    console.warn('Received a Google Chat message without a threadKey. Cannot route back to visitor.');
    res.status(200).json({ text: 'Warning: Cannot route this message to the visitor because it is missing the session threadKey. Please reply only to active threads that started from the website.' });
    return;
  }

  const db = admin.firestore();
  
  try {
    // 1. Flip session mode to human takeover
    const sessionRef = db.collection('sessions').doc(threadKey);
    await sessionRef.set({
      mode: 'human',
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Save Anthony's reply into Firestore
    await sessionRef.collection('messages').add({
      text: chatMessage.text,
      role: 'operator',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Acknowledge the message to Google Chat
    res.status(200).json({});
  } catch (error) {
    console.error('Error handling chat app listener event:', error);
    res.status(200).json({ text: 'Error bridging message to website.' });
  }
});
