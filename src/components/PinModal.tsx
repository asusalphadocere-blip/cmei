import React, { useState } from 'react';
import { Lock, ArrowLeft, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

interface PinModalProps {
  onLogin: (pin: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  onLogin,
  onCancel,
  isLoading,
  error,
  clearError,
}) => {
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    clearError();
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    clearError();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isLoading) return;
    await onLogin(pin);
  };

  return (
    <div className="min-h-screen bg-[#0a0f2e] text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-500">
      <div className="max-w-md w-full bg-[#121a45] rounded-3xl border border-indigo-800/60 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la vista de participantes</span>
            </button>
            <span className="text-[11px] font-semibold text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              Moderación
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <KeyRound className="w-7 h-7 text-slate-950" />
            </div>
            <h2 className="text-2xl font-black text-white">Panel de Facilitadora</h2>
            <p className="text-xs text-slate-300">
              Ingresa el PIN para acceder al control del tablero en vivo, moderación de post-its y proyección para Zoom.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display de PIN */}
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  clearError();
                  setPin(e.target.value);
                }}
                placeholder="Ingresa PIN..."
                maxLength={8}
                className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3.5 px-4 rounded-2xl bg-[#0a0f2e] border border-indigo-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans placeholder:text-base"
                autoFocus
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Teclado numérico táctil para tablet o celular */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="py-3 rounded-xl bg-[#182359] hover:bg-[#202e75] active:scale-95 text-lg font-bold text-slate-200 transition-all cursor-pointer border border-indigo-900/60"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-3 rounded-xl bg-[#182359]/50 hover:bg-[#182359] text-xs font-semibold text-slate-400 transition-all cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="py-3 rounded-xl bg-[#182359] hover:bg-[#202e75] active:scale-95 text-lg font-bold text-slate-200 transition-all cursor-pointer border border-indigo-900/60"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-xl bg-[#182359]/50 hover:bg-[#182359] text-sm font-semibold text-slate-300 transition-all cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !pin}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 font-black text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando PIN...</span>
                </>
              ) : (
                <span>Ingresar al Tablero de Facilitadora</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500">
            El PIN está configurado en las variables de entorno de la organización (FACILITATOR_PIN).
          </p>
        </div>
      </div>
    </div>
  );
};
