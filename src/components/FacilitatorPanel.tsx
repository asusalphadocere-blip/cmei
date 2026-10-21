import React, { useState } from 'react';
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  LogOut,
  Layers,
  Download,
  Filter,
  Palette,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import type { Note, SectionId } from '../types.ts';
import { SECTIONS } from '../types.ts';
import { BoardView } from './BoardView.tsx';
import { createNote, deleteNote } from '../lib/firebase.ts';

interface FacilitatorPanelProps {
  notes: Note[];
  onLogout: () => void;
  onGoToParticipantView: () => void;
  isConnected: boolean;
}

export const FacilitatorPanel: React.FC<FacilitatorPanelProps> = ({
  notes,
  onLogout,
  onGoToParticipantView,
  isConnected,
}) => {
  const [theme, setTheme] = useState<'canvas' | 'dark'>('canvas');
  const [zoomMode, setZoomMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'diagnostico' | 'priorizacion' | 'ideacion' | 'seguimiento'
  >('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOriginalImage, setShowOriginalImage] = useState(false);

  // Estados para nuevo post-it manual de la facilitadora
  const [manualSec, setManualSec] = useState<SectionId>('sec1');
  const [manualText, setManualText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Métricas
  const totalNotes = notes.length;
  const totalVotes = notes.reduce((sum, n) => sum + (n.votes || 0), 0);

  const handleCopyLink = async () => {
    try {
      const url = window.location.origin;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Fallback manual si clipboard API falla
      const input = document.createElement('input');
      input.value = window.location.origin;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (err) {
      console.error('Error al borrar nota:', err);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await createNote(manualSec, manualText.trim());
      setManualText('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error al crear post-it de facilitadora:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Sección', 'Título Sección', 'Categoría', 'Votos', 'Fecha', 'Texto'];
    const rows = notes.map((n) => {
      const secMeta = SECTIONS.find((s) => s.id === n.sec);
      const dateStr = new Date(n.ts).toLocaleString('es-CL');
      return [
        `"${n.id}"`,
        `"${n.sec}"`,
        `"${secMeta?.title || ''}"`,
        `"${secMeta?.category || ''}"`,
        n.votes || 0,
        `"${dateStr}"`,
        `"${n.text.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Memoria_Taller_CMEI_UDP_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#0a0f2e]' : 'bg-[#faf8f5]'}`}>
      {/* ========================================================= */}
      {/* BARRA SUPERIOR DE CONTROL PARA FACILITADORA */}
      {/* ========================================================= */}
      {!zoomMode && (
        <header className="sticky top-0 z-40 bg-[#0c143d] text-white border-b border-indigo-900/80 px-4 py-2.5 shadow-lg">
          <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Título y estado */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-slate-950 shadow-md">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                    Panel Facilitadora · CMEI UDP
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span>{isConnected ? 'Tiempo Real Conectado' : 'Reconectando...'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Taller: 21 de octubre · 13:00–14:30 · Zoom
                </p>
              </div>
            </div>

            {/* Contadores rápidos */}
            <div className="flex items-center gap-2 bg-[#121a45] px-3 py-1.5 rounded-xl border border-indigo-800/60 text-xs">
              <span className="text-slate-400">Total ideas:</span>
              <span className="font-extrabold text-cyan-300 text-sm">{totalNotes}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Total votos:</span>
              <span className="font-extrabold text-violet-300 text-sm">{totalVotes}</span>
            </div>

            {/* Acciones principales */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Botón copiar enlace participantes */}
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md cursor-pointer transition-all active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar enlace participantes</span>
                  </>
                )}
              </button>

              {/* Botón agregar nota manual */}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#182359] hover:bg-[#202e75] text-slate-200 border border-indigo-700/60 cursor-pointer transition-colors"
                title="Agregar post-it dictado por participante en Zoom"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Agregar idea</span>
              </button>

              {/* Selector de tema: Lámina original vs Modo Noche */}
              <button
                onClick={() => setTheme((prev) => (prev === 'canvas' ? 'dark' : 'canvas'))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#182359] hover:bg-[#202e75] text-slate-200 border border-indigo-700/60 cursor-pointer transition-colors"
                title="Alternar entre Lámina original Canva y Modo Noche"
              >
                <Palette className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden md:inline">
                  {theme === 'canvas' ? 'Tema Lámina Canva' : 'Tema Nocturno UDP'}
                </span>
              </button>

              {/* Ver lámina de referencia */}
              <button
                onClick={() => setShowOriginalImage((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-[#182359] hover:bg-[#202e75] text-slate-300 border border-indigo-700/60 cursor-pointer transition-colors"
                title="Ver pizarra de diseño original"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden lg:inline">Pizarra original</span>
              </button>

              {/* Modo Proyección Zoom */}
              <button
                onClick={() => setZoomMode(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md cursor-pointer transition-all"
                title="Maximizar tablero para compartir en Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Modo Zoom</span>
              </button>

              {/* Descargar memoria CSV */}
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#182359] hover:bg-[#202e75] text-slate-300 border border-indigo-700/60 cursor-pointer transition-colors"
                title="Descargar todas las ideas del taller en CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>

              {/* Vista participante */}
              <button
                onClick={onGoToParticipantView}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                title="Ver cómo lo ven las participantes"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Ver como participante</span>
              </button>

              {/* Salir */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer transition-colors"
                title="Cerrar sesión de facilitadora"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BARRA DE FASES DEL TALLER (Permite a la facilitadora enfocar una sección según el horario) */}
          <div className="max-w-[1700px] mx-auto mt-2 pt-2 border-t border-indigo-950/70 flex items-center justify-between overflow-x-auto text-xs pb-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-300">Fase del taller:</span>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                Tablero Completo
              </button>
              <button
                onClick={() => setActiveFilter('diagnostico')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === 'diagnostico'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                1. Diagnóstico (Col. 1-4)
              </button>
              <button
                onClick={() => setActiveFilter('priorizacion')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === 'priorizacion'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                2. Priorización (Votos)
              </button>
              <button
                onClick={() => setActiveFilter('ideacion')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === 'ideacion'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                3. Probar algo pequeño
              </button>
              <button
                onClick={() => setActiveFilter('seguimiento')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === 'seguimiento'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                4. Seguir conectadas
              </button>
            </div>
          </div>
        </header>
      )}

      {/* BOTÓN FLOTANTE PARA SALIR DE MODO ZOOM */}
      {zoomMode && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-[#0a0f2e]/90 backdrop-blur-md p-1.5 rounded-2xl border border-indigo-700/60 shadow-xl">
          <button
            onClick={() => setTheme((prev) => (prev === 'canvas' ? 'dark' : 'canvas'))}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Alternar tema"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomMode(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Salir de Modo Zoom</span>
          </button>
        </div>
      )}

      {/* MODAL / OVERLAY DE LA PIZARRA DE DISEÑO ORIGINAL PARA COMPARAR */}
      {showOriginalImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121a45] rounded-3xl p-5 max-w-4xl w-full border border-indigo-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Lámina de Diseño Original del Taller</h3>
                <p className="text-xs text-slate-400">Pizarra de referencia CMEI · Mujeres en Ingeniería UDP</p>
              </div>
              <button
                onClick={() => setShowOriginalImage(false)}
                className="text-slate-400 hover:text-white font-bold text-lg px-2 py-1 rounded-lg bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-indigo-900 bg-white">
              <img
                src="/assets/aistudio/Pizarra_de_taller_CMEI_20261020_204357_0000_39d27d73.png"
                alt="Pizarra de taller CMEI"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR NOTA MANUALMENTE POR LA FACILITADORA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121a45] rounded-3xl p-6 max-w-lg w-full border border-indigo-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <span>Agregar post-it como Facilitadora</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold px-2 py-1 rounded-lg bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sección de destino:
                </label>
                <select
                  value={manualSec}
                  onChange={(e) => setManualSec(e.target.value as SectionId)}
                  className="w-full bg-[#0a0f2e] border border-indigo-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.number ? `${s.number}. ` : ''}{s.title} ({s.question})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Idea dictada o resumen:</span>
                  <span className="font-mono text-[11px] text-slate-400">{manualText.length}/280</span>
                </div>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Escribe la idea aquí..."
                  maxLength={280}
                  rows={3}
                  className="w-full bg-[#0a0f2e] border border-indigo-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!manualText.trim() || isAdding}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
                >
                  {isAdding ? 'Agregando...' : 'Publicar en el tablero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZACIÓN DE LA PIZARRA EN VIVO (ZOOM-READY) */}
      {/* ========================================================= */}
      <main className="flex-1 overflow-y-auto">
        <BoardView
          notes={notes}
          isFacilitator={true}
          onDeleteNote={handleDelete}
          theme={theme}
          zoomMode={zoomMode}
          activeFilter={activeFilter}
        />
      </main>
    </div>
  );
};
