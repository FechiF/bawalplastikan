import { useEffect, useState } from 'react';

// Same hook as the Epicenter app, with try/catch because storage can be
// blocked (private windows, strict cookie settings) on a public WordPress page.
export function useLocalStorageState(initialState, key) {
  const [value, setValue] = useState(() => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
