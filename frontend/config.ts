function getBackendURL(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const hostname = window.location.hostname;
  const origin = window.location.origin;
  console.log('Detecting backend URL for hostname:', hostname);

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = 'http://localhost:4000';
    console.log('Using local backend:', url);
    return url;
  }

  console.log('Using same origin for backend (no CORS):', origin);
  return origin;
}

export const BACKEND_URL = getBackendURL();
console.log('Backend URL configured as:', BACKEND_URL);
