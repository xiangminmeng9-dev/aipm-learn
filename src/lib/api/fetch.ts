/**
 * Global API fetch wrapper with automatic 401 handling.
 *
 * Drop-in replacement for fetch() that redirects to /login on 401 responses.
 * Identical signature to global fetch — migration is just: fetch → apiFetch
 */

let isRedirecting = false;

const AUTH_ROUTES = ['/login', '/register'];

function isApiRoute(input: string | URL | Request): boolean {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.pathname
      : new URL(input.url).pathname;
  return url.startsWith('/api/');
}

export async function apiFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const response = await globalThis.fetch(input, init);

  if (
    response.status === 401
    && typeof window !== 'undefined'
    && isApiRoute(input)
    && !isRedirecting
    && !AUTH_ROUTES.some(r => window.location.pathname.startsWith(r))
  ) {
    isRedirecting = true;
    setTimeout(() => { isRedirecting = false; }, 5000);
    const next = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }

  return response;
}
