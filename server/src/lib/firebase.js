'use strict';

const admin = require('firebase-admin');

let initialized = false;

function initializeFirebase() {
    if (initialized) return;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET; // e.g., my-project.appspot.com

    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
        throw new Error('Missing Firebase Admin env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET)');
    }

    admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        storageBucket
    });
    initialized = true;
}

function getFirestore() {
    if (!initialized) throw new Error('Firebase not initialized');
    return admin.firestore();
}

function getStorageBucket() {
    if (!initialized) throw new Error('Firebase not initialized');
    return admin.storage().bucket();
}

module.exports = { initializeFirebase, getFirestore, getStorageBucket };


