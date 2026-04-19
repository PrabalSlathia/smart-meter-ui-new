import admin from 'firebase-admin';
import serviceAccount from '../smart-meter-project-497ac-firebase-adminsdk-fbsvc-98a2a903d2.json' with { type: 'json' };

if (!admin.apps.length) {
  const hasEnvCreds =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasEnvCreds) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log('Function triggered with method:', req.method);

  try {
    if (req.method === 'GET') {
      const snapshot = await db
        .collection('readings')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      if (snapshot.empty) {
        return res.status(200).json([]);
      }

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json(results);
    }

    if (req.method === 'POST') {
      const { power, importKwh, exportKwh } = req.body || {};

      await db.collection('readings').add({
        active_power_w: power || 0,
        total_import_kwh: importKwh || 0,
        total_export_kwh: exportKwh || 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ status: 'success' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Firebase Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}