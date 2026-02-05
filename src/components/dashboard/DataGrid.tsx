import React, { useRef, useCallback, useEffect } from 'react';
import type { GridData, CellData } from '@/hooks/useGridData';

interface DataGridProps {
  gridData: GridData;
  rowTotals: { [row: number]: number };
  selectedCells: Set<string>;
  activeCell: string | null;
  onCellChange: (row: number, col: number, value: string) => void;
  onCellSelect: (key: string, addToSelection?: boolean) => void;
  onSetSelection: (keys: Set<string>) => void;
  onActiveCell: (key: string | null) => void;
  onDeleteSelected: () => void;
  rows: number;
  cols: number;
}

const COLUMN_HEADERS = ['PAÍS', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'TOTAL'];

export const DataGrid: React.FC<DataGridProps> = ({
  gridData,
  rowTotals,
  selectedCells,
  activeCell,
  onCellChange,
  onCellSelect,
  onSetSelection,
  onActiveCell,
  onDeleteSelected,
  rows,
  cols,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const isSelecting = useRef(false);
  const selectionStart = useRef<string | null>(null);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const key = e.key;
    let newRow = row;
    let newCol = col;

    if (key === 'ArrowUp' && row > 1) newRow = row - 1;
    else if (key === 'ArrowDown' && row < rows) newRow = row + 1;
    else if (key === 'ArrowLeft' && col > 1) newCol = col - 1;
    else if (key === 'ArrowRight' && col < cols - 1) newCol = col + 1;
    else if (key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (col > 1) newCol = col - 1;
        else if (row > 1) { newRow = row - 1; newCol = cols - 1; }
      } else {
        if (col < cols - 1) newCol = col + 1;
        else if (row < rows) { newRow = row + 1; newCol = 1; }
      }
    } else if (key === 'Enter') {
      e.preventDefault();
      if (row < rows) newRow = row + 1;
    } else if (key === 'Delete' || key === 'Backspace') {
      if (selectedCells.size > 1) {
        e.preventDefault();
        onDeleteSelected();
        return;
      }
    } else {
      return;
    }

    if (newRow !== row || newCol !== col) {
      e.preventDefault();
      const newKey = `${newRow}-${newCol}`;
      onActiveCell(newKey);
      onCellSelect(newKey, false);
      inputRefs.current[newKey]?.focus();
      inputRefs.current[newKey]?.select();
    }
  }, [rows, cols, selectedCells.size, onDeleteSelected, onActiveCell, onCellSelect]);

  // Handle mouse selection
  const handleMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    const key = `${row}-${col}`;
    isSelecting.current = true;
    selectionStart.current = key;
    
    if (e.ctrlKey || e.metaKey) {
      onCellSelect(key, true);
    } else {
      onCellSelect(key, false);
    }
    onActiveCell(key);
  }, [onCellSelect, onActiveCell]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!isSelecting.current || !selectionStart.current) return;
    
    const [startRow, startCol] = selectionStart.current.split('-').map(Number);
    const minRow = Math.min(startRow, row);
    const maxRow = Math.max(startRow, row);
    const minCol = Math.min(startCol, col);
    const maxCol = Math.max(startCol, col);
    
    const newSelection = new Set<string>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        newSelection.add(`${r}-${c}`);
      }
    }
    onSetSelection(newSelection);
  }, [onSetSelection]);

  useEffect(() => {
    const handleMouseUp = () => {
      isSelecting.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle input changes - clear previous value when typing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    onCellChange(row, col, e.target.value);
  }, [onCellChange]);

  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  const getColumnWidth = (col: number) => {
    if (col === 1) return 'w-[150px]';
    if (col === 17) return 'w-[130px]';
    return 'w-[90px]';
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-x-auto overflow-y-hidden bg-surface-darker min-w-0 scrollbar-thin"
    >
      <div className="flex ml-auto">
        {Array.from({ length: cols }, (_, colIndex) => {
        const col = colIndex + 1;
        const isTotal = col === 17;
        
        return (
          <div 
            key={col} 
            className={`grid-column ${getColumnWidth(col)} ${isTotal ? 'bg-background border-l-2 border-gold' : ''}`}
          >
            <div className="grid-column-header">
              {COLUMN_HEADERS[colIndex]}
            </div>
            
            {Array.from({ length: rows }, (_, rowIndex) => {
              const row = rowIndex + 1;
              const key = `${row}-${col}`;
              const cellData = gridData[key] || { value: '' };
              const isSelected = selectedCells.has(key);
              const isActive = activeCell === key;
              
              return (
                <div 
                  key={key}
                  className={`grid-row ${isSelected ? 'selected' : ''} ${isActive ? 'ring-2 ring-gold' : ''}`}
                  onMouseDown={(e) => !isTotal && handleMouseDown(e, row, col)}
                  onMouseEnter={() => handleMouseEnter(row, col)}
                >
                  {isTotal ? (
                    <div className="grid-cell-input grid-cell-input-total flex items-center justify-center">
                      {rowTotals[row] > 0 ? `${rowTotals[row].toFixed(2)}` : ''}
                    </div>
                  ) : col === 1 ? (
                    <div className="relative w-full h-full flex items-center">
                      <span className="absolute left-1 text-[0.6rem] text-muted-foreground font-mono">{row}</span>
                      <input
                        ref={(el) => { inputRefs.current[key] = el; }}
                        type="text"
                        value={cellData.value || ''}
                        onChange={(e) => handleInputChange(e, row, col)}
                        onKeyDown={(e) => handleKeyDown(e, row, col)}
                        onFocus={handleInputFocus}
                        className="grid-cell-input pl-5"
                        style={{
                          backgroundColor: cellData.backgroundColor || 'transparent',
                          color: cellData.color || undefined,
                          fontSize: cellData.fontSize ? `${cellData.fontSize}rem` : undefined,
                        }}
                        autoComplete="off"
                      />
                    </div>
                  ) : col >= 2 && col <= 16 ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <input
                        ref={(el) => { inputRefs.current[key] = el; }}
                        type="text"
                        value={cellData.value || ''}
                        onChange={(e) => handleInputChange(e, row, col)}
                        onKeyDown={(e) => handleKeyDown(e, row, col)}
                        onFocus={handleInputFocus}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value.replace(',', '.'));
                          if (!isNaN(val)) {
                            onCellChange(row, col, val.toFixed(2).replace('.', ','));
                          }
                        }}
                        className="grid-cell-input text-center"
                        style={{
                          backgroundColor: cellData.backgroundColor || 'transparent',
                          color: cellData.color || undefined,
                          fontSize: cellData.fontSize ? `${cellData.fontSize}rem` : undefined,
                          paddingRight: cellData.value ? '1rem' : undefined,
                        }}
                        autoComplete="off"
                      />
                      {cellData.value && <span className="absolute right-[0.35rem] text-[0.65rem] text-neon-green font-bold pointer-events-none">₽</span>}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
      </div>
    </div>
  );
};
