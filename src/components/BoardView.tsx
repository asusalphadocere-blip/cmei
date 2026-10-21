import React from 'react';
import type { Note, SectionId } from '../types.ts';
import { SECTIONS } from '../types.ts';
import { PostIt } from './PostIt.tsx';
import { Sparkles, Trophy, Users, Lightbulb, Compass } from 'lucide-react';

interface BoardViewProps {
  notes: Note[];
  isFacilitator?: boolean;
  onDeleteNote?: (noteId: string) => void;
  onToggleHideNote?: (noteId: string, currentHidden: boolean) => void;
  onBanAuthor?: (authorId: string) => void;
  theme?: 'canvas' | 'dark';
  zoomMode?: boolean;
  activeFilter?: 'all' | 'diagnostico' | 'priorizacion' | 'ideacion' | 'seguimiento';
}

export const BoardView: React.FC<BoardViewProps> = ({
  notes,
  isFacilitator = false,
  onDeleteNote,
  onToggleHideNote,
  onBanAuthor,
  theme = 'canvas',
  zoomMode = false,
  activeFilter = 'all',
}) => {
  // Para participantes comunes, las notas ocultas se excluyen del tablero
  const displayNotes = isFacilitator ? notes : notes.filter((n) => !n.hidden);

  // Notas agrupadas por sección
  const notesBySec = (secId: SectionId) => displayNotes.filter((n) => n.sec === secId);

  // Notas más votadas de las columnas 1 a 4 (Diagnóstico) para "Priorizamos juntas"
  const votableSecIds: SectionId[] = ['sec1', 'sec2', 'sec3', 'sec4'];
  const topVotedNotes = [...displayNotes]
    .filter((n) => votableSecIds.includes(n.sec) && n.votes > 0)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6);

  // Total de votos emitidos en columnas 1-4
  const totalVotesCount = displayNotes
    .filter((n) => votableSecIds.includes(n.sec))
    .reduce((acc, curr) => acc + (curr.votes || 0), 0);

  // Configuración de estilo según tema
  const isDark = theme === 'dark';

  const containerBg = isDark
    ? 'bg-[#0a0f2e] text-slate-100'
    : 'bg-[#faf8f5] text-[#1c142c]';

  const cardBg = isDark
    ? 'bg-[#121a45]/90 border border-indigo-900/40 shadow-xl'
    : 'bg-[#f4effa] border border-[#e3d7f0] shadow-sm';

  const headerCardBg = isDark
    ? 'bg-[#182359] text-white'
    : 'bg-[#ebe2f5] text-[#2c1d47]';

  const innerCardBg = isDark
    ? 'bg-[#0d1438]/80 border border-indigo-950/60'
    : 'bg-[#fcfbfe] border border-[#e8dff3]';

  const titleClass = isDark
    ? 'text-white'
    : 'text-[#201538]';

  const subtitleClass = isDark
    ? 'text-cyan-300 font-medium'
    : 'text-[#4d3c6e] font-medium';

  const questionClass = isDark
    ? 'text-slate-300'
    : 'text-[#5f507b]';

  return (
    <div
      className={`w-full transition-colors duration-300 ${containerBg} ${
        zoomMode
          ? 'p-2 sm:p-4 text-base'
          : 'p-2.5 sm:p-4 md:p-5 lg:p-6 text-sm'
      }`}
    >
      <div className="max-w-[1700px] mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ========================================================= */}
        {/* ENCABEZADO DE LA PIZARRA (Idéntico a la lámina del taller) */}
        {/* ========================================================= */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 pb-2 border-b border-indigo-500/20">
          <div>
            <h1
              className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight ${titleClass} flex items-center gap-2 sm:gap-3 flex-wrap`}
            >
              <span>Escucharnos para construir juntas</span>
              {isDark && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-cyan-400 to-violet-500 text-black">
                  UDP · CMEI
                </span>
              )}
            </h1>
            <p className={`text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 font-medium ${subtitleClass}`}>
              Taller participativo · CMEI · Mujeres en Ingeniería UDP
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-[11px] sm:text-xs md:text-sm font-medium border shadow-xs leading-snug ${
                isDark
                  ? 'bg-[#182359] border-cyan-400/30 text-cyan-200'
                  : 'bg-[#f2ebf7] border-[#d8c8e8] text-[#3f2f5c]'
              }`}
            >
              Escribe una idea por post-it. Comparte solo lo que quieras contar
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* FILA 1: CUATRO COLUMNAS (Optimizado para Tablet 2x2 y Desktop 4 col) */}
        {/* ========================================================= */}
        {(activeFilter === 'all' || activeFilter === 'diagnostico') && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {SECTIONS.filter((s) => s.category === 'diagnostico').map((sec) => {
                const secNotes = notesBySec(sec.id);
                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl flex flex-col min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] max-h-[480px] overflow-hidden transition-all duration-200 ${cardBg}`}
                  >
                    {/* Header de columna con número oscuro */}
                    <div className={`px-3 sm:px-4 py-2.5 sm:py-3 flex items-start gap-2.5 sm:gap-3 border-b ${headerCardBg}`}>
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1e1338] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
                        {sec.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm sm:text-base font-bold leading-tight tracking-tight">
                          {sec.title}
                        </h2>
                        <p className={`text-[11px] sm:text-xs mt-0.5 leading-snug ${questionClass}`}>
                          {sec.question}
                        </p>
                      </div>
                      <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-semibold bg-black/10 flex-shrink-0">
                        {secNotes.length}
                      </span>
                    </div>

                    {/* Contenedor de Post-its */}
                    <div className="p-2.5 sm:p-3 flex-1 overflow-y-auto space-y-2.5">
                      {secNotes.length === 0 ? (
                        <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-slate-400/25 text-slate-400">
                          <div className="w-14 h-14 rounded-md bg-[#ffe48a]/30 border border-[#e6c86e]/50 flex items-center justify-center text-[#554009] text-[11px] font-medium rotate-[-2deg] mb-1.5 shadow-xs">
                            Escribe aquí...
                          </div>
                          <p className="text-[11px] opacity-75">Esperando ideas en vivo</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {secNotes.map((note, index) => (
                            <PostIt
                              key={note.id}
                              note={note}
                              index={index}
                              isFacilitator={isFacilitator}
                              onDelete={onDeleteNote}
                              onToggleHide={onToggleHideNote}
                              onBanAuthor={onBanAuthor}
                              theme={theme}
                              compact={true}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* FILA 2: DOS BLOQUES: "Priorizamos juntas" + "Probar algo pequeño" */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4">
          {/* BLOQUE IZQUIERDO: Priorizamos juntas */}
          {(activeFilter === 'all' || activeFilter === 'priorizacion') && (
            <div
              className={`rounded-2xl flex flex-col min-h-[280px] overflow-hidden ${cardBg} ${
                activeFilter === 'priorizacion' ? 'xl:col-span-12' : 'xl:col-span-5'
              }`}
            >
              <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b ${headerCardBg}`}>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <h2 className="text-sm sm:text-base md:text-lg font-bold">Priorizamos juntas</h2>
                </div>
                <div className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-600/20 text-indigo-300">
                  {totalVotesCount} {totalVotesCount === 1 ? 'voto total' : 'votos totales'}
                </div>
              </div>

              {/* Subdivisión: Agrupamos ideas aquí | Vota por 2 temas */}
              <div className="p-3 sm:p-3.5 flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Agrupamos ideas aquí */}
                <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 flex flex-col min-h-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider opacity-80">
                      Agrupamos ideas aquí
                    </span>
                    <span className="text-[10px] sm:text-[11px] opacity-65">Top más votados</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
                    {topVotedNotes.length === 0 ? (
                      <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-slate-400/25 text-slate-400">
                        <Sparkles className="w-5 h-5 mb-1 text-amber-400/60 animate-pulse" />
                        <p className="text-[11px]">Los post-its más votados de las columnas 1 a 4 aparecerán aquí</p>
                      </div>
                    ) : (
                      topVotedNotes.map((note, index) => (
                        <div key={note.id} className="relative">
                          <div className="absolute -left-2 top-2 z-10 w-4.5 h-4.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center shadow-md">
                            {index + 1}
                          </div>
                          <div className="pl-2.5">
                            <PostIt
                              note={note}
                              index={index}
                              isFacilitator={isFacilitator}
                              onDelete={onDeleteNote}
                              onToggleHide={onToggleHideNote}
                              onBanAuthor={onBanAuthor}
                              theme={theme}
                              compact={true}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Vota por 2 temas con matriz flexible y responsive */}
                <div
                  className={`md:col-span-5 lg:col-span-5 xl:col-span-4 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-between border-t md:border-t-0 md:border-l ${innerCardBg}`}
                >
                  <div className="text-center w-full">
                    <h3 className="text-xs font-bold leading-tight">Vota por 2 temas</h3>
                    <p className="text-[10px] opacity-70 mt-0.5">Stickers de voto</p>
                  </div>

                  {/* Matriz gráfica de votación con wrap fluido */}
                  <div className="flex flex-wrap justify-center content-center gap-1.5 max-w-[200px] my-2">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const isFilled = i < totalVotesCount;
                      return (
                        <div
                          key={i}
                          title={isFilled ? `Voto emitido #${i + 1}` : 'Voto disponible'}
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                            isFilled
                              ? 'bg-gradient-to-tr from-cyan-400 to-violet-500 scale-105 shadow-xs border border-white/50 text-[8px] text-slate-900 font-black'
                              : isDark
                              ? 'border-2 border-indigo-400/30 bg-transparent'
                              : 'border-2 border-[#bca9d6] bg-white/60'
                          }`}
                        >
                          {isFilled && <span>✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center text-[10px] opacity-80">
                    <span className="font-bold text-cyan-400">{totalVotesCount}</span> stickers emitidos
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BLOQUE DERECHO: Probar algo pequeño */}
          {(activeFilter === 'all' || activeFilter === 'ideacion') && (
            <div
              className={`rounded-2xl flex flex-col min-h-[280px] overflow-hidden ${cardBg} ${
                activeFilter === 'ideacion' ? 'xl:col-span-12' : 'xl:col-span-7'
              }`}
            >
              <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b ${headerCardBg}`}>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  <h2 className="text-sm sm:text-base md:text-lg font-bold">Probar algo pequeño</h2>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold bg-black/10">
                    Ideatón rápida
                  </span>
                </div>
              </div>

              {/* 3 Columnas interiores responsive */}
              <div className="p-3 sm:p-3.5 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {SECTIONS.filter((s) => s.category === 'ideacion').map((sec) => {
                  const secNotes = notesBySec(sec.id);
                  return (
                    <div
                      key={sec.id}
                      className={`rounded-xl p-2.5 sm:p-3 flex flex-col h-full min-h-[140px] max-h-[380px] ${innerCardBg}`}
                    >
                      <div className="text-center pb-2 border-b border-slate-500/15 mb-2">
                        <h3 className="text-xs sm:text-sm font-bold leading-tight">{sec.title}</h3>
                        <p className={`text-[10px] sm:text-[11px] mt-0.5 leading-snug line-clamp-2 ${questionClass}`}>
                          {sec.question}
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 min-h-[90px]">
                        {secNotes.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center p-2 text-slate-400 text-[11px] italic">
                            Escribe aquí...
                          </div>
                        ) : (
                          secNotes.map((note, index) => (
                            <PostIt
                              key={note.id}
                              note={note}
                              index={index}
                              isFacilitator={isFacilitator}
                              onDelete={onDeleteNote}
                              onToggleHide={onToggleHideNote}
                              onBanAuthor={onBanAuthor}
                              theme={theme}
                              compact={true}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* FILA 3: "Seguir conectadas" (3 Cajas horizontales responsive) */}
        {/* ========================================================= */}
        {(activeFilter === 'all' || activeFilter === 'seguimiento') && (
          <section className={`rounded-2xl overflow-hidden ${cardBg}`}>
            <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b ${headerCardBg}`}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                <h2 className="text-sm sm:text-base md:text-lg font-bold">Seguir conectadas</h2>
              </div>
              <span className="text-[11px] sm:text-xs opacity-75">Compromisos y próximos pasos</span>
            </div>

            {/* 3 Cajas horizontales responsive */}
            <div className="p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {SECTIONS.filter((s) => s.category === 'seguimiento').map((sec) => {
                const secNotes = notesBySec(sec.id);
                return (
                  <div
                    key={sec.id}
                    className={`rounded-xl p-2.5 sm:p-3.5 flex flex-col min-h-[130px] sm:min-h-[150px] max-h-[350px] ${innerCardBg}`}
                  >
                    <div className="pb-2 border-b border-slate-500/15 mb-2">
                      <h3 className="text-xs sm:text-sm font-bold leading-snug">{sec.title}</h3>
                      <p className={`text-[10px] sm:text-[11px] mt-0.5 line-clamp-2 ${questionClass}`}>
                        {sec.subtitle}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {secNotes.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">
                          Espacio abierto para aportes...
                        </div>
                      ) : (
                        secNotes.map((note, index) => (
                          <PostIt
                            key={note.id}
                            note={note}
                            index={index}
                            isFacilitator={isFacilitator}
                            onDelete={onDeleteNote}
                            onToggleHide={onToggleHideNote}
                            onBanAuthor={onBanAuthor}
                            theme={theme}
                            compact={true}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
