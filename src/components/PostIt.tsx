import React, { useState } from 'react';
import { Trash2, Heart, Check } from 'lucide-react';
import type { Note } from '../types.ts';
import { getPostitColor } from '../types.ts';

interface PostItProps {
  note: Note;
  index: number;
  isFacilitator?: boolean;
  onDelete?: (noteId: string) => void;
  onVote?: (noteId: string) => void;
  hasVoted?: boolean;
  canVote?: boolean;
  theme?: 'canvas' | 'dark';
  compact?: boolean;
}

export const PostIt: React.FC<PostItProps> = ({
  note,
  index,
  isFacilitator = false,
  onDelete,
  onVote,
  hasVoted = false,
  canVote = false,
  theme = 'canvas',
  compact = false,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const color = getPostitColor(index);

  // Rotación orgánica sutil basada en el id
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

  return (
    <div
      style={{
        backgroundColor: color.bg,
        color: color.text,
        transform: `rotate(${rotationDegrees}deg)`,
      }}
      className={`group relative rounded-md shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between border ${
        theme === 'dark' ? 'border-black/10' : 'border-[#d0b865]/40'
      } ${compact ? 'p-2.5 min-h-[90px]' : 'p-3.5 min-h-[110px]'}`}
    >
      {/* Botón de borrado para facilitadora con confirmación rápida */}
      {isFacilitator && (
        <div className="absolute top-1.5 right-1.5 z-10">
          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-900/90 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-lg animate-in fade-in">
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
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full bg-black/15 hover:bg-rose-600 hover:text-white text-stone-700 cursor-pointer"
              title="Eliminar post-it"
              aria-label="Eliminar post-it"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Contenido del post-it (escapado naturalmente por React para evitar XSS) */}
      <div className="text-[13px] sm:text-[14px] leading-snug font-normal select-text whitespace-pre-wrap break-words pr-2">
        {note.text}
      </div>

      {/* Pie del post-it: votos y hora */}
      <div className="mt-2.5 pt-1.5 border-t border-black/10 flex items-center justify-between text-[11px] font-medium opacity-85">
        <div className="flex items-center gap-1.5">
          {note.votes > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/10 font-semibold">
              <span className="text-rose-600">★</span>
              <span>{note.votes} {note.votes === 1 ? 'voto' : 'votos'}</span>
            </span>
          ) : (
            <span className="text-[10px] opacity-60">Nuevo</span>
          )}
        </div>

        {onVote && (
          <div>
            {hasVoted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Votado
              </span>
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
