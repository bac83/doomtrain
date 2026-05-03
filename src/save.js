// =====================================================
// Save — localStorage persistence for run progress
// =====================================================
//
// Save written after each completed level. Cleared on full-run finish
// or fresh-start from menu. Schema:
//   { version, nextIdx, totalKills, totalCoffee, runTimeMs }

const Save = (() => {
  const KEY = 'doomtrain_save_v1';
  const SCHEMA_VERSION = 1;

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (_) { return false; }
  }

  function read() {
    try {
      const s = localStorage.getItem(KEY);
      if (!s) return null;
      const data = JSON.parse(s);
      if (!data || data.version !== SCHEMA_VERSION) {
        clear();
        return null;
      }
      return data;
    } catch (_) { return null; }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  function exists() {
    const s = read();
    return !!(s && typeof s.nextIdx === 'number');
  }

  return { write, read, clear, exists };
})();
