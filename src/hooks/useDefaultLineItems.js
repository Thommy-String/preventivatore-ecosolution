import { useCallback } from 'react';
import { DEFAULT_LINE_ITEMS } from '../data/defaultLineItems';
import { useLocalStorageState } from './useLocalStorageState';

const STORAGE_KEY = '@ecosolution/default-line-items';

export function useDefaultLineItems() {
  const [items, setItems, resetItems] = useLocalStorageState(STORAGE_KEY, DEFAULT_LINE_ITEMS);

  const addDefaultLineItem = useCallback(() => {
    const nextItem = {
      id: `default-${Date.now()}`,
      title: 'Nuova voce',
      description: '',
      price: 0,
      quantity: 1,
      unit: 'pz'
    };
    setItems(prev => [...prev, nextItem]);
  }, [setItems]);

  const updateDefaultLineItem = useCallback((id, updates) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, [setItems]);

  const removeDefaultLineItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  const duplicateDefaultLineItem = useCallback((id) => {
    setItems(prev => {
      const source = prev.find(item => item.id === id);
      if (!source) return prev;
      const clone = { ...source, id: `default-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
      return [...prev, clone];
    });
  }, [setItems]);

  const resetDefaultLineItems = useCallback(() => resetItems(), [resetItems]);

  return {
    items,
    addDefaultLineItem,
    updateDefaultLineItem,
    removeDefaultLineItem,
    duplicateDefaultLineItem,
    resetDefaultLineItems
  };
}