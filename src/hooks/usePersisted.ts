import { useCallback, useRef, useState } from 'react';

export function usePersisted<T>(key: string, init: () => T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch (e) {
      /* almacenamiento no disponible: se usa el valor inicial */
    }
    return init();
  });
  const ref = useRef<T>(val);
  const set = useCallback(
    (next: T) => {
      ref.current = next;
      setVal(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        /* sin persistencia, la sesión sigue funcionando en memoria */
      }
    },
    [key]
  );
  return [val, set, ref] as const;
}
