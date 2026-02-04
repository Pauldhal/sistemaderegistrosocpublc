import React, { useState, useCallback, useEffect } from 'react';
import { HeaderKPIs } from './HeaderKPIs';
import { DataGrid } from './DataGrid';
import { SidePanel } from './SidePanel';
import { useGridData } from '@/hooks/useGridData';

const DAYS_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_MAP = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const getWeekOfMonth = (date: Date): string => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeek = firstDay.getDay();
  const weekNum = Math.ceil((dayOfMonth + dayOfWeek) / 7);
  return `Sem 0${weekNum}`;
};

export const FinanceDashboard: React.FC = () => {
  const {
    gridData,
    rowTotals,
    kpis,
    settings,
    registers,
    selectedCells,
    activeCell,
    setCellValue,
    setCellStyle,
    setSelectedCells,
    setActiveCell,
    deleteSelectedCells,
    resetAll,
    updateRegister,
    updateSettings,
    ROWS,
    COLS,
  } = useGridData();

  const [fontSize, setFontSize] = useState(0.85);

  // Auto-update registers based on current USD gain
  useEffect(() => {
    const now = new Date();
    const dayKey = DAYS_MAP[now.getDay()];
    const weekKey = getWeekOfMonth(now);
    const monthKey = MONTHS_MAP[now.getMonth()];
    
    // Update current day, week, and month with the USD value
    if (kpis.usd > 0) {
      updateRegister('daily', dayKey, kpis.usd);
      updateRegister('weekly', weekKey, kpis.usd);
      updateRegister('monthly', monthKey, kpis.usd);
    }
  }, [kpis.usd, updateRegister]);

  const handleCellSelect = useCallback((key: string, addToSelection: boolean = false) => {
    if (addToSelection) {
      setSelectedCells(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    } else {
      setSelectedCells(new Set([key]));
    }
  }, [setSelectedCells]);

  const handleColorChange = useCallback((type: 'backgroundColor' | 'color', color: string) => {
    const keys = Array.from(selectedCells);
    setCellStyle(keys, { [type]: color });
  }, [selectedCells, setCellStyle]);

  const handleFontSizeIncrease = useCallback(() => {
    setFontSize(prev => Math.min(prev + 0.05, 1.5));
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('¿Limpiar todo? Esta acción no se puede deshacer.')) {
      resetAll();
    }
  }, [resetAll]);

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ fontSize: `${fontSize}rem` }}
    >
      <HeaderKPIs
        tasa={settings.tasa}
        comision={settings.comision}
        bruto={kpis.bruto}
        neto={kpis.neto}
        usd={kpis.usd}
        onTasaChange={(v) => updateSettings({ tasa: v })}
        onComisionChange={(v) => updateSettings({ comision: v })}
        onFontSizeIncrease={handleFontSizeIncrease}
      />

      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0 gap-0">
        <DataGrid
          gridData={gridData}
          rowTotals={rowTotals}
          selectedCells={selectedCells}
          activeCell={activeCell}
          onCellChange={setCellValue}
          onCellSelect={handleCellSelect}
          onActiveCell={setActiveCell}
          onDeleteSelected={deleteSelectedCells}
          rows={ROWS}
          cols={COLS}
        />

        <SidePanel
          selectedCells={selectedCells}
          onColorChange={handleColorChange}
          onReset={handleReset}
          registers={registers}
          onRegisterChange={updateRegister}
        />
      </div>
    </div>
  );
};
