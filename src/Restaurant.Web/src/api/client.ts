import type { LoginResponse } from './types';

const SESSION_KEY = 'restaurant.session';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function loadSession(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as LoginResponse;
    return new Date(session.expiresAt) > new Date() ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session: LoginResponse | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode or blocked storage: the session simply won't survive a reload.
  }
}

export const getToken = () => loadSession()?.token ?? null;

let unauthorizedHandler: (() => void) | null = null;

/** Called when the server rejects the stored token, so the app can send the user back to login. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { method: options.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, "Server bilan aloqa yo'q. Internetni yoki serverni tekshiring.");
  }

  if (response.status === 401 && token) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function readError(response: Response): Promise<string> {
  if (response.status === 429) return "Juda ko'p urinish. Bir daqiqadan so'ng qayta urinib ko'ring.";
  if (response.status === 403) return "Bu amal uchun ruxsatingiz yo'q.";

  try {
    const problem = (await response.json()) as { title?: string; errors?: Record<string, string[]> };
    const firstFieldError = problem.errors ? Object.values(problem.errors).flat()[0] : undefined;
    if (firstFieldError) return "Ma'lumotlar noto'g'ri to'ldirilgan: " + firstFieldError;
    if (problem.title) return problem.title;
  } catch {
    // Not a JSON body; fall through to the generic message.
  }

  return `Xatolik yuz berdi (${response.status}).`;
}
