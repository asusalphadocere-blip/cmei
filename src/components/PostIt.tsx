import React, { useState } from 'react';
import { Trash2, Heart, Check, Eye, EyeOff, Ban, Undo2, User } from 'lucide-react';
import type { Note } from '../types.ts';
import { getPostitColor } from '../types.ts';

interface PostItProps {
  note: Note;
  index: number;
  isFacilitator?: boolean;
  isMyNote?: boolean;
  onDelete?: (noteId: string) => void;
  onToggleHide?: (noteId: string, currentHidden: boolean) => void;
  onBanAuthor?: (authorId: string) => void;
  onVote?: (noteId: string) => void;
  onUnvote?: (noteId: string) => void;
  hasVoted?: boolean;
  canVote?: boolean;
  votingOpen?: boolean;
  theme?: 'canvas' | 'dark';
  compact?: boolean;
}

export const PostIt: React.FC<PostItProps> = ({
  note,
  index,
  isFacilitator = false,
  isMyNote = false,
  onDelete,
  onToggleHide,
  onBanAuthor,
  onVote,
  onUnvote,
  hasVoted = false,
  canVote = false,
  votingOpen = true,
  theme = 'canvas',
  compact = false,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const color = getPostitColor(index);

  // Rotación orgánica sutil
  const rotationDegrees = ((index % 5) - 2) * 0.8;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showConfirmDelete) {
      if (onDelete) onDelete(note.id);
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
    }
  };

  const handleBan = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.authorId) return;
    if (showConfirmBan) {
      if (onBanAuthor) onBanAuthor(note.authorId);
      setShowConfirmBan(false);
    } else {
      setShowConfirmBan(true);
    }
  };

  const isHidden = note.hidden === true;

  return (
    <div
      style={{
        backgroundColor: color.bg,
        color: color.text,
        transform: `rotate(${rotationDegrees}deg)`,
      }}
      className={`group relative rounded-md shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between border ${
        theme === 'dark' ? 'border-black/10' : 'border-[#d0b865]/40'
      } ${compact ? 'p-2.5 min-h-[90px]' : 'p-3.5 min-h-[110px]'} ${
        isHidden ? 'opacity-60 ring-2 ring-amber-500/80 dashed' : ''
      }`}
    >
      {/* BADGE SI ESTÁ OCULTO */}
      {isHidden && (
        <div className="absolute -top-2 left-2 z-10 bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <EyeOff className="w-2.5 h-2.5" />
          <span>Oculto al público</span>
        </div>
      )}

      {/* BADGE DE IDEA PROPIA (PARA PARTICIPANTE) */}
      {!isFacilitator && isMyNote && (
        <div className="absolute -top-2 left-2 z-10 bg-indigo-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <User className="w-2.5 h-2.5" />
          <span>Tu idea</span>
        </div>
      )}

      {/* ACCIONES SUPERIORES */}
      <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
        {/* MODERACIÓN FACILITADORA */}
        {isFacilitator && (
          <>
            {/* Ocultar / Mostrar */}
            {onToggleHide && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHide(note.id, isHidden);
                }}
                className={`p-1 rounded-full cursor-pointer transition-colors ${
                  isHidden
                    ? 'bg-amber-600 text-white'
                    : 'opacity-0 group-hover:opacity-100 bg-black/15 hover:bg-black/30 text-stone-700'
                }`}
                title={isHidden ? 'Mostrar post-it a los participantes' : 'Ocultar post-it'}
              >
                {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Banear autor si es disruptivo */}
            {onBanAuthor && note.authorId && (
              <>
                {showConfirmBan ? (
                  <div className="flex items-center gap-1 bg-rose-950 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg">
                    <span>¿Bloquear?</span>
                    <button
                      onClick={handleBan}
                      className="bg-rose-600 hover:bg-rose-500 text-white rounded px-1.5 py-0.5 font-bold cursor-pointer"
                    >
                      Sí
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirmBan(false);
                      }}
                      className="bg-black/30 rounded px-1.5 py-0.5 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleBan}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-black/15 hover:bg-rose-700 hover:text-white text-stone-700 cursor-pointer transition-colors"
                    title="Bloquear a esta participante para que no pueda enviar más ideas ni votos"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* BORRADO (Facilitadora O la participante si es su propia idea) */}
        {(isFacilitator || isMyNote) && onDelete && (
          <div>
            {showConfirmDelete ? (
              <div className="flex items-center gap-1 bg-rose-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg animate-in fade-in">
                <span>¿Borrar?</span>
                <button
                  onClick={handleDelete}
                  className="bg-rose-600 hover:bg-rose-500 text-white rounded px-1.5 py-0.5 font-bold cursor-pointer"
                  title="Confirmar eliminación"
                >
                  Sí
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmDelete(false);
                  }}
                  className="bg-black/30 hover:bg-black/40 text-white rounded px-1.5 py-0.5 cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className={`${
                  isMyNote && !isFacilitator ? 'opacity-80' : 'opacity-0 group-hover:opacity-100'
                } p-1 rounded-full bg-black/15 hover:bg-rose-600 hover:text-white text-stone-700 cursor-pointer transition-opacity`}
                title={isMyNote && !isFacilitator ? 'Borrar mi propio post-it' : 'Eliminar post-it'}
                aria-label="Eliminar post-it"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* TEXTO DEL POST-IT (Protegido contra XSS) */}
      <div className="text-[13px] sm:text-[14px] leading-snug font-normal select-text whitespace-pre-wrap break-words pr-2 mt-1">
        {note.text}
      </div>

      {/* PIE DEL POST-IT: VOTOS Y ACCIONES */}
      <div className="mt-2.5 pt-1.5 border-t border-black/10 flex items-center justify-between text-[11px] font-medium opacity-85">
        <div className="flex items-center gap-1.5">
          {note.votes > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/10 font-semibold">
              <span className="text-rose-600">★</span>
              <span>
                {note.votes} {note.votes === 1 ? 'voto' : 'votos'}
              </span>
            </span>
          ) : (
            <span className="text-[10px] opacity-60">Nuevo</span>
          )}
        </div>

        {/* ZONA DE VOTACIÓN / CAMBIO DE VOTO */}
        {onVote && (
          <div>
            {!votingOpen ? (
              <span className="text-[10px] opacity-60 italic">Votación cerrada</span>
            ) : hasVoted ? (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Votado
                </span>
                {onUnvote && (
                  <button
                    onClick={() => onUnvote(note.id)}
                    className="inline-flex items-center gap-0.5 text-[10px] text-rose-800 bg-rose-100/90 hover:bg-rose-200 px-1.5 py-0.5 rounded-full cursor-pointer transition-colors"
                    title="Cambiar o retirar voto"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Cambiar</span>
                  </button>
                )}
              </div>
            ) : canVote ? (
              <button
                onClick={() => onVote(note.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-indigo-700 hover:bg-indigo-800 px-2.5 py-1 rounded-full cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Heart className="w-3 h-3 fill-current" /> Votar
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
