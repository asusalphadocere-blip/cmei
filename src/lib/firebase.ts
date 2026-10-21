import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  remove,
  onValue,
  serverTimestamp,
  runTransaction,
  Database,
  Unsubscribe,
} from 'firebase/database';
import type { Note, SectionId } from '../types.ts';

// Configuración predeterminada proporcionada para el taller UDP CMEI
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyAkwHvPSLss88LVaxNbBtiuRBryUT1BCzM",
  authDomain: "udp-cmei-focusgroup.firebaseapp.com",
  databaseURL: "https://udp-cmei-focusgroup-default-rtdb.firebaseio.com",
  projectId: "udp-cmei-focusgroup",
  storageBucket: "udp-cmei-focusgroup.firebasestorage.app",
  messagingSenderId: "889358605926",
  appId: "1:889358605926:web:86d9351d501ad546c6d7a7",
};

function getFirebaseConfig() {
  return {
    apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || DEFAULT_CONFIG.apiKey,
    authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || DEFAULT_CONFIG.authDomain,
    databaseURL: (import.meta.env?.VITE_FIREBASE_DATABASE_URL as string) || DEFAULT_CONFIG.databaseURL,
    projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || DEFAULT_CONFIG.projectId,
    storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || DEFAULT_CONFIG.storageBucket,
    messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || DEFAULT_CONFIG.messagingSenderId,
    appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || DEFAULT_CONFIG.appId,
  };
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    const config = getFirebaseConfig();
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = getDatabase(appInstance);
  }
  return dbInstance;
}

/**
 * Escucha las notas en tiempo real
 */
export function subscribeNotes(
  onData: (notes: Note[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const db = getDb();
  const notesRef = ref(db, 'notes');

  return onValue(
    notesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onData([]);
        return;
      }

      const notesList: Note[] = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        sec: (val?.sec || 'sec1') as SectionId,
        text: String(val?.text || '').slice(0, 280),
        ts: typeof val?.ts === 'number' ? val.ts : Date.now(),
        votes: typeof val?.votes === 'number' ? val.votes : 0,
      }));

      // Ordenar cronológicamente descendente por defecto
      notesList.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      onData(notesList);
    },
    (error) => {
      console.error('Error suscribiendo a Firebase Realtime Database:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Monitorea el estado de conexión de Firebase
 */
export function subscribeConnectionState(onChange: (connected: boolean) => void): Unsubscribe {
  const db = getDb();
  const connectedRef = ref(db, '.info/connected');
  return onValue(connectedRef, (snap) => {
    onChange(snap.val() === true);
  });
}

/**
 * Crea un nuevo post-it anónimo
 */
export async function createNote(sec: SectionId, text: string): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('El texto no puede estar vacío');
  }
  if (cleanText.length > 280) {
    throw new Error('El texto no puede exceder 280 caracteres');
  }

  const db = getDb();
  const notesRef = ref(db, 'notes');
  const newNoteRef = push(notesRef);

  await set(newNoteRef, {
    sec,
    text: cleanText,
    ts: serverTimestamp(),
    votes: 0,
  });

  return newNoteRef.key || '';
}

/**
 * Vota un post-it incrementando votes en 1
 */
export async function voteNote(noteId: string): Promise<number> {
  if (!noteId) throw new Error('ID de nota inválido');

  const db = getDb();
  const votesRef = ref(db, `notes/${noteId}/votes`);

  const result = await runTransaction(votesRef, (current) => {
    return (current || 0) + 1;
  });

  if (!result.committed) {
    throw new Error('No se pudo registrar el voto');
  }

  return result.snapshot.val();
}

/**
 * Elimina un post-it (usado por la facilitadora)
 */
export async function deleteNote(noteId: string): Promise<void> {
  if (!noteId) throw new Error('ID de nota requerido');
  const db = getDb();
  const noteRef = ref(db, `notes/${noteId}`);
  await remove(noteRef);
}
