import { ENV } from '../config/env';

const BASE = String(ENV.API_BASE_URL || '').trim().replace(/\/+$/, '');
let onSessionExpired = null;
export const setSessionExpiredHandler = (handler) => { onSessionExpired = handler; };
export const getApiUrl = () => BASE;

/** Native fetch automatically handles the backend's HttpOnly login cookie.
 * `credentials: include` is required on every admin call, including login.
 * No JWT is exposed to or stored in JavaScript. Backend handles permissions.
 */
export async function api(path, { body, headers, ...options } = {}) {
  if (!/^https?:\/\/[^/]+/i.test(BASE) || BASE.includes('YOUR-BACKEND-DOMAIN')) {
    throw new Error('Configure API_BASE_URL in src/config/env.js before using the app.');
  }
  const controller = new AbortController();
  // FPL recalculations, manual prize settlement and batch sends can outlast ordinary reads.
  // Do not prematurely report a financial mutation as failed while the server still processes it.
  const slowAction = /\/maintenance\/|\/settlement\/|\/refresh-scores|[?&]refresh=1|\/marketing\/campaigns\/run/.test(path);
  const timeoutMs = slowAction ? Math.max(Number(ENV.REQUEST_TIMEOUT_MS || 30000), 120000) : Number(ENV.REQUEST_TIMEOUT_MS || 30000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && body !== null ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {}),
      },
      ...(body !== undefined && body !== null ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    });
    let payload;
    try { payload = await response.json(); }
    catch { payload = { success: false, message: 'Server returned an invalid JSON response.' }; }
    if (!response.ok || payload?.success === false) {
      const err = new Error(payload?.message || `Request failed (${response.status}).`);
      err.status = response.status;
      err.errors = payload?.errors || [];
      if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
        onSessionExpired?.();
      }
      throw err;
    }
    return payload?.data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Connection timed out. Check your backend URL and network.');
    if (err instanceof TypeError && /network request failed/i.test(err.message)) {
      throw new Error('Cannot reach the backend. Check API_BASE_URL, HTTPS and server availability.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
export const adminApi = (path, options) => api(`/api/admin${path}`, options);
export const logoutApi = () => api('/api/auth/logout', { method: 'POST' });
export function buildQuery(values = {}) {
  return Object.entries(values)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}
export function money(value = 0, currency = 'USD') {
  const amount = Number(value || 0) / 100;
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return `$${amount.toFixed(2)}`; }
}
export function dateTime(value) {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  try { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(dt); }
  catch { return dt.toLocaleString(); }
}
export const humanize = (s) => String(s || '—').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const count = (v) => Number(v || 0).toLocaleString('en-GB');
export function competitionEntryLabel(league = {}) {
  if (league.freeEntry === true) return 'Free (Clash of the Captains)';
  const cents = Number(league.accessPriceCents);
  if (league.oneOffAllowed === true && Number.isFinite(cents) && cents > 0) return `${money(cents)} one-off or eligible subscription`;
  if (league.subscriptionOnly === true || league.priceType === 'subscription') return Number.isFinite(cents) && cents > 0 ? `From ${money(cents)} / subscription` : 'Paid subscription required';
  if (league.officialSupremeLeague !== true && Number(league.entryFeeCents) > 0) return `${money(league.entryFeeCents)} one-off`;
  return 'Access price unavailable';
}
export function whatsappHref(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `https://wa.me/263${digits.slice(1)}`;
  if (/^263\d{9}$/.test(digits)) return `https://wa.me/${digits}`;
  if (/^\d{9}$/.test(digits)) return `https://wa.me/263${digits}`;
  return digits ? `https://wa.me/${digits}` : '';
}
export function defaultDateRange() {
  const today = new Date();
  return {
    from: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 29, 1)).toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}
