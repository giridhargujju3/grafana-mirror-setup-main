export const getApiUrl = () => {
  // 1. Check for environment variable (build time)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Check if running in browser
  if (typeof window !== 'undefined') {
    // Dynamically construct the API URL based on the current window location
    // This works for localhost, 127.0.0.1, or any server IP/hostname
    return `http://${window.location.hostname}:3002/api`;
  }

  // 3. Fallback (should rarely be reached in browser)
  return 'http://localhost:3002/api';
};

export const API_BASE_URL = getApiUrl();
