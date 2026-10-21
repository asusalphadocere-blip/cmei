import { useState, useEffect } from 'react';

const STORAGE_KEY = 'udp_cmei_voted_notes_v1';
const MAX_VOTES = 2;

export function useVotes() {
  const [votedNoteIds, setVotedNoteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading votes from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votedNoteIds));
    } catch (e) {
      console.warn('Error saving votes to localStorage', e);
    }
  }, [votedNoteIds]);

  const votesUsed = votedNoteIds.length;
  const votesRemaining = Math.max(0, MAX_VOTES - votesUsed);

  const hasVoted = (noteId: string) => votedNoteIds.includes(noteId);

  const canVote = (noteId: string) => {
    return votesRemaining > 0 && !hasVoted(noteId);
  };

  const recordVote = (noteId: string) => {
    if (!canVote(noteId)) return false;
    setVotedNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    return true;
  };

  const resetLocalVotes = () => {
    setVotedNoteIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return {
    votedNoteIds,
    votesUsed,
    votesRemaining,
    maxVotes: MAX_VOTES,
    hasVoted,
    canVote,
    recordVote,
    resetLocalVotes,
  };
}
