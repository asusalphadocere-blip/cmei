import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Sparkles, Trophy, Lightbulb, Users, Compass } from 'lucide-react';
import type { Note } from '../types.ts';
import { SECTIONS } from '../types.ts';

interface ExecutiveSummaryModalProps {
  notes: Note[];
  onClose: () => void;
  sessionName?: string;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  notes,
  onClose,
  sessionName = 'Taller Mujeres en Ingeniería UDP · CMEI',
}) => {
  const [copied, setCopied] = useState(false);

  // Notas visibles
  const visibleNotes = notes.filter((n) => !n.hidden);

  // Diagnóstico
  const intereses = visibleNotes.filter((n) => n.sec === 'sec1');
  const habilidades = visibleNotes.filter((n) => n.sec === 'sec2');
  const recursos = visibleNotes.filter((n) => n.sec === 'sec3');
  const barreras = visibleNotes.filter((n) => n.sec === 'sec4');

  // Top votados
  const votableSecs = ['sec1', 'sec2', 'sec3', 'sec4'];
  const topVoted = [...visibleNotes]
    .filter((n) => votableSecs.includes(n.sec) && n.votes > 0)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6);

  const totalVotes = visibleNotes
    .filter((n) => votableSecs.includes(n.sec))
    .reduce((sum, n) => sum + (n.votes || 0), 0);

  // Ideatón
  const ideas = visibleNotes.filter((n) => n.sec === 'idea');
  const pruebas = visibleNotes.filter((n) => n.sec === 'prueba');
  const aprender = visibleNotes.filter((n) => n.sec === 'aprender');

  // Seguir conectadas
  const pasos = visibleNotes.filter((n) => n.sec === 'paso');
  const quienes = visibleNotes.filter((n) => n.sec === 'quien');
  const preguntas = visibleNotes.filter((n) => n.sec === 'pregunta');

  // Generador de texto Markdown estructurado para informes
  const generateMarkdownReport = () => {
    const lines = [
      `# Memoria y Síntesis Ejecutiva del Taller`,
      `**Evento:** Escucharnos para construir juntas · Mujeres en Ingeniería UDP · CMEI`,
      `**Sesión:** ${sessionName}`,
      `**Fecha:** ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `**Total ideas aportadas:** ${visibleNotes.length} | **Total votos emitidos:** ${totalVotes}`,
      `\n---\n`,
      `## 1. Priorización Grupal ("Priorizamos juntas")`,
      `Ideas más votadas por las participantes en el diagnóstico:\n`,
    ];

    if (topVoted.length === 0) {
      lines.push(`_No se registraron votos en esta sesión._\n`);
    } else {
      topVoted.forEach((n, idx) => {
        const secMeta = SECTIONS.find((s) => s.id === n.sec);
        lines.push(`${idx + 1}. **[${n.votes} votos]** [${secMeta?.title}]: "${n.text}"`);
      });
      lines.push('');
    }

    lines.push(`## 2. Diagnóstico Colectivo`);
    lines.push(`### A. Intereses (¿Qué nos importa?) [${intereses.length} aportes]`);
    intereses.forEach((n) => lines.push(`- ${n.text} (${n.votes} votos)`));
    lines.push('');

    lines.push(`### B. Habilidades (¿Qué sabemos hacer y qué queremos aprender?) [${habilidades.length} aportes]`);
    habilidades.forEach((n) => lines.push(`- ${n.text} (${n.votes} votos)`));
    lines.push('');

    lines.push(`### C. Recursos y apoyos (¿Con qué contamos o qué necesitamos?) [${recursos.length} aportes]`);
    recursos.forEach((n) => lines.push(`- ${n.text} (${n.votes} votos)`));
    lines.push('');

    lines.push(`### D. Barreras (¿Qué nos dificulta avanzar?) [${barreras.length} aportes]`);
    barreras.forEach((n) => lines.push(`- ${n.text} (${n.votes} votos)`));
    lines.push('');

    lines.push(`## 3. Ideatón Rápida: "Probar algo pequeño"`);
    lines.push(`- **Ideas y Beneficiarias:** ${ideas.map((n) => n.text).join(' | ') || 'Sin registros'}`);
    lines.push(`- **Pruebas y Experimentos Viables:** ${pruebas.map((n) => n.text).join(' | ') || 'Sin registros'}`);
    lines.push(`- **Métricas de Aprendizaje:** ${aprender.map((n) => n.text).join(' | ') || 'Sin registros'}`);
    lines.push('');

    lines.push(`## 4. Compromisos y Continuidad ("Seguir conectadas")`);
    lines.push(`- **Próximos pasos voluntarios:** ${pasos.map((n) => n.text).join(' | ') || 'Sin registros'}`);
    lines.push(`- **Voluntades de aporte:** ${quienes.map((n) => n.text).join(' | ') || 'Sin registros'}`);
    lines.push(`- **Preguntas abiertas y reflexiones:** ${preguntas.map((n) => n.text).join(' | ') || 'Sin registros'}`);
    lines.push('');

    lines.push(`---\n*Generado automáticamente por la plataforma colaborativa CMEI UDP.*`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleDownloadMD = () => {
    const text = generateMarkdownReport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resumen_Ejecutivo_CMEI_UDP_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#121a45] rounded-3xl max-w-4xl w-full border border-indigo-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-[#182359] border-b border-indigo-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Resumen Ejecutivo e Informe del Taller
              </h2>
              <p className="text-xs text-cyan-300">
                Síntesis categorizada para reportes, minutas y toma de decisiones
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

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#0a0f2e] border border-indigo-900/60 text-center">
              <div className="text-2xl font-black text-cyan-400">{visibleNotes.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Ideas totales</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0a0f2e] border border-indigo-900/60 text-center">
              <div className="text-2xl font-black text-violet-400">{totalVotes}</div>
              <div className="text-[11px] text-slate-400 font-medium">Votos de prioridad</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0a0f2e] border border-indigo-900/60 text-center">
              <div className="text-2xl font-black text-amber-400">{barreras.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Barreras identificadas</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0a0f2e] border border-indigo-900/60 text-center">
              <div className="text-2xl font-black text-emerald-400">{pasos.length + quienes.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Compromisos activos</div>
            </div>
          </div>

          {/* 1. TOP PRIORIDADES */}
          <div className="p-4 rounded-2xl bg-[#0a0f2e] border border-indigo-900 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Trophy className="w-4 h-4" />
              <span>Prioridades Más Votadas por las Participantes</span>
            </div>
            {topVoted.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay votos registrados aún.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topVoted.map((n, idx) => {
                  const secMeta = SECTIONS.find((s) => s.id === n.sec);
                  return (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-[#141d4f] border border-indigo-800/60 flex items-start gap-2.5 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-cyan-300 font-semibold block">
                          {secMeta?.title} ({n.votes} votos)
                        </span>
                        <p className="text-slate-100 font-medium mt-0.5 leading-snug">{n.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. DIAGNÓSTICO EN 4 EJES */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Diagnóstico Colectivo por Ejes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0a0f2e] border border-indigo-950 space-y-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>1. Intereses ({intereses.length})</span>
                </span>
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
                  {intereses.slice(0, 5).map((n) => (
                    <li key={n.id} className="truncate">{n.text}</li>
                  ))}
                  {intereses.length > 5 && (
                    <li className="text-slate-500 italic">+ {intereses.length - 5} más</li>
                  )}
                  {intereses.length === 0 && <li className="text-slate-500 italic">Sin aportes</li>}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a0f2e] border border-indigo-950 space-y-2">
                <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                  <span>2. Habilidades ({habilidades.length})</span>
                </span>
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
                  {habilidades.slice(0, 5).map((n) => (
                    <li key={n.id} className="truncate">{n.text}</li>
                  ))}
                  {habilidades.length > 5 && (
                    <li className="text-slate-500 italic">+ {habilidades.length - 5} más</li>
                  )}
                  {habilidades.length === 0 && <li className="text-slate-500 italic">Sin aportes</li>}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a0f2e] border border-indigo-950 space-y-2">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <span>3. Recursos y apoyos ({recursos.length})</span>
                </span>
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
                  {recursos.slice(0, 5).map((n) => (
                    <li key={n.id} className="truncate">{n.text}</li>
                  ))}
                  {recursos.length > 5 && (
                    <li className="text-slate-500 italic">+ {recursos.length - 5} más</li>
                  )}
                  {recursos.length === 0 && <li className="text-slate-500 italic">Sin aportes</li>}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a0f2e] border border-indigo-950 space-y-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span>4. Barreras identificadas ({barreras.length})</span>
                </span>
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
                  {barreras.slice(0, 5).map((n) => (
                    <li key={n.id} className="truncate">{n.text}</li>
                  ))}
                  {barreras.length > 5 && (
                    <li className="text-slate-500 italic">+ {barreras.length - 5} más</li>
                  )}
                  {barreras.length === 0 && <li className="text-slate-500 italic">Sin aportes</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* 3. PROBAR ALGO PEQUEÑO & COMPROMISOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0a0f2e] border border-indigo-950 space-y-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Ideatón: Experimentos Viables ({ideas.length + pruebas.length})</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pruebas.length > 0
                  ? pruebas.map((p) => p.text).join(' • ')
                  : 'Aún no se han formulado experimentos pequeños.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a0f2e] border border-indigo-950 space-y-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Próximos Pasos Voluntarios ({pasos.length})</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pasos.length > 0
                  ? pasos.map((p) => p.text).join(' • ')
                  : 'Sin compromisos registrados.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer con botones de descarga y copia */}
        <div className="px-6 py-4 bg-[#182359] border-t border-indigo-900/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Formato listo para informes de decanatura, dirección y CMEI.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#141d4f] hover:bg-[#1a266b] text-cyan-300 border border-cyan-500/40 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar texto formateado</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMD}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 shadow-md cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Informe (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
