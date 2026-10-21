import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Heart,
  Check,
  Sparkles,
  LayoutGrid,
  Vote,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Undo2,
  Lock,
  Trash2,
  Ban,
} from 'lucide-react';
import type { Note, SectionId, BoardSettings } from '../types.ts';
import { SECTIONS, POSTIT_COLORS } from '../types.ts';
import { createNote, voteNote, unvoteNote, deleteNote } from '../lib/firebase.ts';
import { useVotes } from '../lib/useVotes.ts';
import { useAuthor } from '../lib/useAuthor.ts';
import { PostIt } from './PostIt.tsx';
import { BoardView } from './BoardView.tsx';

interface ParticipantViewProps {
  notes: Note[];
  settings: BoardSettings;
  onGoToPanel?: () => void;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  notes,
  settings,
  onGoToPanel,
}) => {
  const [activeTab, setActiveTab] = useState<'aportar' | 'votar' | 'tablero'>('aportar');
  const [selectedSec, setSelectedSec] = useState<SectionId>('sec1');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [filterSecVotar, setFilterSecVotar] = useState<SectionId | 'todas'>('todas');
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);

  const {
    votesRemaining,
    votesUsed,
    maxVotes,
    hasVoted,
    canVote,
    recordVote,
    unrecordVote,
  } = useVotes();

  const { authorId, isMyNote, recordMyNote, removeMyNote, isBanned } = useAuthor(
    settings.bannedAuthors
  );

  const currentSection = SECTIONS.find((s) => s.id === selectedSec) || SECTIONS[0];

  // Excluir notas ocultadas por la facilitadora para las participantes
  const visibleNotes = notes.filter((n) => !n.hidden);

  // Post-its de la sección seleccionada en Aportar
  const currentSecNotes = visibleNotes.filter((n) => n.sec === selectedSec);

  // Post-its de las secciones 1 a 4 para Votar, ordenados por votos descendente
  const votableSecIds: SectionId[] = ['sec1', 'sec2', 'sec3', 'sec4'];
  const votableNotes = visibleNotes
    .filter((n) => votableSecIds.includes(n.sec))
    .filter((n) => (filterSecVotar === 'todas' ? true : n.sec === filterSecVotar))
    .sort((a, b) => b.votes - a.votes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) {
      setSubmitError('Tu acceso para participar ha sido restringido por la facilitadora.');
      return;
    }

    const clean = text.trim();
    if (!clean) {
      setSubmitError('Por favor escribe tu idea antes de enviar');
      return;
    }
    if (clean.length > 280) {
      setSubmitError('Máximo 280 caracteres');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newKey = await createNote(selectedSec, clean, authorId);
      if (newKey) {
        recordMyNote(newKey);
      }
      setText('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3500);

      // Confeti sutil de celebración
      try {
        confetti({
          particleCount: 28,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#22e5ff', '#8b5cf6', '#ffe48a', '#ffc9d1'],
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Error al enviar post-it:', err);
      setSubmitError(err.message || 'Error al enviar el post-it. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (noteId: string) => {
    if (isBanned) return;
    if (!settings.votingOpen) return;
    if (!canVote(noteId)) return;

    try {
      recordVote(noteId);
      await voteNote(noteId);

      try {
        confetti({
          particleCount: 20,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#ffc9d1', '#8b5cf6', '#22e5ff'],
        });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error al votar:', err);
    }
  };

  const handleUnvote = async (noteId: string) => {
    if (!settings.votingOpen) return;
    try {
      unrecordVote(noteId);
      await unvoteNote(noteId);
    } catch (err) {
      console.error('Error al retirar voto:', err);
    }
  };

  const handleDeleteMyOwnNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      removeMyNote(noteId);
      setConfirmDeleteNoteId(null);
    } catch (err) {
      console.error('Error al borrar nota propia:', err);
    }
  };

  // Previsualización de color del post-it
  const previewColor = POSTIT_COLORS[currentSecNotes.length % POSTIT_COLORS.length];

  return (
    <div className="min-h-screen bg-[#0a0f2e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* ========================================================= */}
      {/* BARRA SUPERIOR MÓVIL */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 bg-[#0c143d]/95 backdrop-blur-md border-b border-indigo-900/60 px-4 py-3 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-slate-900 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Escucharnos para construir juntas
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>100% Anónimo · Sin cuenta</span>
              </div>
            </div>
          </div>

          {onGoToPanel && (
            <button
              onClick={onGoToPanel}
              className="text-[11px] font-medium text-slate-400 hover:text-cyan-300 px-2 py-1 rounded border border-slate-700/60 hover:border-cyan-500/50 cursor-pointer transition-colors"
            >
              Facilitadora
            </button>
          )}
        </div>
      </header>

      {/* BANNER SI LA PARTICIPANTE FUE RESTRINGIDA */}
      {isBanned && (
        <div className="bg-rose-950 border-b border-rose-500/60 p-3 text-center text-xs text-rose-200 flex items-center justify-center gap-2">
          <Ban className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>Tu participación ha sido restringida por la facilitadora del taller.</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑAS PRINCIPALES (Mobile first, táctiles grandes) */}
      {/* ========================================================= */}
      <div className="sticky top-[57px] z-20 bg-[#0a0f2e]/95 backdrop-blur-md px-3 pt-2 pb-2 border-b border-indigo-950">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#121a45] border border-indigo-900/50">
          <button
            onClick={() => setActiveTab('aportar')}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'aportar'
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Aportar</span>
          </button>

          <button
            onClick={() => setActiveTab('votar')}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'votar'
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Votar</span>
            {votesRemaining > 0 && settings.votingOpen && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {votesRemaining}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tablero')}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tablero'
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Tablero</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-5">
        {/* ======================================================= */}
        {/* PESTAÑA 1: APORTAR */}
        {/* ======================================================= */}
        {activeTab === 'aportar' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Banner de bienvenida y respeto */}
            <div className="p-3 rounded-2xl bg-[#121a45] border border-cyan-500/20 text-xs text-slate-200 flex items-start gap-2.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Taller participativo CMEI · Mujeres en Ingeniería UDP
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Escribe una idea por post-it. Comparte solo lo que quieras contar.
                </p>
              </div>
            </div>

            {/* SELECCIÓN DE SECCIÓN */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Elige la sección del taller:</span>
                <span className="text-[11px] text-cyan-400 font-normal">
                  {currentSection.category === 'diagnostico'
                    ? 'Diagnóstico (1-4)'
                    : currentSection.category === 'ideacion'
                    ? 'Probar algo pequeño'
                    : 'Seguir conectadas'}
                </span>
              </label>

              {/* Categorías */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                  Diagnóstico (Votable más tarde)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SECTIONS.filter((s) => s.category === 'diagnostico').map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSec(sec.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2 ${
                        selectedSec === sec.id
                          ? 'bg-gradient-to-r from-[#1e2a6b] to-[#251e60] border-cyan-400 text-white shadow-md ring-1 ring-cyan-400'
                          : 'bg-[#121a45]/70 border-indigo-950 text-slate-300 hover:border-indigo-800'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                        {sec.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate leading-tight">{sec.title}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{sec.question}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1 pt-1">
                  Probar algo pequeño & Seguir conectadas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SECTIONS.filter((s) => s.category !== 'diagnostico').map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSec(sec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        selectedSec === sec.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-xs'
                          : 'bg-[#121a45]/60 border-indigo-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sec.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PREGUNTA ORIENTADORA */}
            <div className="p-3.5 rounded-2xl bg-[#141e54] border border-indigo-700/40 space-y-1">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pregunta orientadora:</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {currentSection.question}
              </p>
              <p className="text-xs text-slate-300">
                {currentSection.subtitle}
              </p>
            </div>

            {/* FORMULARIO DE POST-IT */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Tu post-it:</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      text.length > 250
                        ? 'text-amber-400'
                        : text.length > 280
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {text.length}/280
                  </span>
                </div>

                {/* Previsualización del post-it */}
                <div
                  style={{
                    backgroundColor: previewColor.bg,
                    color: previewColor.text,
                    borderColor: previewColor.border,
                  }}
                  className="rounded-2xl p-4 shadow-lg border transition-all"
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe una idea por post-it. Comparte solo lo que quieras contar..."
                    maxLength={280}
                    rows={4}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm sm:text-base placeholder:text-stone-600 font-normal leading-relaxed selection:bg-black/20"
                    disabled={isSubmitting || isBanned}
                  />
                  <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] opacity-70">
                    <span>💡 1 idea por post-it</span>
                    <span>Anónimo · Puedes borrar tu post-it</span>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>¡Post-it enviado con éxito! Ya se ve en el tablero del taller.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !text.trim() || isBanned}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Enviando al tablero...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar post-it al tablero</span>
                  </>
                )}
              </button>
            </form>

            {/* FEED EN VIVO DE LA SECCIÓN */}
            <div className="pt-4 border-t border-indigo-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>En vivo en "{currentSection.title}" ({currentSecNotes.length})</span>
                </h3>
              </div>

              {currentSecNotes.length === 0 ? (
                <div className="text-center p-6 rounded-2xl bg-[#121a45]/40 border border-dashed border-indigo-950 text-slate-400 text-xs">
                  Aún no hay post-its en esta sección. ¡Sé la primera en aportar!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentSecNotes.slice(0, 8).map((note, index) => {
                    const mine = isMyNote(note);
                    return (
                      <div key={note.id} className="relative">
                        <PostIt
                          note={note}
                          index={index}
                          theme="dark"
                          compact={true}
                          isMyNote={mine}
                          onDelete={mine ? handleDeleteMyOwnNote : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* PESTAÑA 2: VOTAR */}
        {/* ======================================================= */}
        {activeTab === 'votar' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* TARJETA DE ESTADO DE VOTACIÓN */}
            {!settings.votingOpen ? (
              <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-bold">La votación está cerrada temporalmente</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    La facilitadora abrirá la votación durante la fase de priorización.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#172052] to-[#25184a] border border-violet-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                    Tus votos para el taller
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-violet-500/20 text-violet-200 border border-violet-400/30">
                    {votesRemaining} de {maxVotes} disponibles
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {Array.from({ length: maxVotes }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          i < votesUsed
                            ? 'bg-gradient-to-tr from-cyan-400 to-violet-500 text-slate-950 shadow-sm'
                            : 'border-2 border-dashed border-violet-400/40 text-violet-400/40'
                        }`}
                      >
                        {i < votesUsed ? '✓' : i + 1}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-300 leading-tight">
                    {votesRemaining === 2 ? (
                      <p>
                        Tienes <strong className="text-cyan-300">2 votos</strong>. Elige las 2 ideas prioritarias de las columnas 1 a 4.
                      </p>
                    ) : votesRemaining === 1 ? (
                      <p>
                        Te queda <strong className="text-cyan-300">1 voto</strong>. Puedes cambiar tu voto actual o elegir una segunda idea.
                      </p>
                    ) : (
                      <p className="text-emerald-300 font-semibold">
                        Has usado tus 2 votos. Puedes cambiar cualquiera si lo deseas antes del cierre.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FILTROS POR COLUMNAS 1 A 4 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Filtrar por columna:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setFilterSecVotar('todas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    filterSecVotar === 'todas'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-[#121a45] text-slate-300 hover:bg-[#1a255f]'
                  }`}
                >
                  Todas (1 a 4)
                </button>
                {SECTIONS.filter((s) => s.category === 'diagnostico').map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setFilterSecVotar(sec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      filterSecVotar === sec.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-[#121a45] text-slate-300 hover:bg-[#1a255f]'
                    }`}
                  >
                    {sec.number}. {sec.title}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTA DE POST-ITS PARA VOTAR */}
            <div className="space-y-3">
              {votableNotes.length === 0 ? (
                <div className="text-center p-8 rounded-2xl bg-[#121a45]/40 border border-dashed border-indigo-950 text-slate-400 text-sm">
                  Aún no hay post-its para votar en estas columnas. Pasa a la pestaña "Aportar" para sumar tus ideas.
                </div>
              ) : (
                votableNotes.map((note, index) => {
                  const secMeta = SECTIONS.find((s) => s.id === note.sec);
                  const isVotedByMe = hasVoted(note.id);
                  const canVoteThis = canVote(note.id) && settings.votingOpen;
                  const mine = isMyNote(note);

                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl bg-[#121a45] border border-indigo-900/60 shadow-md space-y-2.5 transition-all hover:border-indigo-700"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0f2e] text-cyan-300 font-semibold text-[11px]">
                            <span>{secMeta?.number || '•'}</span>
                            <span>{secMeta?.title}</span>
                          </span>
                          {mine && (
                            <span className="text-[10px] bg-indigo-600/40 text-indigo-200 px-1.5 py-0.5 rounded">
                              Tu idea
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                          <span>★ {note.votes}</span>
                          <span className="text-slate-400 font-normal">
                            {note.votes === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-100 font-medium whitespace-pre-wrap break-words leading-snug">
                        {note.text}
                      </p>

                      <div className="pt-2 border-t border-indigo-950/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            #{index + 1} en el ranking
                          </span>
                          {mine && (
                            <button
                              onClick={() => handleDeleteMyOwnNote(note.id)}
                              className="text-[11px] text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 cursor-pointer"
                              title="Borrar mi post-it"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Borrar mi idea</span>
                            </button>
                          )}
                        </div>

                        {/* ACCIONES DE VOTO */}
                        {isVotedByMe ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                              <Check className="w-3.5 h-3.5" />
                              <span>Votado</span>
                            </span>
                            {settings.votingOpen && (
                              <button
                                onClick={() => handleUnvote(note.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
                                title="Cambiar mi voto"
                              >
                                <Undo2 className="w-3 h-3" />
                                <span>Cambiar</span>
                              </button>
                            )}
                          </div>
                        ) : canVoteThis ? (
                          <button
                            onClick={() => handleVote(note.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current text-rose-600" />
                            <span>Votar por esta idea</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            {!settings.votingOpen ? 'Votación cerrada' : 'Sin votos disponibles'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* PESTAÑA 3: VER TABLERO COMPLETO */}
        {/* ======================================================= */}
        {activeTab === 'tablero' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-2xl bg-[#121a45] border border-indigo-900/50 text-xs text-slate-300 flex items-center justify-between">
              <span>Tablero colaborativo grupal en tiempo real</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {visibleNotes.length} post-its en total
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-indigo-900 shadow-xl">
              <BoardView
                notes={visibleNotes}
                theme="dark"
                isFacilitator={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* PIE DE PÁGINA */}
      {/* ========================================================= */}
      <footer className="mt-8 border-t border-indigo-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>Mujeres en Ingeniería UDP · CMEI · 21 de octubre, 13:00–14:30</p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Tablero colaborativo anónimo para ideación participativa
        </p>
      </footer>
    </div>
  );
};
