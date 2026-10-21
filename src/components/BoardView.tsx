import React from 'react';
import type { Note, SectionId } from '../types.ts';
import { SECTIONS } from '../types.ts';
import { PostIt } from './PostIt.tsx';
import { Sparkles, Trophy, Users } from 'lucide-react';

interface BoardViewProps {
  notes: Note[];
  isFacilitator?: boolean;
  onDeleteNote?: (noteId: string) => void;
  theme?: 'canvas' | 'dark';
  zoomMode?: boolean;
  activeFilter?: 'all' | 'diagnostico' | 'priorizacion' | 'ideacion' | 'seguimiento';
}

export const BoardView: React.FC<BoardViewProps> = ({
  notes,
  isFacilitator = false,
  onDeleteNote,
  theme = 'canvas',
  zoomMode = false,
  activeFilter = 'all',
}) => {
  // Notas agrupadas por sección
  const notesBySec = (secId: SectionId) => notes.filter((n) => n.sec === secId);

  // Notas más votadas de las columnas 1 a 4 (Diagnóstico) para "Priorizamos juntas"
  const votableSecIds: SectionId[] = ['sec1', 'sec2', 'sec3', 'sec4'];
  const topVotedNotes = [...notes]
    .filter((n) => votableSecIds.includes(n.sec) && n.votes > 0)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6);

  // Total de votos emitidos en columnas 1-4
  const totalVotesCount = notes
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
    <div className={`w-full transition-colors duration-300 ${containerBg} ${zoomMode ? 'p-2 sm:p-4 text-base' : 'p-3 sm:p-6 text-sm'}`}>
      <div className="max-w-[1700px] mx-auto space-y-4 sm:space-y-6">

        {/* ========================================================= */}
        {/* ENCABEZADO DE LA PIZARRA (Idéntico a la lámina del taller) */}
        {/* ========================================================= */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-indigo-500/20">
          <div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${titleClass} flex items-center gap-3`}>
              <span>Escucharnos para construir juntas</span>
              {isDark && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-400 to-violet-500 text-black">
                  UDP · CMEI
                </span>
              )}
            </h1>
            <p className={`text-sm sm:text-base mt-1 font-medium ${subtitleClass}`}>
              Taller participativo · CMEI · Mujeres en Ingeniería UDP
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium border shadow-xs ${
              isDark
                ? 'bg-[#182359] border-cyan-400/30 text-cyan-200'
                : 'bg-[#f2ebf7] border-[#d8c8e8] text-[#3f2f5c]'
            }`}>
              Escribe una idea por post-it. Comparte solo lo que quieras contar
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* FILA 1: CUATRO COLUMNAS (1 Intereses, 2 Habilidades, 3 Recursos, 4 Barreras) */}
        {/* ========================================================= */}
        {(activeFilter === 'all' || activeFilter === 'diagnostico') && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {SECTIONS.filter((s) => s.category === 'diagnostico').map((sec) => {
                const secNotes = notesBySec(sec.id);
                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl flex flex-col min-h-[300px] lg:min-h-[380px] overflow-hidden transition-all duration-200 ${cardBg}`}
                  >
                    {/* Header de columna con número oscuro idéntico a la lámina */}
                    <div className={`px-4 py-3 flex items-start gap-3 border-b ${headerCardBg}`}>
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1e1338] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {sec.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-bold leading-tight tracking-tight">
                          {sec.title}
                        </h2>
                        <p className={`text-xs mt-0.5 ${questionClass}`}>
                          {sec.question}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-black/10">
                        {secNotes.length}
                      </span>
                    </div>

                    {/* Contenedor de Post-its */}
                    <div className="p-3.5 flex-1 overflow-y-auto space-y-3">
                      {secNotes.length === 0 ? (
                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-slate-400/25 text-slate-400">
                          <div className="w-16 h-16 rounded-md bg-[#ffe48a]/30 border border-[#e6c86e]/50 flex items-center justify-center text-[#554009] text-xs font-medium rotate-[-2deg] mb-2 shadow-xs">
                            Escribe aquí...
                          </div>
                          <p className="text-xs opacity-75">Esperando ideas en vivo</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {secNotes.map((note, index) => (
                            <PostIt
                              key={note.id}
                              note={note}
                              index={index}
                              isFacilitator={isFacilitator}
                              onDelete={onDeleteNote}
                              theme={theme}
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
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* BLOQUE IZQUIERDO: Priorizamos juntas (5 columnas de ancho en desktop) */}
          {(activeFilter === 'all' || activeFilter === 'priorizacion') && (
            <div className={`rounded-2xl flex flex-col min-h-[340px] overflow-hidden ${cardBg} ${
              activeFilter === 'priorizacion' ? 'lg:col-span-12' : 'lg:col-span-5'
            }`}>
              <div className={`px-4 py-3 flex items-center justify-between border-b ${headerCardBg}`}>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base sm:text-lg font-bold">Priorizamos juntas</h2>
                </div>
                <div className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-600/20 text-indigo-300">
                  {totalVotesCount} {totalVotesCount === 1 ? 'voto total' : 'votos totales'}
                </div>
              </div>

              {/* Subdivisión idéntica a la lámina: Agrupamos ideas aquí | Vota por 2 temas */}
              <div className="p-3.5 flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Agrupamos ideas aquí */}
                <div className="sm:col-span-8 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                      Agrupamos ideas aquí
                    </span>
                    <span className="text-[11px] opacity-65">Top más votados</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {topVotedNotes.length === 0 ? (
                      <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-slate-400/25 text-slate-400">
                        <Sparkles className="w-6 h-6 mb-1 text-amber-400/60 animate-pulse" />
                        <p className="text-xs">Los post-its con votos de las columnas 1 a 4 aparecerán aquí en vivo</p>
                      </div>
                    ) : (
                      topVotedNotes.map((note, index) => (
                        <div key={note.id} className="relative">
                          <div className="absolute -left-2 top-2 z-10 w-5 h-5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] flex items-center justify-center shadow-md">
                            {index + 1}
                          </div>
                          <div className="pl-3">
                            <PostIt
                              note={note}
                              index={index}
                              isFacilitator={isFacilitator}
                              onDelete={onDeleteNote}
                              theme={theme}
                              compact={true}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Vota por 2 temas con matriz de círculos de votación */}
                <div className={`sm:col-span-4 rounded-xl p-3 flex flex-col items-center justify-between border-l sm:border-l-0 ${innerCardBg}`}>
                  <div className="text-center w-full">
                    <h3 className="text-xs font-bold leading-tight">Vota por 2 temas</h3>
                    <p className="text-[10px] opacity-70 mt-0.5">Stickers de voto</p>
                  </div>

                  {/* Matriz gráfica de 5 columnas x 6 filas idéntica a la lámina de taller */}
                  <div className="grid grid-cols-5 gap-1.5 my-2.5">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const isFilled = i < totalVotesCount;
                      return (
                        <div
                          key={i}
                          title={isFilled ? `Voto emitido #${i + 1}` : 'Voto disponible'}
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 flex items-center justify-center ${
                            isFilled
                              ? 'bg-gradient-to-tr from-cyan-400 to-violet-500 scale-105 shadow-xs border border-white/50 text-[9px] text-slate-900 font-black'
                              : isDark
                              ? 'border-2 border-indigo-400/30 bg-transparent'
                              : 'border-2 border-[#bca9d6] bg-white/60'
                          }`}
                        >
                          {isFilled && <span className="opacity-90">✓</span>}
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

          {/* BLOQUE DERECHO: Probar algo pequeño (3 columnas: Idea, Prueba, Aprender) */}
          {(activeFilter === 'all' || activeFilter === 'ideacion') && (
            <div className={`rounded-2xl flex flex-col min-h-[340px] overflow-hidden ${cardBg} ${
              activeFilter === 'ideacion' ? 'lg:col-span-12' : 'lg:col-span-7'
            }`}>
              <div className={`px-4 py-3 flex items-center justify-between border-b ${headerCardBg}`}>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold">Probar algo pequeño</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-black/10">
                    Ideatón rápida
                  </span>
                </div>
              </div>

              {/* 3 Columnas interiores: Idea | Prueba | Aprender con separadores verticales */}
              <div className="p-3.5 flex-1 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {SECTIONS.filter((s) => s.category === 'ideacion').map((sec) => {
                  const secNotes = notesBySec(sec.id);
                  return (
                    <div
                      key={sec.id}
                      className={`rounded-xl p-3 flex flex-col h-full ${innerCardBg}`}
                    >
                      <div className="text-center pb-2.5 border-b border-slate-500/15 mb-2">
                        <h3 className="text-sm font-bold leading-tight">{sec.title}</h3>
                        <p className={`text-xs mt-0.5 ${questionClass}`}>{sec.question}</p>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[120px]">
                        {secNotes.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center p-3 text-slate-400 text-xs italic">
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
        {/* FILA 3: "Seguir conectadas" (3 Cajas horizontales) */}
        {/* ========================================================= */}
        {(activeFilter === 'all' || activeFilter === 'seguimiento') && (
          <section className={`rounded-2xl overflow-hidden ${cardBg}`}>
            <div className={`px-4 py-3 flex items-center justify-between border-b ${headerCardBg}`}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base sm:text-lg font-bold">Seguir conectadas</h2>
              </div>
              <span className="text-xs opacity-75">Compromisos y próximos pasos</span>
            </div>

            {/* 3 Cajas horizontales idénticas a la lámina inferior */}
            <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {SECTIONS.filter((s) => s.category === 'seguimiento').map((sec) => {
                const secNotes = notesBySec(sec.id);
                return (
                  <div
                    key={sec.id}
                    className={`rounded-xl p-3.5 flex flex-col min-h-[160px] ${innerCardBg}`}
                  >
                    <div className="pb-2 border-b border-slate-500/15 mb-2">
                      <h3 className="text-xs sm:text-sm font-bold leading-snug">{sec.title}</h3>
                      <p className={`text-[11px] mt-0.5 ${questionClass}`}>{sec.subtitle}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5">
                      {secNotes.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
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
