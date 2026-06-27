// Client-side Cache Manager for instant page transitions and caching
const CACHE_PREFIX = 'tuyenlv_manga_';

export function getCache(key) {
  if (typeof window === 'undefined') return null;
  
  // 1. Check in-memory global cache first (fastest, 0ms)
  window.__manga_cache__ = window.__manga_cache__ || {};
  if (window.__manga_cache__[key]) {
    return window.__manga_cache__[key];
  }
  
  // 2. Check SessionStorage fallback
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + key);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Sync back to memory
      window.__manga_cache__[key] = parsed;
      return parsed;
    }
  } catch (e) {
    // Ignore storage errors (e.g. private mode)
  }
  return null;
}

export function setCache(key, data) {
  if (typeof window === 'undefined') return;
  
  // 1. Save in-memory
  window.__manga_cache__ = window.__manga_cache__ || {};
  window.__manga_cache__[key] = data;
  
  // 2. Save in SessionStorage for persistence across tab reloads
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    // Session storage quota might be exceeded for massive base64, fail silently
  }
}
