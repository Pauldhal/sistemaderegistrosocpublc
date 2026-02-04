import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GridData, FinanceSettings, RegisterData } from './useGridData';
import type { Json } from '@/integrations/supabase/types';

interface UserData {
  grid_data: GridData;
  settings: FinanceSettings;
  registers: RegisterData;
}

const DEFAULT_DATA: UserData = {
  grid_data: {},
  settings: { tasa: 90, comision: 12 },
  registers: { daily: {}, weekly: {}, monthly: {} },
};

export function useUserData(userId: string | undefined) {
  const [data, setData] = useState<UserData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const { data: userData, error } = await supabase
        .from('user_grid_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading data:', error);
        setLoading(false);
        return;
      }

      if (userData) {
        setData({
          grid_data: (userData.grid_data as unknown as GridData) || {},
          settings: (userData.settings as unknown as FinanceSettings) || DEFAULT_DATA.settings,
          registers: (userData.registers as unknown as RegisterData) || DEFAULT_DATA.registers,
        });
      } else {
        // Create initial record for new user
        const { error: insertError } = await supabase
          .from('user_grid_data')
          .insert({
            user_id: userId,
            grid_data: {} as unknown as Json,
            settings: DEFAULT_DATA.settings as unknown as Json,
            registers: DEFAULT_DATA.registers as unknown as Json,
          });
        
        if (insertError) {
          console.error('Error creating user data:', insertError);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [userId]);

  // Auto-save with debounce
  const saveData = useCallback(async (newData: UserData) => {
    if (!userId) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('user_grid_data')
        .update({
          grid_data: newData.grid_data as unknown as Json,
          settings: newData.settings as unknown as Json,
          registers: newData.registers as unknown as Json,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving data:', error);
      }
    }, 500);
  }, [userId]);

  const updateGridData = useCallback((gridData: GridData) => {
    setData(prev => {
      const newData = { ...prev, grid_data: gridData };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const updateSettings = useCallback((settings: FinanceSettings) => {
    setData(prev => {
      const newData = { ...prev, settings };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const updateRegisters = useCallback((registers: RegisterData) => {
    setData(prev => {
      const newData = { ...prev, registers };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const resetAll = useCallback(async () => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('user_grid_data')
      .update({
        grid_data: {} as unknown as Json,
        registers: DEFAULT_DATA.registers as unknown as Json,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting data:', error);
      return;
    }

    setData(prev => ({
      ...prev,
      grid_data: {},
      registers: DEFAULT_DATA.registers,
    }));
  }, [userId]);

  return {
    ...data,
    loading,
    updateGridData,
    updateSettings,
    updateRegisters,
    resetAll,
  };
}
