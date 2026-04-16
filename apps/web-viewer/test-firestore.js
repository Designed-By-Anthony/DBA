const admin = require('firebase-admin');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();
db.collection('clients').get()
  .then(snapshot => {
    console.log("Success! Docs count:", snapshot.docs.length);
    process.exit(0);
  })
  .catch(err => {
    console.error("FIRESTORE ERROR:");
    console.error(err);
    process.exit(1);
  });
