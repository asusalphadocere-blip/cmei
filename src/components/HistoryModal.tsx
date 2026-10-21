import React, { useState } from 'react';
import {
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Download,
  FileText,
  AlertTriangle,
  Clock,
  Check,
  Plus,
} from 'lucide-react';
import type { HistorySession, Note } from '../types.ts';
import { SECTIONS } from '../types.ts';
import {
  archiveCurrentSession,
  restoreArchivedSession,
  deleteHistorySession,
} from '../lib/firebase.ts';

interface HistoryModalProps {
  currentNotes: Note[];
  historySessions: HistorySession[];
  onClose: () => void;
  onOpenSummaryForSession?: (notes: Note[], sessionName: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  currentNotes,
  historySessions,
  onClose,
  onOpenSummaryForSession,
}) => {
  const [sessionName, setSessionName] = useState(
    `Taller CMEI - ${new Date().toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`
  );
  const [isArchiving, setIsArchiving] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentNotes.length === 0) {
      setFeedbackMsg('El tablero actual está vacío; no hay datos para archivar.');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }

    setIsArchiving(true);
    try {
      await archiveCurrentSession(sessionName, currentNotes);
      setFeedbackMsg('¡Sesión archivada con éxito! El tablero actual quedó limpio para nueva sesión.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error('Error al archivar sesión:', err);
      setFeedbackMsg('Error al archivar la sesión: ' + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (session: HistorySession) => {
    try {
      await restoreArchivedSession(session.notes);
      setConfirmRestoreId(null);
      setFeedbackMsg(`¡Sesión "${session.name}" restaurada con éxito al tablero en vivo!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error('Error al restaurar sesión:', err);
      setFeedbackMsg('Error al restaurar: ' + err.message);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteHistorySession(sessionId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Error al eliminar sesión histórica:', err);
    }
  };

  const handleExportSessionCSV = (session: HistorySession) => {
    const headers = ['ID', 'Sección', 'Título Sección', 'Votos', 'Fecha', 'Texto'];
    const rows = session.notes.map((n) => {
      const secMeta = SECTIONS.find((s) => s.id === n.sec);
      const dateStr = new Date(n.ts).toLocaleString('es-CL');
      return [
        `"${n.id}"`,
        `"${n.sec}"`,
        `"${secMeta?.title || ''}"`,
        n.votes || 0,
        `"${dateStr}"`,
        `"${n.text.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historico_${session.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#121a45] rounded-3xl max-w-4xl w-full border border-indigo-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-[#182359] border-b border-indigo-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Historial de Sesiones y Archivo
              </h2>
              <p className="text-xs text-cyan-300">
                Pasa datos actuales a históricos, limpia el tablero y recupera sesiones anteriores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-lg px-2.5 py-1 rounded-xl bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Notificación de feedback */}
        {feedbackMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-indigo-950/90 border border-cyan-400/50 text-cyan-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* SECCIÓN 1: ARCHIVAR SESIÓN ACTUAL */}
          <div className="p-4 rounded-2xl bg-[#0a0f2e] border border-indigo-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Archivar sesión actual ({currentNotes.length} ideas activas)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Guarda una copia y vacía el tablero para el siguiente grupo
              </span>
            </div>

            <form onSubmit={handleArchive} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Nombre descriptivo de la sesión..."
                className="flex-1 bg-[#141d4f] border border-indigo-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                required
              />
              <button
                type="submit"
                disabled={isArchiving || currentNotes.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isArchiving ? 'Archivando...' : 'Archivar y Limpiar Tablero'}</span>
              </button>
            </form>
          </div>

          {/* SECCIÓN 2: LISTA DE SESIONES HISTÓRICAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sesiones Archivadas en Histórico ({historySessions.length})
              </h3>
            </div>

            {historySessions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0a0f2e]/60 border border-dashed border-indigo-950 text-center text-slate-400 text-xs">
                No hay sesiones en el histórico todavía. Al hacer clic en "Archivar y Limpiar Tablero", las sesiones guardadas aparecerán aquí para ser consultadas o recuperadas.
              </div>
            ) : (
              <div className="space-y-3">
                {historySessions.map((session) => {
                  const dateStr = new Date(session.createdAt).toLocaleString('es-CL', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-2xl bg-[#0a0f2e] border border-indigo-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{session.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-600/30 text-indigo-300">
                            {session.totalNotes} ideas
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-600/30 text-violet-300">
                            {session.totalVotes} votos
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-indigo-950">
                        {/* RESTAURAR AL TABLERO EN VIVO */}
                        {confirmRestoreId === session.id ? (
                          <div className="flex items-center gap-1 bg-amber-950 text-white text-[11px] p-1 rounded-xl border border-amber-600">
                            <span>¿Reemplazar tablero actual?</span>
                            <button
                              onClick={() => handleRestore(session)}
                              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-2 py-0.5 rounded-lg cursor-pointer"
                            >
                              Sí, restaurar
                            </button>
                            <button
                              onClick={() => setConfirmRestoreId(null)}
                              className="bg-black/30 px-1.5 py-0.5 rounded-lg cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestoreId(session.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                            title="Cargar todas las notas de esta sesión histórica al tablero en vivo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar al tablero</span>
                          </button>
                        )}

                        {/* VER RESUMEN EJECUTIVO */}
                        {onOpenSummaryForSession && (
                          <button
                            onClick={() => onOpenSummaryForSession(session.notes, session.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141d4f] hover:bg-[#1b2668] text-cyan-300 text-xs font-medium cursor-pointer transition-colors"
                            title="Ver informe y resumen de esta sesión"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Resumen</span>
                          </button>
                        )}

                        {/* DESCARGAR CSV */}
                        <button
                          onClick={() => handleExportSessionCSV(session)}
                          className="p-1.5 rounded-xl bg-[#141d4f] hover:bg-[#1b2668] text-emerald-400 cursor-pointer transition-colors"
                          title="Descargar CSV de esta sesión"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* ELIMINAR DEL HISTORIAL */}
                        {confirmDeleteId === session.id ? (
                          <div className="flex items-center gap-1 bg-rose-950 text-white text-[10px] p-1 rounded-xl">
                            <span>¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-black/30 px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(session.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer transition-colors"
                            title="Eliminar esta sesión histórica"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#182359] border-t border-indigo-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
