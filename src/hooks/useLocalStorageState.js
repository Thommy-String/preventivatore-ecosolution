import { useEffect, useMemo, useState } from 'react';

export function useLocalStorageState(key, defaultValue) {
  const initial = useMemo(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Unable to read ${key} from localStorage`, error);
    }
    return defaultValue;
  }, [key, defaultValue]);

  const [state, setState] = useState(initial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Unable to persist ${key} to localStorage`, error);
    }
  }, [key, state]);

  const resetState = () => setState(defaultValue);

  return [state, setState, resetState];
}