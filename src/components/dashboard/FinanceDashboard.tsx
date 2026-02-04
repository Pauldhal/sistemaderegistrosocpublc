import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderKPIs } from './HeaderKPIs';
import { DataGrid } from './DataGrid';
import { SidePanel } from './SidePanel';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import type { GridData, CellData, FinanceSettings, RegisterData, RegisterEntry } from '@/hooks/useGridData';
import { getRegisterValue, isManuallyEdited } from '@/hooks/useGridData';

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
    // Skip sound on initial load, but play for every dollar crossed after
    if (lastUsdThreshold !== null && currentThreshold > lastUsdThreshold) {
      playCashSound();
    }
    setLastUsdThreshold(currentThreshold);
  }, [kpis.usd, lastUsdThreshold, playCashSound]);

  // Use ref to always have fresh registers without causing re-renders
  const registersRef = useRef(registers);
  registersRef.current = registers;

  const sumRegister = useCallback(
    (data: Record<string, number | RegisterEntry | undefined>, order: string[]) =>
      order.reduce((sum, k) => sum + getRegisterValue(data[k]), 0),
    [],
  );

  // Auto-update registers with cascade logic:
  // Daily: current day gets current kpis.usd (Ganancias Total USD)
  // Weekly: current week gets SUM of all daily values
  // Monthly: current month gets SUM of all weekly values
  useEffect(() => {
    const regs = registersRef.current;
    const now = new Date();
    const dayKey = DAYS_MAP[now.getDay()];
    const weekKey = getWeekOfMonth(now);
    const monthKey = MONTHS_MAP[now.getMonth()];

    // Only update entries that haven't been manually edited
    const shouldUpdateDaily = !isManuallyEdited(regs.daily[dayKey]);
    const shouldUpdateWeekly = !isManuallyEdited(regs.weekly[weekKey]);
    const shouldUpdateMonthly = !isManuallyEdited(regs.monthly[monthKey]);

    if (!shouldUpdateDaily && !shouldUpdateWeekly && !shouldUpdateMonthly) return;

    const next = { ...regs };

    // Step 1: daily = current kpis.usd (Ganancias Total USD)
    if (shouldUpdateDaily) {
      next.daily = { ...next.daily, [dayKey]: { value: kpis.usd } };
    }
    const nextDailyTotal = sumRegister(next.daily, DAYS_ORDER);

    // Step 2: weekly = sum of all daily
    if (shouldUpdateWeekly) {
      next.weekly = { ...next.weekly, [weekKey]: { value: nextDailyTotal } };
    }
    const nextWeeklyTotal = sumRegister(next.weekly, WEEKS_ORDER);

    // Step 3: monthly = sum of all weekly
    if (shouldUpdateMonthly) {
      next.monthly = { ...next.monthly, [monthKey]: { value: nextWeeklyTotal } };
    }

    // Only write if specific slots changed
    const dailyChanged = shouldUpdateDaily && Math.abs(getRegisterValue(regs.daily[dayKey]) - kpis.usd) > 0.001;
    const weeklyChanged = shouldUpdateWeekly && Math.abs(getRegisterValue(regs.weekly[weekKey]) - nextDailyTotal) > 0.001;
    const monthlyChanged = shouldUpdateMonthly && Math.abs(getRegisterValue(regs.monthly[monthKey]) - nextWeeklyTotal) > 0.001;

    if (dailyChanged || weeklyChanged || monthlyChanged) {
      updateRegisters(next);
    }
  }, [kpis.usd, sumRegister, updateRegisters]);

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
    // IMPORTANT: Registers are PROTECTED by marking current entries as manually edited
    const now = new Date();
    const dayKey = DAYS_MAP[now.getDay()];
    const weekKey = getWeekOfMonth(now);
    const monthKey = MONTHS_MAP[now.getMonth()];

    // Mark current day/week/month as manually edited to protect from auto-update
    const protectedRegisters = {
      daily: {
        ...registers.daily,
        [dayKey]: { value: getRegisterValue(registers.daily[dayKey]), manuallyEdited: true }
      },
      weekly: {
        ...registers.weekly,
        [weekKey]: { value: getRegisterValue(registers.weekly[weekKey]), manuallyEdited: true }
      },
      monthly: {
        ...registers.monthly,
        [monthKey]: { value: getRegisterValue(registers.monthly[monthKey]), manuallyEdited: true }
      }
    };
    updateRegisters(protectedRegisters);

    // Now reset grid data
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
  }, [updateGridData, updateRegisters, grid_data, registers]);

  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const handleRegisterChange = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string, value: number) => {
    // Mark as manually edited so auto-update doesn't overwrite it
    const entry: RegisterEntry = { value, manuallyEdited: true };
    const newRegisters = {
      ...registers,
      [type]: { ...registers[type], [key]: entry }
    };
    updateRegisters(newRegisters);
  }, [registers, updateRegisters]);

  const handleResumeAuto = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string) => {
    const currentValue = getRegisterValue(registers[type][key]);
    const entry: RegisterEntry = { value: currentValue, manuallyEdited: false };
    const newRegisters = {
      ...registers,
      [type]: { ...registers[type], [key]: entry },
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
          onResumeAuto={handleResumeAuto}
        />
      </div>
    </div>
  );
};
