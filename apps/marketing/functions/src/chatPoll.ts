import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

/**
 * Frontend polling endpoint.
 * Allows the website visitor to securely fetch Anthony's replies without 
 * bundling massive Firebase Web SDKs or opening Firestore permissions to the public.
 */
export const chatPoll = onRequest({ cors: true }, async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const since = req.query.since as string;
  
  if (!sessionId) {
    res.status(400).send('Missing sessionId');
    return;
  }

  const db = admin.firestore();
  
  try {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    // Default to bot mode if the document doesn't exist yet
    const mode = sessionDoc.exists ? (sessionDoc.data()?.mode || 'bot') : 'bot';

    // Retrieve operator messages
    let messagesQuery = sessionRef.collection('messages')
                  .where('role', '==', 'operator')
                  .orderBy('timestamp', 'asc');

    // Only get messages after the provided timestamp
    if (since) {
      messagesQuery = messagesQuery.startAfter(admin.firestore.Timestamp.fromMillis(parseInt(since)));
    }

    const snapshot = await messagesQuery.get();
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        timestamp: data.timestamp?.toMillis() || Date.now()
      };
    });

    res.status(200).json({ mode, messages });
  } catch (error) {
    console.error('Chat poll error:', error);
    res.status(500).json({ mode: 'bot', messages: [] });
  }
});
