import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';
import type { RegisterData } from '@/hooks/useGridData';
import { getRegisterValue } from '@/hooks/useGridData';

// Track which input is being edited to allow free typing
type EditingState = {
  type: 'daily' | 'weekly' | 'monthly';
  key: string;
  value: string;
} | null;

interface SidePanelProps {
  selectedCells: Set<string>;
  onColorChange: (type: 'backgroundColor' | 'color', color: string) => void;
  onReset: () => void;
  onConfirmReset: () => void;
  onCancelReset: () => void;
  showResetConfirm: boolean;
  registers: RegisterData;
  onRegisterChange: (type: 'daily' | 'weekly' | 'monthly', key: string, value: number) => void;
  onResetRegister: (type: 'daily' | 'weekly' | 'monthly') => void;
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
  onResetRegister,
}) => {
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [fgMenuOpen, setFgMenuOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState>(null);

  // Refs for keyboard navigation
  const dailyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const weeklyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const monthlyRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate totals for each register
  const dailyTotal = DAYS.reduce((sum, day) => sum + getRegisterValue(registers.daily[day]), 0);
  const weeklyTotal = WEEKS.reduce((sum, week) => sum + getRegisterValue(registers.weekly[week]), 0);
  const monthlyTotal = MONTHS.reduce((sum, month) => sum + getRegisterValue(registers.monthly[month]), 0);

  // Keyboard navigation handler
  const handleKeyNav = useCallback((
    e: KeyboardEvent<HTMLInputElement>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    currentIndex: number,
    columns: number = 1
  ) => {
    const total = refs.current.length;
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex + columns < total ? currentIndex + columns : currentIndex;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex - columns >= 0 ? currentIndex - columns : currentIndex;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex + 1 < total ? currentIndex + 1 : currentIndex;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : currentIndex;
        break;
      case 'Enter':
        e.preventDefault();
        nextIndex = currentIndex + 1 < total ? currentIndex + 1 : 0;
        break;
      case 'Tab':
        // Let Tab work naturally between sections
        break;
    }

    if (nextIndex !== null && refs.current[nextIndex]) {
      refs.current[nextIndex]?.focus();
      refs.current[nextIndex]?.select();
    }
  }, []);

  // Get display value - show raw input while editing, formatted otherwise
  const getDisplayValue = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string, storedValue: number) => {
    if (editing && editing.type === type && editing.key === key) {
      return editing.value;
    }
    return storedValue.toFixed(2);
  }, [editing]);

  // Handle input change - store raw value while typing
  const handleInputChange = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string, rawValue: string) => {
    setEditing({ type, key, value: rawValue });
  }, []);

  // Handle blur - parse and save the value
  const handleInputBlur = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string) => {
    if (editing && editing.type === type && editing.key === key) {
      const val = editing.value.replace(',', '.');
      const num = parseFloat(val);
      onRegisterChange(type, key, isNaN(num) ? 0 : num);
      setEditing(null);
    }
  }, [editing, onRegisterChange]);

  // Handle focus - start editing with current formatted value
  const handleInputFocus = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string, currentValue: number) => {
    setEditing({ type, key, value: currentValue.toFixed(2) });
  }, []);

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

      {/* Daily Register */}
      <div className="register-section">
        <div className="register-header">
          <span className="register-title">📅 Registro Diario</span>
          <button
            className="register-reset-btn"
            onClick={() => onResetRegister('daily')}
            title="Reiniciar registro diario"
          >
            🗑️
          </button>
        </div>
        <div className="register-grid">
          {DAYS.map((day, index) => (
            <div key={day} className="register-item">
              <span className="register-item-label">{day}</span>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-gold text-xs pointer-events-none">$</span>
                <input
                  ref={(el) => { dailyRefs.current[index] = el; }}
                  type="text"
                  inputMode="decimal"
                  className="register-item-input pl-5 [appearance:textfield]"
                  value={getDisplayValue('daily', day, getRegisterValue(registers.daily[day]))}
                  onChange={(e) => handleInputChange('daily', day, e.target.value)}
                  onFocus={() => handleInputFocus('daily', day, getRegisterValue(registers.daily[day]))}
                  onBlur={() => handleInputBlur('daily', day)}
                  onKeyDown={(e) => handleKeyNav(e, dailyRefs, index, 1)}
                  placeholder="0,00"
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
        <div className="register-header">
          <span className="register-title">📊 Registro Semanal</span>
          <button
            className="register-reset-btn"
            onClick={() => onResetRegister('weekly')}
            title="Reiniciar registro semanal"
          >
            🗑️
          </button>
        </div>
        <div className="register-grid">
          {WEEKS.map((week, index) => (
            <div key={week} className="register-item">
              <span className="register-item-label">{week}</span>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-gold text-xs pointer-events-none">$</span>
                <input
                  ref={(el) => { weeklyRefs.current[index] = el; }}
                  type="text"
                  inputMode="decimal"
                  className="register-item-input pl-5 [appearance:textfield]"
                  value={getDisplayValue('weekly', week, getRegisterValue(registers.weekly[week]))}
                  onChange={(e) => handleInputChange('weekly', week, e.target.value)}
                  onFocus={() => handleInputFocus('weekly', week, getRegisterValue(registers.weekly[week]))}
                  onBlur={() => handleInputBlur('weekly', week)}
                  onKeyDown={(e) => handleKeyNav(e, weeklyRefs, index, 1)}
                  placeholder="0,00"
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
        <div className="register-header">
          <span className="register-title">📈 Registro Mensual</span>
          <button
            className="register-reset-btn"
            onClick={() => onResetRegister('monthly')}
            title="Reiniciar registro mensual"
          >
            🗑️
          </button>
        </div>
        <div className="register-grid grid-cols-2">
          {MONTHS.map((month, index) => (
            <div key={month} className="register-item">
              <span className="register-item-label">{month}</span>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-gold text-xs pointer-events-none">$</span>
                <input
                  ref={(el) => { monthlyRefs.current[index] = el; }}
                  type="text"
                  inputMode="decimal"
                  className="register-item-input pl-5 [appearance:textfield]"
                  value={getDisplayValue('monthly', month, getRegisterValue(registers.monthly[month]))}
                  onChange={(e) => handleInputChange('monthly', month, e.target.value)}
                  onFocus={() => handleInputFocus('monthly', month, getRegisterValue(registers.monthly[month]))}
                  onBlur={() => handleInputBlur('monthly', month)}
                  onKeyDown={(e) => handleKeyNav(e, monthlyRefs, index, 2)}
                  placeholder="0,00"
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

      {/* Reset Button - At the bottom with spacing */}
      <div className="mt-6 pt-4 border-t border-border">
        <button className="btn-reset" onClick={onReset}>
          🗑️ RESETEAR COLUMNAS (B-P)
        </button>
      </div>

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
    </aside>
  );
};
