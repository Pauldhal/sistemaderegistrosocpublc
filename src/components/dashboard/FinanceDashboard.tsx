import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderKPIs } from './HeaderKPIs';
import { DataGrid } from './DataGrid';
import { SidePanel } from './SidePanel';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import type { GridData, CellData, FinanceSettings, RegisterData } from '@/hooks/useGridData';

const DAYS_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_MAP = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ROWS = 40;
const COLS = 17;

const getWeekOfMonth = (date: Date): string => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeek = firstDay.getDay();
  const weekNum = Math.ceil((dayOfMonth + dayOfWeek) / 7);
  return `Sem 0${weekNum}`;
};

interface FinanceDashboardProps {
  userId: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const {
    grid_data,
    settings,
    registers,
    loading,
    updateGridData,
    updateSettings,
    updateRegisters,
    resetAll,
  } = useUserData(userId);

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [lastUsdThreshold, setLastUsdThreshold] = useState(0);

  // Sound effect for cash register
  const playCashSound = useCallback(() => {
    const audio = new Audio("https://www.myinstants.com/media/sounds/ka-ching.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Ignore autoplay errors
  }, []);


  // Calculate row totals
  const rowTotals = React.useMemo(() => {
    const totals: { [row: number]: number } = {};
    for (let r = 1; r <= ROWS; r++) {
      let sum = 0;
      for (let c = 2; c <= 16; c++) {
        const key = `${r}-${c}`;
        const val = parseFloat(grid_data[key]?.value?.replace(',', '.') || '0');
        if (!isNaN(val)) sum += val;
      }
      totals[r] = sum;
    }
    return totals;
  }, [grid_data]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const bruto = Object.values(rowTotals).reduce((a, b) => a + b, 0);
    const netoMultiplier = (100 - settings.comision) / 100;
    const neto = bruto * netoMultiplier;
    const usd = neto / settings.tasa;
    return { bruto, neto, usd };
  }, [rowTotals, settings]);

  // Check for USD milestone and play sound
  useEffect(() => {
    const currentThreshold = Math.floor(kpis.usd);
    if (currentThreshold > lastUsdThreshold && lastUsdThreshold > 0) {
      playCashSound();
    }
    setLastUsdThreshold(currentThreshold);
  }, [kpis.usd, lastUsdThreshold, playCashSound]);

  // Auto-update registers based on current USD gain
  useEffect(() => {
    if (kpis.usd > 0) {
      const now = new Date();
      const dayKey = DAYS_MAP[now.getDay()];
      const weekKey = getWeekOfMonth(now);
      const monthKey = MONTHS_MAP[now.getMonth()];
      
      const newRegisters = {
        ...registers,
        daily: { ...registers.daily, [dayKey]: kpis.usd },
        weekly: { ...registers.weekly, [weekKey]: kpis.usd },
        monthly: { ...registers.monthly, [monthKey]: kpis.usd },
      };
      
      // Only update if values changed
      if (
        registers.daily[dayKey] !== kpis.usd ||
        registers.weekly[weekKey] !== kpis.usd ||
        registers.monthly[monthKey] !== kpis.usd
      ) {
        updateRegisters(newRegisters);
      }
    }
  }, [kpis.usd]);

  const setCellValue = useCallback((row: number, col: number, value: string) => {
    const key = `${row}-${col}`;
    const newData = {
      ...grid_data,
      [key]: { ...grid_data[key], value }
    };
    updateGridData(newData);
  }, [grid_data, updateGridData]);

  const setCellStyle = useCallback((keys: string[], style: Partial<CellData>) => {
    const newData = { ...grid_data };
    keys.forEach(key => {
      newData[key] = { ...newData[key], ...style };
    });
    updateGridData(newData);
  }, [grid_data, updateGridData]);

  const handleFontSizeIncrease = useCallback(() => {
    if (selectedCells.size === 0) return;
    const keys = Array.from(selectedCells);
    const newData = { ...grid_data };
    keys.forEach(key => {
      const currentSize = newData[key]?.fontSize || 1;
      newData[key] = { ...newData[key], fontSize: Math.min(currentSize + 0.1, 2) };
    });
    updateGridData(newData);
  }, [selectedCells, grid_data, updateGridData]);

  const handleFontSizeDecrease = useCallback(() => {
    if (selectedCells.size === 0) return;
    const keys = Array.from(selectedCells);
    const newData = { ...grid_data };
    keys.forEach(key => {
      const currentSize = newData[key]?.fontSize || 1;
      newData[key] = { ...newData[key], fontSize: Math.max(currentSize - 0.1, 0.5) };
    });
    updateGridData(newData);
  }, [selectedCells, grid_data, updateGridData]);

  const deleteSelectedCells = useCallback(() => {
    if (selectedCells.size === 0) return;
    const newData = { ...grid_data };
    selectedCells.forEach(key => {
      if (newData[key]) {
        newData[key] = { ...newData[key], value: '' };
      }
    });
    updateGridData(newData);
  }, [selectedCells, grid_data, updateGridData]);

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
  }, []);

  const handleSetSelection = useCallback((keys: Set<string>) => {
    setSelectedCells(keys);
  }, []);

  const handleColorChange = useCallback((type: 'backgroundColor' | 'color', color: string) => {
    const keys = Array.from(selectedCells);
    setCellStyle(keys, { [type]: color });
  }, [selectedCells, setCellStyle]);


  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    // Only reset columns B-P (cols 2-16), preserve PAÍS column (col 1)
    const newData: GridData = {};
    for (let r = 1; r <= ROWS; r++) {
      const paisKey = `${r}-1`;
      if (grid_data[paisKey]) {
        newData[paisKey] = grid_data[paisKey];
      }
    }
    updateGridData(newData);
    setSelectedCells(new Set());
    setActiveCell(null);
    setShowResetConfirm(false);
  }, [updateGridData, grid_data]);

  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const handleRegisterChange = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string, value: number) => {
    const newRegisters = {
      ...registers,
      [type]: { ...registers[type], [key]: value }
    };
    updateRegisters(newRegisters);
  }, [registers, updateRegisters]);

  const handleSettingsChange = useCallback((newSettings: Partial<FinanceSettings>) => {
    updateSettings({ ...settings, ...newSettings });
  }, [settings, updateSettings]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/auth');
  }, [signOut, navigate]);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-gold text-2xl font-bold animate-pulse">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <HeaderKPIs
        tasa={settings.tasa}
        comision={settings.comision}
        bruto={kpis.bruto}
        neto={kpis.neto}
        usd={kpis.usd}
        onTasaChange={(v) => handleSettingsChange({ tasa: v })}
        onComisionChange={(v) => handleSettingsChange({ comision: v })}
        onFontSizeIncrease={handleFontSizeIncrease}
        onFontSizeDecrease={handleFontSizeDecrease}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0 gap-0">
        <DataGrid
          gridData={grid_data}
          rowTotals={rowTotals}
          selectedCells={selectedCells}
          activeCell={activeCell}
          onCellChange={setCellValue}
          onCellSelect={handleCellSelect}
          onSetSelection={handleSetSelection}
          onActiveCell={setActiveCell}
          onDeleteSelected={deleteSelectedCells}
          rows={ROWS}
          cols={COLS}
        />

        <SidePanel
          selectedCells={selectedCells}
          onColorChange={handleColorChange}
          onReset={handleReset}
          onConfirmReset={confirmReset}
          onCancelReset={cancelReset}
          showResetConfirm={showResetConfirm}
          registers={registers}
          onRegisterChange={handleRegisterChange}
        />
      </div>
    </div>
  );
};
