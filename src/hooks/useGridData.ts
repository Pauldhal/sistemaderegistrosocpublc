import { useState, useCallback, useMemo } from 'react';

export interface CellData {
  value: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
}

export interface GridData {
  [key: string]: CellData; // key format: "row-col"
}

export interface FinanceSettings {
  tasa: number;
  comision: number;
}

export interface RegisterEntry {
  value: number;
  manuallyEdited?: boolean; // Track if user manually edited this entry
}

export interface RegisterData {
  daily: { [key: string]: number | RegisterEntry }; // Lun-Dom
  weekly: { [key: string]: number | RegisterEntry }; // Sem01-Sem05
  monthly: { [key: string]: number | RegisterEntry }; // Ene-Dic
}

// Helper to get numeric value from register entry (supports both old number format and new object format)
export function getRegisterValue(entry: number | RegisterEntry | undefined): number {
  if (entry === undefined) return 0;
  if (typeof entry === 'number') return entry;
  return entry.value || 0;
}

// Helper to check if entry was manually edited
export function isManuallyEdited(entry: number | RegisterEntry | undefined): boolean {
  if (entry === undefined) return false;
  if (typeof entry === 'number') return false;
  return entry.manuallyEdited === true;
}

const ROWS = 40;
const COLS = 17; // A=1, B-P=2-16, TOTAL=17
const DATA_COLS = 15; // B-P (columns 2-16)

export function useGridData() {
  const [gridData, setGridData] = useState<GridData>({});
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [settings, setSettings] = useState<FinanceSettings>({
    tasa: 90.00,
    comision: 12,
  });
  const [registers, setRegisters] = useState<RegisterData>({
    daily: {},
    weekly: {},
    monthly: {},
  });
  const [carriedTotals, setCarriedTotals] = useState<{ [row: number]: number }>({});

  // Calculate row totals
  const rowTotals = useMemo(() => {
    const totals: { [row: number]: number } = {};
    for (let r = 1; r <= ROWS; r++) {
      let sum = 0;
      for (let c = 2; c <= 16; c++) {
        const key = `${r}-${c}`;
        const val = parseFloat(gridData[key]?.value?.replace(',', '.') || '0');
        if (!isNaN(val)) sum += val;
      }
      totals[r] = sum;
    }
    return totals;
  }, [gridData]);

  // Display totals = calculated + carried
  const displayTotals = useMemo(() => {
    const totals: { [row: number]: number } = {};
    for (let r = 1; r <= ROWS; r++) {
      totals[r] = rowTotals[r] + (carriedTotals[r] || 0);
    }
    return totals;
  }, [rowTotals, carriedTotals]);

  // Calculate financial KPIs
  const kpis = useMemo(() => {
    const bruto = Object.values(displayTotals).reduce((a, b) => a + b, 0);
    const netoMultiplier = (100 - settings.comision) / 100;
    const neto = bruto * netoMultiplier;
    const usd = neto / settings.tasa;
    return { bruto, neto, usd };
  }, [displayTotals, settings]);

  const setCellValue = useCallback((row: number, col: number, value: string) => {
    const key = `${row}-${col}`;
    setGridData(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  }, []);

  const setCellStyle = useCallback((keys: string[], style: Partial<CellData>) => {
    setGridData(prev => {
      const updated = { ...prev };
      keys.forEach(key => {
        updated[key] = { ...updated[key], ...style };
      });
      return updated;
    });
  }, []);

  const deleteSelectedCells = useCallback(() => {
    if (selectedCells.size === 0) return;
    setGridData(prev => {
      const updated = { ...prev };
      selectedCells.forEach(key => {
        if (updated[key]) {
          updated[key] = { ...updated[key], value: '' };
        }
      });
      return updated;
    });
  }, [selectedCells]);

  const resetAll = useCallback(() => {
    setGridData({});
    setSelectedCells(new Set());
    setActiveCell(null);
    setRegisters({ daily: {}, weekly: {}, monthly: {} });
    setCarriedTotals({});
  }, []);

  // Clear a single row's B-P data, carrying over its current total
  const clearRowData = useCallback((row: number) => {
    // Add current calculated total to carried
    setCarriedTotals(prev => ({
      ...prev,
      [row]: (prev[row] || 0) + rowTotals[row],
    }));
    // Clear cols 2-16 for this row
    setGridData(prev => {
      const updated = { ...prev };
      for (let c = 2; c <= 16; c++) {
        const key = `${row}-${c}`;
        if (updated[key]) {
          updated[key] = { ...updated[key], value: '' };
        }
      }
      return updated;
    });
  }, [rowTotals]);

  const updateRegister = useCallback((type: 'daily' | 'weekly' | 'monthly', key: string, value: number) => {
    setRegisters(prev => ({
      ...prev,
      [type]: { ...prev[type], [key]: value }
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<FinanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    gridData,
    rowTotals: displayTotals,
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
    clearRowData,
    updateRegister,
    updateSettings,
    ROWS,
    COLS,
  };
}
