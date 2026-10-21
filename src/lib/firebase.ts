import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  serverTimestamp,
  runTransaction,
  Database,
  Unsubscribe,
} from 'firebase/database';
import type { Note, SectionId, BoardSettings, HistorySession } from '../types.ts';

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
        authorId: val?.authorId ? String(val.authorId) : undefined,
        hidden: val?.hidden === true,
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
 * Escucha configuraciones del tablero (votación abierta/cerrada, lista de bloqueados)
 */
export function subscribeSettings(onData: (settings: BoardSettings) => void): Unsubscribe {
  const db = getDb();
  const settingsRef = ref(db, 'settings');

  return onValue(settingsRef, (snapshot) => {
    const data = snapshot.val() || {};
    onData({
      votingOpen: data.votingOpen !== false, // abierta por defecto
      bannedAuthors: data.bannedAuthors || {},
    });
  });
}

/**
 * Actualiza el estado de la votación (abrir/cerrar)
 */
export async function setVotingStatus(isOpen: boolean): Promise<void> {
  const db = getDb();
  const votingRef = ref(db, 'settings/votingOpen');
  await set(votingRef, isOpen);
}

/**
 * Bloquea a un autor para que no pueda enviar post-its ni votar
 */
export async function banAuthor(authorId: string): Promise<void> {
  if (!authorId) return;
  const db = getDb();
  const banRef = ref(db, `settings/bannedAuthors/${authorId}`);
  await set(banRef, true);
}

/**
 * Desbloquea a un autor
 */
export async function unbanAuthor(authorId: string): Promise<void> {
  if (!authorId) return;
  const db = getDb();
  const banRef = ref(db, `settings/bannedAuthors/${authorId}`);
  await remove(banRef);
}

/**
 * Crea un nuevo post-it anónimo
 */
export async function createNote(
  sec: SectionId,
  text: string,
  authorId?: string
): Promise<string> {
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

  const payload: any = {
    sec,
    text: cleanText,
    ts: serverTimestamp(),
    votes: 0,
    hidden: false,
  };

  if (authorId) {
    payload.authorId = authorId;
  }

  await set(newNoteRef, payload);

  return newNoteRef.key || '';
}

/**
 * Alterna el estado oculto/visible de un post-it (moderación de facilitadora)
 */
export async function toggleHideNote(noteId: string, currentHidden: boolean): Promise<void> {
  if (!noteId) return;
  const db = getDb();
  const hideRef = ref(db, `notes/${noteId}/hidden`);
  await set(hideRef, !currentHidden);
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
 * Deshace el voto en un post-it (decrementa en 1)
 */
export async function unvoteNote(noteId: string): Promise<number> {
  if (!noteId) throw new Error('ID de nota inválido');

  const db = getDb();
  const votesRef = ref(db, `notes/${noteId}/votes`);

  const result = await runTransaction(votesRef, (current) => {
    const val = current || 0;
    return val > 0 ? val - 1 : 0;
  });

  if (!result.committed) {
    throw new Error('No se pudo deshacer el voto');
  }

  return result.snapshot.val();
}

/**
 * Elimina un post-it (usado por facilitadora o por la participante que lo escribió)
 */
export async function deleteNote(noteId: string): Promise<void> {
  if (!noteId) throw new Error('ID de nota requerido');
  const db = getDb();
  const noteRef = ref(db, `notes/${noteId}`);
  await remove(noteRef);
}

/**
 * Archiva la sesión actual completa a la lista de históricos y limpia el tablero activo
 */
export async function archiveCurrentSession(
  name: string,
  currentNotes: Note[]
): Promise<string> {
  const db = getDb();
  const historyRef = ref(db, 'history');
  const newSessionRef = push(historyRef);

  const totalVotes = currentNotes.reduce((sum, n) => sum + (n.votes || 0), 0);

  const sessionData = {
    id: newSessionRef.key || '',
    name: name.trim() || `Taller ${new Date().toLocaleDateString('es-CL')}`,
    createdAt: Date.now(),
    totalNotes: currentNotes.length,
    totalVotes,
    notes: currentNotes,
  };

  await set(newSessionRef, sessionData);

  // Limpiar el tablero activo para la siguiente sesión
  const notesRef = ref(db, 'notes');
  await set(notesRef, null);

  return newSessionRef.key || '';
}

/**
 * Restaura una sesión archivada al tablero activo
 */
export async function restoreArchivedSession(notesToRestore: Note[]): Promise<void> {
  const db = getDb();
  const notesRef = ref(db, 'notes');

  const payload: Record<string, any> = {};
  for (const n of notesToRestore) {
    payload[n.id] = {
      sec: n.sec,
      text: n.text,
      ts: n.ts || Date.now(),
      votes: n.votes || 0,
      authorId: n.authorId || null,
      hidden: n.hidden || false,
    };
  }

  await set(notesRef, payload);
}

/**
 * Escucha la lista de sesiones archivadas
 */
export function subscribeHistory(onData: (sessions: HistorySession[]) => void): Unsubscribe {
  const db = getDb();
  const historyRef = ref(db, 'history');

  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      onData([]);
      return;
    }

    const sessionsList: HistorySession[] = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      name: val?.name || 'Sesión archivada',
      createdAt: typeof val?.createdAt === 'number' ? val.createdAt : Date.now(),
      totalNotes: typeof val?.totalNotes === 'number' ? val.totalNotes : 0,
      totalVotes: typeof val?.totalVotes === 'number' ? val.totalVotes : 0,
      notes: Array.isArray(val?.notes)
        ? val.notes
        : val?.notes
        ? Object.values(val.notes)
        : [],
    }));

    sessionsList.sort((a, b) => b.createdAt - a.createdAt);
    onData(sessionsList);
  });
}

/**
 * Elimina una sesión del histórico
 */
export async function deleteHistorySession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const db = getDb();
  const sessionRef = ref(db, `history/${sessionId}`);
  await remove(sessionRef);
}
