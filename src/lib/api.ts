import config from '../../config.json';

export const getApiUrl = () => {
  // 1. Check for environment variable (build time)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Check if running in browser - use config.json
  if (typeof window !== 'undefined') {
    const host = config.apiHost || window.location.hostname;
    const port = config.apiPort || 3002;
    return `http://${host}:${port}/api`;
  }

  // 3. Fallback
  return `http://${config.apiHost || 'localhost'}:${config.apiPort || 3002}/api`;
};

export const getApiKey = () => {
  return config.apiKey || '';
};

export const API_BASE_URL = getApiUrl();
export const API_KEY = getApiKey();
