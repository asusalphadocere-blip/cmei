import { useState, useEffect } from 'react';
import type { Note } from '../types.ts';

const AUTHOR_STORAGE_KEY = 'udp_cmei_author_id_v1';
const MY_NOTES_STORAGE_KEY = 'udp_cmei_my_notes_v1';

export function useAuthor(bannedAuthors: Record<string, boolean> = {}) {
  const [authorId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(AUTHOR_STORAGE_KEY);
      if (stored) return stored;
      const newId = 'u_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(AUTHOR_STORAGE_KEY, newId);
      return newId;
    } catch {
      return 'u_' + Math.random().toString(36).substring(2, 10);
    }
  });

  const [myNoteIds, setMyNoteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(MY_NOTES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(MY_NOTES_STORAGE_KEY, JSON.stringify(myNoteIds));
    } catch {
      // ignore
    }
  }, [myNoteIds]);

  const recordMyNote = (noteId: string) => {
    setMyNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
  };

  const removeMyNote = (noteId: string) => {
    setMyNoteIds((prev) => prev.filter((id) => id !== noteId));
  };

  const isMyNote = (note: Note) => {
    if (!note) return false;
    return (note.authorId && note.authorId === authorId) || myNoteIds.includes(note.id);
  };

  const isBanned = Boolean(bannedAuthors && bannedAuthors[authorId]);

  return {
    authorId,
    myNoteIds,
    recordMyNote,
    removeMyNote,
    isMyNote,
    isBanned,
  };
}
