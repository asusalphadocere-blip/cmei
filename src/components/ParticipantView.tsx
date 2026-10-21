import React, { useState, useEffect } from 'react';
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
  Undo2,
  Lock,
  Trash2,
  Ban,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Compass,
  HelpCircle,
  Lightbulb,
  Info,
  ArrowRight,
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
  const [activeMoment, setActiveMoment] = useState<1 | 2>(1); // 1 = Diagnóstico (4 col), 2 = Ideatón & Acción (6 sec)
  const [selectedSec, setSelectedSec] = useState<SectionId>('sec1');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [filterSecVotar, setFilterSecVotar] = useState<SectionId | 'todas'>('todas');
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [showWorkshopGuide, setShowWorkshopGuide] = useState(false);

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

  // Sincronización en tiempo real con la fase guiada por la facilitadora
  useEffect(() => {
    if (settings.activePhase === 'priorizacion') {
      setActiveTab('votar');
    } else if (settings.activePhase === 'ideacion' || settings.activePhase === 'seguimiento') {
      setActiveTab('aportar');
      setActiveMoment(2);
      if (settings.activePhase === 'ideacion' && !['idea', 'prueba', 'aprender'].includes(selectedSec)) {
        setSelectedSec('idea');
      } else if (settings.activePhase === 'seguimiento' && !['paso', 'quien', 'pregunta'].includes(selectedSec)) {
        setSelectedSec('paso');
      }
    } else if (settings.activePhase === 'diagnostico') {
      setActiveMoment(1);
      if (!['sec1', 'sec2', 'sec3', 'sec4'].includes(selectedSec)) {
        setSelectedSec('sec1');
      }
    }
  }, [settings.activePhase]);

  // Si el usuario cambia de Momento manualmente, seleccionar la primera sección de ese momento
  const handleMomentChange = (moment: 1 | 2) => {
    setActiveMoment(moment);
    if (moment === 1) {
      if (!['sec1', 'sec2', 'sec3', 'sec4'].includes(selectedSec)) {
        setSelectedSec('sec1');
      }
    } else {
      if (!['idea', 'prueba', 'aprender', 'paso', 'quien', 'pregunta'].includes(selectedSec)) {
        setSelectedSec('idea');
      }
    }
  };

  const currentSection = SECTIONS.find((s) => s.id === selectedSec) || SECTIONS[0];

  // Excluir notas ocultas
  const visibleNotes = notes.filter((n) => !n.hidden);
  const currentSecNotes = visibleNotes.filter((n) => n.sec === selectedSec);

  // Notas para votar (columnas 1 a 4)
  const votableSecIds: SectionId[] = ['sec1', 'sec2', 'sec3', 'sec4'];
  const votableNotes = visibleNotes
    .filter((n) => votableSecIds.includes(n.sec))
    .filter((n) => (filterSecVotar === 'todas' ? true : n.sec === filterSecVotar))
    .sort((a, b) => b.votes - a.votes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) {
      setSubmitError('Tu acceso ha sido restringido por la facilitadora.');
      return;
    }

    const clean = text.trim();
    if (!clean) {
      setSubmitError('Escribe tu idea antes de enviar');
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
      setShowLiveFeed(true);
      setTimeout(() => setSubmitSuccess(false), 3500);

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
    if (isBanned || !settings.votingOpen || !canVote(noteId)) return;

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
    } catch (err) {
      console.error('Error al borrar nota propia:', err);
    }
  };

  const previewColor = POSTIT_COLORS[currentSecNotes.length % POSTIT_COLORS.length];

  return (
    <div className="min-h-screen bg-[#0a0f2e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* ========================================================= */}
      {/* BARRA SUPERIOR CON GUÍA DEL TALLER */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 bg-[#0c143d]/95 backdrop-blur-md border-b border-indigo-900/60 px-4 py-2.5 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-slate-900 shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight">
                Escucharnos para construir juntas
              </h1>
              <span className="text-[10px] text-cyan-300 font-medium">
                Mujeres en Ingeniería UDP · Anónimo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowWorkshopGuide(true)}
              className="text-[10px] font-semibold text-cyan-300 hover:text-white px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center gap-1 cursor-pointer transition-colors"
              title="Ver cómo funciona el taller"
            >
              <Info className="w-3 h-3" />
              <span>¿Cómo funciona?</span>
            </button>

            {onGoToPanel && (
              <button
                onClick={onGoToPanel}
                className="text-[10px] font-medium text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded border border-slate-700/60 transition-colors"
              >
                Panel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MODAL EDUCATIVO: RUTA DEL TALLER (MOMENTO 1 vs MOMENTO 2) */}
      {showWorkshopGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121a45] rounded-3xl p-5 max-w-sm w-full border border-indigo-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-indigo-900 pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Ruta del Taller (13:00–14:30)</h3>
              </div>
              <button
                onClick={() => setShowWorkshopGuide(false)}
                className="text-slate-400 hover:text-white font-bold px-2 py-1 bg-white/10 rounded-lg text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El taller se divide en <strong>2 momentos distintos</strong>:
              </p>

              {/* Momento 1 */}
              <div className="p-3 rounded-2xl bg-[#0a0f2e] border border-violet-500/40 space-y-1">
                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Momento 1: Diagnóstico Colectivo</span>
                </div>
                <p className="text-[11px] text-slate-300 pl-7 leading-snug">
                  Mapeamos la realidad actual en <strong>4 columnas</strong>: Intereses, Habilidades, Recursos y Barreras.
                </p>
                <div className="pl-7 pt-1 text-[10px] text-amber-300 font-medium">
                  ⭐️ Cierre: Votamos las 2 ideas prioritarias para el grupo.
                </div>
              </div>

              {/* Momento 2 */}
              <div className="p-3 rounded-2xl bg-[#0a0f2e] border border-cyan-500/40 space-y-1">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  <span>Momento 2: Ideatón & Acción</span>
                </div>
                <p className="text-[11px] text-slate-300 pl-7 leading-snug">
                  Con las prioridades votadas, pasamos a las <strong>6 secciones de acción</strong>:
                </p>
                <ul className="text-[10px] text-slate-400 pl-9 space-y-0.5 list-disc">
                  <li><strong>Probar algo pequeño:</strong> Idea, Prueba y Aprendizaje.</li>
                  <li><strong>Seguir conectadas:</strong> Próximo paso voluntario y roles.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowWorkshopGuide(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              ¡Entendido, vamos a participar!
            </button>
          </div>
        </div>
      )}

      {/* BANNER SI ESTÁ RESTRINGIDA */}
      {isBanned && (
        <div className="bg-rose-950 border-b border-rose-500/60 p-2.5 text-center text-xs text-rose-200 flex items-center justify-center gap-2">
          <Ban className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>Tu participación ha sido restringida por la facilitadora.</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑAS PRINCIPALES: APORTAR | VOTAR | TABLERO */}
      {/* ========================================================= */}
      <div className="sticky top-[49px] z-20 bg-[#0a0f2e]/95 backdrop-blur-md px-3 pt-2 pb-2 border-b border-indigo-950">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#121a45] border border-indigo-900/50">
          <button
            onClick={() => setActiveTab('aportar')}
            className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'aportar'
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Aportar</span>
          </button>

          <button
            onClick={() => setActiveTab('votar')}
            className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'votar'
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Votar</span>
            {votesRemaining > 0 && settings.votingOpen && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                {votesRemaining}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tablero')}
            className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tablero'
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Tablero</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTENIDO PRINCIPAL: CLARAMENTE DIVIDIDO EN 2 MOMENTOS */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-md w-full mx-auto p-3.5 sm:p-4 space-y-4">
        {/* ======================================================= */}
        {/* PESTAÑA 1: APORTAR */}
        {/* ======================================================= */}
        {activeTab === 'aportar' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* SELECTOR DE MOMENTOS DEL TALLER (Momento 1 vs Momento 2) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">
                Fase de la sesión:
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#121a45] border border-indigo-900/60">
                <button
                  type="button"
                  onClick={() => handleMomentChange(1)}
                  className={`py-2 px-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-center ${
                    activeMoment === 1
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-black leading-tight flex items-center gap-1">
                    <span>1. Diagnóstico</span>
                    {activeMoment === 1 && <span className="text-cyan-300">•</span>}
                  </div>
                  <div className="text-[9px] opacity-80 truncate">4 Columnas base</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleMomentChange(2)}
                  className={`py-2 px-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-center ${
                    activeMoment === 2
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-bold leading-tight flex items-center gap-1">
                    <span>2. Ideatón</span>
                    {activeMoment === 2 && <span className="text-white">•</span>}
                  </div>
                  <div className="text-[9px] opacity-80 truncate">6 Secciones de acción</div>
                </button>
              </div>
            </div>

            {/* SECCIONES DEL MOMENTO 1 (DIAGNÓSTICO: 4 COLUMNAS) */}
            {activeMoment === 1 && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="p-2 rounded-xl bg-violet-950/40 border border-violet-700/30 text-[11px] text-violet-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <span><strong>Momento 1:</strong> Mapeemos la realidad actual de la facultad</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {SECTIONS.filter((s) => s.moment === 1).map((sec) => {
                    const isSelected = selectedSec === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedSec(sec.id)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#1e2a6b] border-cyan-400 text-white shadow-md ring-1 ring-cyan-400'
                            : 'bg-[#121a45]/80 border-indigo-950 text-slate-300 hover:border-indigo-800'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                          {sec.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold leading-tight truncate">{sec.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECCIONES DEL MOMENTO 2 (IDEATÓN & ACCIÓN: 6 SECCIONES) */}
            {activeMoment === 2 && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-700/30 text-[11px] text-cyan-200 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span><strong>Momento 2:</strong> A partir de lo priorizado, diseñemos soluciones</span>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    A. Probar algo pequeño (Ideatón)
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {SECTIONS.filter((s) => s.category === 'ideacion').map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedSec(sec.id)}
                        className={`p-2 rounded-xl text-center border text-[11px] font-medium cursor-pointer transition-all ${
                          selectedSec === sec.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-xs'
                            : 'bg-[#121a45]/70 border-indigo-950 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="truncate">{sec.title}</div>
                        <div className="text-[9px] text-slate-400 truncate">{sec.question}</div>
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 pt-1">
                    B. Seguir conectadas (Compromisos)
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {SECTIONS.filter((s) => s.category === 'seguimiento').map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedSec(sec.id)}
                        className={`p-2 rounded-xl text-center border text-[10px] font-medium cursor-pointer transition-all ${
                          selectedSec === sec.id
                            ? 'bg-violet-500/20 border-violet-400 text-violet-200 font-bold shadow-xs'
                            : 'bg-[#121a45]/70 border-indigo-950 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="truncate">{sec.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PREGUNTA ORIENTADORA CLARA */}
            <div className="p-3 rounded-2xl bg-[#121a45] border border-indigo-700/40 text-center space-y-0.5">
              <div className="text-[11px] text-cyan-300 font-semibold">
                {currentSection.title}:
              </div>
              <p className="text-sm font-bold text-white leading-snug">
                {currentSection.question}
              </p>
              <p className="text-[11px] text-slate-400">
                {currentSection.subtitle}
              </p>
            </div>

            {/* FORMULARIO DE POST-IT */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div
                style={{
                  backgroundColor: previewColor.bg,
                  color: previewColor.text,
                  borderColor: previewColor.border,
                }}
                className="rounded-2xl p-3.5 shadow-lg border transition-all"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribe tu idea aquí (1 idea por post-it)..."
                  maxLength={280}
                  rows={3}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-stone-600 font-normal leading-relaxed selection:bg-black/20"
                  disabled={isSubmitting || isBanned}
                />
                <div className="mt-1 pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] opacity-75">
                  <span>Anónimo · Tu privacidad protegida</span>
                  <span className="font-mono font-bold">{text.length}/280</span>
                </div>
              </div>

              {submitError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>¡Post-it publicado en la pizarra del taller!</span>
                </div>
              )}

              {/* BOTÓN GRANDE PARA UNA MANO */}
              <button
                type="submit"
                disabled={isSubmitting || !text.trim() || isBanned}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Pegando post-it...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Pegar post-it en la pizarra</span>
                  </>
                )}
              </button>
            </form>

            {/* FEED EN VIVO DESPLEGABLE */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowLiveFeed((prev) => !prev)}
                className="w-full py-2 px-3 rounded-xl bg-[#121a45]/60 border border-indigo-950 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Post-its en "{currentSection.title}" ({currentSecNotes.length})</span>
                </div>
                {showLiveFeed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showLiveFeed && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1 animate-in fade-in duration-150">
                  {currentSecNotes.length === 0 ? (
                    <div className="text-center p-4 rounded-xl bg-[#121a45]/30 text-slate-400 text-xs">
                      Aún no hay post-its en esta sección. ¡Sé la primera en escribir!
                    </div>
                  ) : (
                    currentSecNotes.map((note, index) => {
                      const mine = isMyNote(note);
                      return (
                        <PostIt
                          key={note.id}
                          note={note}
                          index={index}
                          theme="dark"
                          compact={true}
                          isMyNote={mine}
                          onDelete={mine ? handleDeleteMyOwnNote : undefined}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* PESTAÑA 2: VOTAR (PRIORIZACIÓN DEL MOMENTO 1) */}
        {/* ======================================================= */}
        {activeTab === 'votar' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* EXPLICACIÓN DEL PASO DE PRIORIZACIÓN */}
            <div className="p-2.5 rounded-2xl bg-violet-950/50 border border-violet-500/40 text-violet-200 text-xs flex items-center gap-2">
              <Vote className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span>Priorizamos juntas las ideas del <strong>Momento 1</strong> para llevarlas a la Ideatón.</span>
            </div>

            {/* ESTADO DE VOTACIÓN */}
            {!settings.votingOpen ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-bold">Votación en pausa</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    La facilitadora abrirá la votación cuando comience la priorización grupal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#172052] to-[#25184a] border border-violet-500/30 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                    Tus 2 votos de prioridad
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-violet-500/20 text-violet-200 border border-violet-400/30">
                    {votesRemaining} disponibles
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="flex gap-1.5 flex-shrink-0">
                    {Array.from({ length: maxVotes }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          i < votesUsed
                            ? 'bg-gradient-to-tr from-cyan-400 to-violet-500 text-slate-950 shadow-xs'
                            : 'border border-dashed border-violet-400/40 text-violet-400/40'
                        }`}
                      >
                        {i < votesUsed ? '✓' : i + 1}
                      </div>
                    ))}
                  </div>

                  <p className="leading-snug text-[11px]">
                    {votesRemaining === 2
                      ? 'Elige las 2 ideas de las columnas 1 a 4 que te parezcan más urgentes.'
                      : votesRemaining === 1
                      ? 'Te queda 1 voto disponible. Puedes cambiar el anterior cuando quieras.'
                      : '¡Has usado tus 2 votos! Puedes cambiar cualquiera si cambias de opinión.'}
                  </p>
                </div>
              </div>
            )}

            {/* FILTROS SIMPLES */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterSecVotar('todas')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  filterSecVotar === 'todas'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#121a45] text-slate-300'
                }`}
              >
                Todas
              </button>
              {SECTIONS.filter((s) => s.category === 'diagnostico').map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setFilterSecVotar(sec.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    filterSecVotar === sec.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-[#121a45] text-slate-300'
                  }`}
                >
                  {sec.number}. {sec.title}
                </button>
              ))}
            </div>

            {/* LISTADO DE POST-ITS PARA VOTAR */}
            <div className="space-y-2.5">
              {votableNotes.length === 0 ? (
                <div className="text-center p-6 rounded-2xl bg-[#121a45]/40 border border-dashed border-indigo-950 text-slate-400 text-xs">
                  Aún no hay post-its para votar. Pasa a "Aportar" para sumar tus ideas en el Momento 1.
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
                      className="p-3 rounded-2xl bg-[#121a45] border border-indigo-900/60 shadow-sm space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0a0f2e] text-cyan-300 font-semibold text-[10px]">
                          <span>{secMeta?.number || '•'}</span>
                          <span>{secMeta?.title}</span>
                        </span>

                        <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                          <span>★ {note.votes}</span>
                          <span className="text-slate-400 font-normal text-[10px]">
                            {note.votes === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-100 font-medium whitespace-pre-wrap break-words leading-relaxed">
                        {note.text}
                      </p>

                      <div className="pt-2 border-t border-indigo-950/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            #{index + 1}
                          </span>
                          {mine && (
                            <button
                              onClick={() => handleDeleteMyOwnNote(note.id)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Borrar</span>
                            </button>
                          )}
                        </div>

                        {/* ACCIONES DE VOTO */}
                        {isVotedByMe ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                              <Check className="w-3 h-3" />
                              <span>Votado</span>
                            </span>
                            {settings.votingOpen && (
                              <button
                                onClick={() => handleUnvote(note.id)}
                                className="inline-flex items-center gap-0.5 px-2 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-semibold cursor-pointer"
                              >
                                <Undo2 className="w-2.5 h-2.5" />
                                <span>Cambiar</span>
                              </button>
                            )}
                          </div>
                        ) : canVoteThis ? (
                          <button
                            onClick={() => handleVote(note.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 text-xs font-black shadow-sm cursor-pointer active:scale-95 transition-all"
                          >
                            <Heart className="w-3 h-3 fill-current text-rose-600" />
                            <span>Votar</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            {!settings.votingOpen ? 'Cerrada' : 'Sin votos'}
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
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-2.5 rounded-2xl bg-[#121a45] border border-indigo-900/50 text-xs text-slate-300 flex items-center justify-between">
              <span>Pizarra en vivo compartida</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {visibleNotes.length} ideas
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-indigo-900 shadow-xl">
              <BoardView notes={visibleNotes} theme="dark" isFacilitator={false} />
            </div>
          </div>
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="mt-4 border-t border-indigo-950 py-3 px-4 text-center text-[10px] text-slate-500">
        <p>Mujeres en Ingeniería UDP · CMEI · 21 de octubre, 13:00–14:30</p>
      </footer>
    </div>
  );
};
