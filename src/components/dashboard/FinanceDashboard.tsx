import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderKPIs } from './HeaderKPIs';
import { DataGrid } from './DataGrid';
import { SidePanel } from './SidePanel';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import type { GridData, CellData, FinanceSettings, RegisterData } from '@/hooks/useGridData';
import { getRegisterValue } from '@/hooks/useGridData';

const DAYS_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_ORDER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKS_ORDER = ['Sem 01', 'Sem 02', 'Sem 03', 'Sem 04', 'Sem 05'];
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
  const [lastUsdThreshold, setLastUsdThreshold] = useState<number | null>(null);

  // Speech synthesis for dollar milestones - TikTok style
  const speakDollarMilestone = useCallback((dollars: number) => {
    if ('speechSynthesis' in window) {
      const text = dollars === 1 
        ? "Has ganado un dólar" 
        : `Has ganado ${dollars} dólares`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find the best female Spanish voice from the OS
      const voices = window.speechSynthesis.getVoices();
      
      // Priority: female Spanish voice from OS (Sabina, Paulina, Monica, etc.)
      const femaleKeywords = ['sabina', 'paulina', 'monica', 'female', 'mujer', 'femenin', 'helena', 'laura', 'maria', 'conchita', 'lucia', 'elvira'];
      
      const spanishVoice = voices.find(v => 
        v.lang.startsWith('es') && femaleKeywords.some(k => v.name.toLowerCase().includes(k))
      ) || voices.find(v => 
        v.lang === 'es-MX'
      ) || voices.find(v => 
        v.lang === 'es-ES'
      ) || voices.find(v => 
        v.lang.startsWith('es')
      );
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      utterance.lang = 'es-MX';
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
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

  // Check for USD milestone and speak it
  useEffect(() => {
    const currentThreshold = Math.floor(kpis.usd);
    // Skip speech on initial load, but speak for every dollar crossed after
    if (lastUsdThreshold !== null && currentThreshold > lastUsdThreshold) {
      speakDollarMilestone(currentThreshold);
    }
    setLastUsdThreshold(currentThreshold);
  }, [kpis.usd, lastUsdThreshold, speakDollarMilestone]);

  // All registers are now MANUAL ONLY - no auto-update

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

  const handleToggleCase = useCallback(() => {
    if (selectedCells.size === 0) return;
    const keys = Array.from(selectedCells);
    const newData = { ...grid_data };
    keys.forEach(key => {
      const currentValue = newData[key]?.value || '';
      if (currentValue) {
        // Toggle: if any lowercase, convert all to uppercase; otherwise lowercase
        const hasLowercase = /[a-záéíóúñü]/.test(currentValue);
        const newValue = hasLowercase ? currentValue.toUpperCase() : currentValue.toLowerCase();
        newData[key] = { ...newData[key], value: newValue };
      }
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
    // Daily register will auto-update with new kpis.usd value after grid reset
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
      [type]: { ...registers[type], [key]: { value } }
    };
    updateRegisters(newRegisters);
  }, [registers, updateRegisters]);

  const handleResetRegister = useCallback((type: 'daily' | 'weekly' | 'monthly') => {
    const keys = type === 'daily' ? DAYS_ORDER : type === 'weekly' ? WEEKS_ORDER : MONTHS_MAP;
    const emptyRegister: Record<string, { value: number }> = {};
    keys.forEach(key => {
      emptyRegister[key] = { value: 0 };
    });
    const newRegisters = {
      ...registers,
      [type]: emptyRegister
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
        onToggleCase={handleToggleCase}
        onSignOut={handleSignOut}
      />

      {/*
        IMPORTANT: Keep a single vertical scrollbar on the far right (this container),
        and prevent flex children from being height-stretched + clipped on resize/zoom.
      */}
      <div className="flex-1 flex items-start min-h-0 overflow-y-auto scrollbar-thin">
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

        {/* Hard divider to prevent zoom sub-pixel gaps between TOTAL and the side panel */}
        <div className="w-[2px] bg-border shrink-0 -ml-px -mr-px" aria-hidden="true" />

        <SidePanel
          selectedCells={selectedCells}
          onColorChange={handleColorChange}
          onReset={handleReset}
          onConfirmReset={confirmReset}
          onCancelReset={cancelReset}
          showResetConfirm={showResetConfirm}
          registers={registers}
          onRegisterChange={handleRegisterChange}
          onResetRegister={handleResetRegister}
        />
      </div>
    </div>
  );
};
