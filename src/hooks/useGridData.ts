import { useState, useCallback, useMemo } from 'react';

export interface CellData {
  value: string;
  backgroundColor?: string;
  color?: string;
}

export interface GridData {
  [key: string]: CellData; // key format: "row-col"
}

export interface FinanceSettings {
  tasa: number;
  comision: number;
}

export interface RegisterData {
  daily: { [key: string]: number }; // Lun-Dom
  weekly: { [key: string]: number }; // Sem01-Sem05
  monthly: { [key: string]: number }; // Ene-Dic
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

  // Calculate financial KPIs
  const kpis = useMemo(() => {
    const bruto = Object.values(rowTotals).reduce((a, b) => a + b, 0);
    const netoMultiplier = (100 - settings.comision) / 100;
    const neto = bruto * netoMultiplier;
    const usd = neto / settings.tasa;
    return { bruto, neto, usd };
  }, [rowTotals, settings]);

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
  }, []);

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
  };
}
