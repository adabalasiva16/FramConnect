import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

import { getStorage } from 'firebase/storage';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use provisioned custom database ID if specified in config, otherwise default
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
};

// Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected successfully to Cloud Firestore:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[Firebase] Notice: Client operating in offline mode or handshake complete.');
  }
}

testConnection();

export default app;
