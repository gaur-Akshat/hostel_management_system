// In production build, set VITE_API_URL to your API origin (e.g. https://api.example.com). Leave empty for same-origin or proxy.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

// Example: health check (GET /api/health)
export const health = () => api('/health');

export async function api(path, options = {}) {
  const { body, ...rest } = options;
  const fetchOptions = {
    ...rest,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  };
  if (body != null && typeof body === 'object' && !(body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(body);
  } else if (body != null) {
    fetchOptions.body = body;
  }
  const res = await fetch(`${BASE}${path}`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const auth = {
  me: () => api('/auth/me'),
  signup: (body) => api('/auth/signup', { method: 'POST', body }),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
};

export const student = {
  me: () => api('/student/me'),
  list: () => api('/student/list'),
  get: (id) => api(`/student/${id}`),
};
