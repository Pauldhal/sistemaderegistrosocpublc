import React, { useRef, useCallback, useEffect, useState } from 'react';
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

  // Fill handle state
  const isFilling = useRef(false);
  const fillSource = useRef<{ keys: string[]; values: Map<string, string> } | null>(null);
  const [fillPreview, setFillPreview] = useState<Set<string>>(new Set());

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
      // If we were filling, apply the fill
      if (isFilling.current && fillSource.current && fillPreview.size > 0) {
        const sourceValues = Array.from(fillSource.current.values.values());
        const fillKeys = Array.from(fillPreview);
        fillKeys.forEach((key, i) => {
          const [r, c] = key.split('-').map(Number);
          const value = sourceValues[i % sourceValues.length];
          onCellChange(r, c, value);
        });
        // Select the filled cells too
        const allKeys = new Set([...fillSource.current.keys, ...fillKeys]);
        onSetSelection(allKeys);
      }
      isFilling.current = false;
      fillSource.current = null;
      setFillPreview(new Set());
      isSelecting.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [fillPreview, onCellChange, onSetSelection]);

  // Fill handle: mouse enter during fill drag
  const handleFillEnter = useCallback((row: number, col: number) => {
    if (!isFilling.current || !fillSource.current) return;
    const sourceKeys = fillSource.current.keys;
    const rows = sourceKeys.map(k => parseInt(k.split('-')[0]));
    const cols = sourceKeys.map(k => parseInt(k.split('-')[1]));
    const minR = Math.min(...rows), maxR = Math.max(...rows);
    const minC = Math.min(...cols), maxC = Math.max(...cols);

    const preview = new Set<string>();
    // Determine fill direction (vertical preferred)
    if (row > maxR) {
      for (let r = maxR + 1; r <= row; r++) {
        for (let c = minC; c <= maxC; c++) preview.add(`${r}-${c}`);
      }
    } else if (row < minR) {
      for (let r = row; r < minR; r++) {
        for (let c = minC; c <= maxC; c++) preview.add(`${r}-${c}`);
      }
    } else if (col > maxC) {
      for (let c = maxC + 1; c <= col; c++) {
        for (let r = minR; r <= maxR; r++) preview.add(`${r}-${c}`);
      }
    } else if (col < minC) {
      for (let c = col; c < minC; c++) {
        for (let r = minR; r <= maxR; r++) preview.add(`${r}-${c}`);
      }
    }
    setFillPreview(preview);
  }, []);

  // Start fill handle drag
  const handleFillHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isFilling.current = true;
    const keys = Array.from(selectedCells);
    const values = new Map<string, string>();
    keys.forEach(k => {
      values.set(k, gridData[k]?.value || '');
    });
    fillSource.current = { keys, values };
  }, [selectedCells, gridData]);

  // Compute fill handle position (bottom-right of selection)
  const fillHandleCell = React.useMemo(() => {
    if (selectedCells.size === 0) return null;
    const keys = Array.from(selectedCells);
    let maxR = 0, maxC = 0;
    keys.forEach(k => {
      const [r, c] = k.split('-').map(Number);
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    });
    // Don't show on TOTAL column
    if (maxC >= 17) return null;
    return `${maxR}-${maxC}`;
  }, [selectedCells]);

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
      // NOTE: Don't clip rows on resize/zoom; vertical scrolling is handled by the parent container.
      className="overflow-x-auto overflow-y-visible bg-surface-darker flex-1 min-w-0 scrollbar-thin self-start"
    >
      <table className="border-collapse table-fixed">
        <thead className="sticky top-0 z-10">
          <tr>
            {COLUMN_HEADERS.map((header, colIndex) => {
              const col = colIndex + 1;
              const isTotal = col === 17;
              return (
                <th
                  key={col}
                  className={`bg-background font-bold border-b border-r border-border text-center ${
                    col === 1 ? 'w-[150px]' : col === 17 ? 'w-[130px]' : 'w-[90px]'
                  } ${isTotal ? 'border-l-2 border-l-gold' : ''}`}
                  style={{ color: 'hsl(var(--gold))', height: 'var(--grid-header-h)' }}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => {
            const row = rowIndex + 1;
            return (
              <tr key={row} style={{ height: 'var(--grid-row-h)' }}>
                {Array.from({ length: cols }, (_, colIndex) => {
                  const col = colIndex + 1;
                  const key = `${row}-${col}`;
                  const cellData = gridData[key] || { value: '' };
                  const isSelected = selectedCells.has(key);
                  const isActive = activeCell === key;
                  const isTotal = col === 17;

                  const isFillTarget = fillPreview.has(key);
                  const showFillHandle = fillHandleCell === key && !isFilling.current;

                  const cellClasses = `relative border-b border-r border-grid-border transition-colors ${
                    col === 1 ? 'w-[150px]' : col === 17 ? 'w-[130px] bg-background border-l-2 border-l-gold' : 'w-[90px]'
                  } ${isSelected ? 'outline outline-2 z-10 outline-gold bg-gold/10' : ''} ${
                    isActive ? 'ring-2 ring-gold' : ''
                  } ${isFillTarget ? 'bg-gold/20 outline outline-1 outline-dashed outline-gold' : ''}`;

                  return (
                    <td
                      key={key}
                      className={cellClasses}
                      onMouseDown={(e) => !isTotal && handleMouseDown(e, row, col)}
                      onMouseEnter={() => {
                        handleMouseEnter(row, col);
                        handleFillEnter(row, col);
                      }}
                    >
                      {isTotal ? (
                        <div className="grid-cell-input grid-cell-input-total flex items-center justify-center h-full">
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
                      {showFillHandle && (
                        <div
                          className="absolute bottom-0 right-0 w-2 h-2 bg-gold cursor-crosshair z-20 border border-background"
                          style={{ transform: 'translate(50%, 50%)' }}
                          onMouseDown={handleFillHandleMouseDown}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
