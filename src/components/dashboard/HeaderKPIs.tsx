import React, { useState } from 'react';

interface HeaderKPIsProps {
  tasa: number;
  comision: number;
  bruto: number;
  neto: number;
  usd: number;
  onTasaChange: (value: number) => void;
  onComisionChange: (value: number) => void;
  onFontSizeIncrease: () => void;
  onFontSizeDecrease: () => void;
  onToggleCase: () => void;
  onSignOut: () => void;
  onReset: () => void;
  onConfirmReset: () => void;
  onCancelReset: () => void;
  showResetConfirm: boolean;
}

export const HeaderKPIs: React.FC<HeaderKPIsProps> = ({
  tasa,
  comision,
  bruto,
  neto,
  usd,
  onTasaChange,
  onComisionChange,
  onFontSizeIncrease,
  onFontSizeDecrease,
  onToggleCase,
  onSignOut,
  onReset,
  onConfirmReset,
  onCancelReset,
  showResetConfirm,
}) => {
  return (
    <header className="relative grid grid-cols-[180px_1fr_140px] items-center px-5 bg-background border-b-2 border-border h-[120px]">
      <div className="text-2xl font-black tracking-wider text-gold">
        SOCPUBLIC
      </div>

      <div className="flex gap-4 justify-center items-center">
        {/* TASA - Editable */}
        <div className="kpi-card">
          <div className="kpi-label">Tasa</div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={tasa}
              onChange={(e) => onTasaChange(parseFloat(e.target.value) || 0)}
              className="kpi-input w-16"
              step="0.01"
            />
            <span className="text-gold-neon text-sm">₽</span>
          </div>
        </div>

        {/* COMISION - Editable */}
        <div className="kpi-card">
          <div className="kpi-label">Comisión</div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={comision}
              onChange={(e) => onComisionChange(parseFloat(e.target.value) || 0)}
              className="kpi-input w-12"
              step="1"
              min="0"
              max="100"
            />
            <span className="text-gold-neon text-sm">%</span>
          </div>
        </div>

        {/* SUB-TOTAL */}
        <div className="kpi-card">
          <div className="kpi-label">Sub-Total</div>
          <div className="kpi-value">
            {bruto.toFixed(2)}<span className="text-gold-neon ml-1">₽</span>
          </div>
        </div>

        {/* NETO */}
        <div className="kpi-card">
          <div className="kpi-label">Neto</div>
          <div className="kpi-value">
            {neto.toFixed(2)}<span className="text-gold-neon ml-1">₽</span>
          </div>
        </div>

        {/* GANANCIA TOTAL - Highlighted */}
        <div className="kpi-card kpi-card-highlight min-w-[280px]">
          <div className="kpi-label text-neon-green">Ganancia Total</div>
          <div className="kpi-value-huge">
            <span className="kpi-symbol-gold text-3xl mr-1">$</span>
            {usd.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end items-center relative">
        <button
          onClick={onReset}
          className="px-3 py-2 bg-destructive/15 text-destructive border border-destructive/40 rounded hover:bg-destructive/30 hover:border-destructive transition-colors text-xs font-bold"
          title="Resetear columnas B-P"
        >
          🗑️ Reset
        </button>
        <button
          onClick={onFontSizeDecrease}
          className="p-2 bg-secondary text-gold border border-gold rounded hover:bg-gold/10 transition-colors text-sm font-bold"
          title="Reducir fuente"
        >
          A-
        </button>
        <button
          onClick={onFontSizeIncrease}
          className="p-2 bg-secondary text-gold border border-gold rounded hover:bg-gold/10 transition-colors text-sm font-bold"
          title="Aumentar fuente"
        >
          A+
        </button>
        <button
          onClick={onToggleCase}
          className="p-2 bg-secondary text-gold border border-gold rounded hover:bg-gold/10 transition-colors text-xs font-bold"
          title="Alternar mayúsculas/minúsculas"
        >
          Aa
        </button>
        <button
          onClick={onSignOut}
          className="p-2 bg-destructive/20 text-destructive border border-destructive rounded hover:bg-destructive/30 transition-colors text-xs font-bold"
          title="Cerrar sesión"
        >
          ✕
        </button>
      </div>

      {/* Reset Confirmation Popup */}
      {showResetConfirm && (
        <div className="absolute top-full right-4 mt-1 z-50 bg-surface border border-gold/30 rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 w-64">
          <p className="text-gold text-sm font-semibold mb-2">
            ¿Limpiar todas las columnas?
          </p>
          <p className="text-muted-foreground text-xs mb-3">
            Los registros diarios, semanales y mensuales se mantendrán.
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground text-xs font-bold py-2 px-3 rounded transition-colors"
              onClick={onConfirmReset}
            >
              CONFIRMAR
            </button>
            <button
              className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold py-2 px-3 rounded transition-colors"
              onClick={onCancelReset}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
