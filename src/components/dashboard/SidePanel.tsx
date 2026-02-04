import React, { useState } from 'react';
import type { RegisterData } from '@/hooks/useGridData';
import { getRegisterValue } from '@/hooks/useGridData';

interface SidePanelProps {
  selectedCells: Set<string>;
  onColorChange: (type: 'backgroundColor' | 'color', color: string) => void;
  onReset: () => void;
  onConfirmReset: () => void;
  onCancelReset: () => void;
  showResetConfirm: boolean;
  registers: RegisterData;
  onRegisterChange: (type: 'daily' | 'weekly' | 'monthly', key: string, value: number) => void;
}

// Neon colors
const NEON_COLORS = [
  '#00ff88', '#ff00ff', '#00ffff', '#ffff00', '#ff0066',
  '#66ff00', '#ff6600', '#0066ff', '#ff0000', '#00ff00',
];

// Standard colors
const STANDARD_COLORS = [
  '#ffffff', '#c0c0c0', '#808080', '#404040', '#000000',
  '#ff4444', '#44ff44', '#4444ff', '#ffaa00', '#aa00ff',
];

const ALL_COLORS = [...NEON_COLORS, ...STANDARD_COLORS];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKS = ['Sem 01', 'Sem 02', 'Sem 03', 'Sem 04', 'Sem 05'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const SidePanel: React.FC<SidePanelProps> = ({
  selectedCells,
  onColorChange,
  onReset,
  onConfirmReset,
  onCancelReset,
  showResetConfirm,
  registers,
  onRegisterChange,
}) => {
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [fgMenuOpen, setFgMenuOpen] = useState(false);

  // Calculate totals for each register
  const dailyTotal = DAYS.reduce((sum, day) => sum + getRegisterValue(registers.daily[day]), 0);
  const weeklyTotal = WEEKS.reduce((sum, week) => sum + getRegisterValue(registers.weekly[week]), 0);
  const monthlyTotal = MONTHS.reduce((sum, month) => sum + getRegisterValue(registers.monthly[month]), 0);

  const handleColorClick = (type: 'backgroundColor' | 'color', color: string) => {
    if (selectedCells.size > 0) {
      onColorChange(type, color);
    }
  };

  return (
    <aside className="side-panel w-[380px]">
      {/* Color Background Button */}
      <button 
        className="btn-action"
        onClick={() => setBgMenuOpen(!bgMenuOpen)}
      >
        🎨 COLOR FONDO
      </button>
      {bgMenuOpen && (
        <div className="color-menu">
          <div className="color-grid">
            {ALL_COLORS.map((color, i) => (
              <button
                key={`bg-${i}`}
                className="color-btn"
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick('backgroundColor', color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Font Button */}
      <button 
        className="btn-action"
        onClick={() => setFgMenuOpen(!fgMenuOpen)}
      >
        ✍️ COLOR FUENTE
      </button>
      {fgMenuOpen && (
        <div className="color-menu">
          <div className="color-grid">
            {ALL_COLORS.map((color, i) => (
              <button
                key={`fg-${i}`}
                className="color-btn"
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick('color', color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button className="btn-reset" onClick={onReset}>
        RESETEAR COLUMNAS (B-P)
      </button>

      {/* Reset Confirmation Card */}
      {showResetConfirm && (
        <div className="bg-surface border border-gold/30 rounded-lg p-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-gold text-sm font-semibold mb-3">
            ¿Limpiar todas las columnas?
          </p>
          <p className="text-muted-foreground text-xs mb-4">
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

      {/* Daily Register */}
      <div className="register-section">
        <div className="register-title">📅 Registro Diario</div>
        <div className="register-grid">
          {DAYS.map((day) => (
            <div key={day} className="register-item">
              <span className="register-item-label">{day}</span>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-gold text-xs pointer-events-none">$</span>
                <input
                  type="number"
                  className="register-item-input pl-5"
                  value={getRegisterValue(registers.daily[day]) || ''}
                  onChange={(e) => onRegisterChange('daily', day, parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="register-total">
          <span className="register-total-label">TOTAL:</span>
          <span className="register-total-value">${dailyTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Weekly Register */}
      <div className="register-section">
        <div className="register-title">📊 Registro Semanal</div>
        <div className="register-grid">
          {WEEKS.map((week) => (
            <div key={week} className="register-item">
              <span className="register-item-label">{week}</span>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-gold text-xs pointer-events-none">$</span>
                <input
                  type="number"
                  className="register-item-input pl-5"
                  value={getRegisterValue(registers.weekly[week]) || ''}
                  onChange={(e) => onRegisterChange('weekly', week, parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="register-total">
          <span className="register-total-label">TOTAL:</span>
          <span className="register-total-value">${weeklyTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Monthly Register */}
      <div className="register-section">
        <div className="register-title">📈 Registro Mensual</div>
        <div className="register-grid grid-cols-2">
          {MONTHS.map((month) => (
            <div key={month} className="register-item">
              <span className="register-item-label">{month}</span>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-gold text-xs pointer-events-none">$</span>
                <input
                  type="number"
                  className="register-item-input pl-5"
                  value={getRegisterValue(registers.monthly[month]) || ''}
                  onChange={(e) => onRegisterChange('monthly', month, parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="register-total">
          <span className="register-total-label">TOTAL:</span>
          <span className="register-total-value">${monthlyTotal.toFixed(2)}</span>
        </div>
      </div>
    </aside>
  );
};
