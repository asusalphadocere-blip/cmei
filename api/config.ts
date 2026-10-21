import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "AIzaSyAkwHvPSLss88LVaxNbBtiuRBryUT1BCzM",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "udp-cmei-focusgroup.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || "https://udp-cmei-focusgroup-default-rtdb.firebaseio.com",
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "udp-cmei-focusgroup",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "udp-cmei-focusgroup.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "889358605926",
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "1:889358605926:web:86d9351d501ad546c6d7a7",
  };

  return res.status(200).json(config);
}
