// localStorage that never throws: private windows and blocked storage
// just mean nothing is remembered.
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* not saved */ }
  },
  del(key: string) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};
