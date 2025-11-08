function getBackendURL(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const hostname = window.location.hostname;
  console.log('Detecting backend URL for hostname:', hostname);

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = 'http://localhost:4000';
    console.log('Using local backend:', url);
    return url;
  }

  if (hostname.endsWith('.lp.dev')) {
    const appId = hostname.replace('.lp.dev', '');
    const url = `https://${appId}.api.lp.dev`;
    console.log('Using .lp.dev backend:', url);
    return url;
  }

  if (hostname.includes('.frontend.encr.app')) {
    const envApp = hostname.replace('.frontend.encr.app', '');
    const url = `https://${envApp}.encr.app`;
    console.log('Using .encr.app backend:', url);
    return url;
  }

  if (hostname.endsWith('.encr.app')) {
    const url = `https://${hostname}`;
    console.log('Using .encr.app backend (direct):', url);
    return url;
  }

  console.warn(`Unknown hostname pattern: ${hostname}, trying same-origin`);
  return window.location.origin;
}

export const BACKEND_URL = getBackendURL();
console.log('Backend URL configured as:', BACKEND_URL);
