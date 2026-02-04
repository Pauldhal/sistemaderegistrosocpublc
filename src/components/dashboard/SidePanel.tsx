import React, { useState } from 'react';
import type { RegisterData } from '@/hooks/useGridData';

interface SidePanelProps {
  selectedCells: Set<string>;
  onColorChange: (type: 'backgroundColor' | 'color', color: string) => void;
  onReset: () => void;
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
  registers,
  onRegisterChange,
}) => {
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [fgMenuOpen, setFgMenuOpen] = useState(false);

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
        RESETEAR TODO (B-P y TOTALES)
      </button>

      {/* Daily Register */}
      <div className="register-section">
        <div className="register-title">📅 Registro Diario</div>
        <div className="register-grid">
          {DAYS.map((day) => (
            <div key={day} className="register-item">
              <span className="register-item-label">{day}</span>
              <input
                type="number"
                className="register-item-input"
                value={registers.daily[day] || ''}
                onChange={(e) => onRegisterChange('daily', day, parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Register */}
      <div className="register-section">
        <div className="register-title">📊 Registro Semanal</div>
        <div className="register-grid">
          {WEEKS.map((week) => (
            <div key={week} className="register-item">
              <span className="register-item-label">{week}</span>
              <input
                type="number"
                className="register-item-input"
                value={registers.weekly[week] || ''}
                onChange={(e) => onRegisterChange('weekly', week, parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Register */}
      <div className="register-section">
        <div className="register-title">📈 Registro Mensual</div>
        <div className="register-grid grid-cols-2">
          {MONTHS.map((month) => (
            <div key={month} className="register-item">
              <span className="register-item-label">{month}</span>
              <input
                type="number"
                className="register-item-input"
                value={registers.monthly[month] || ''}
                onChange={(e) => onRegisterChange('monthly', month, parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
