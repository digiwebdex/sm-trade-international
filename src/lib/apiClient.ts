/**
 * Frontend API Client — All data flows through the VPS backend
 * No Supabase dependency for database or storage.
 */

const PREVIEW_HOST_MARKERS = ['lovableproject.com', 'id-preview--', 'lovable.app'];
const DEFAULT_PUBLIC_ORIGIN = 'https://smtradeint.com';
const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const isPreviewHost = PREVIEW_HOST_MARKERS.some(marker => hostname.includes(marker));

export const PUBLIC_ORIGIN = import.meta.env.VITE_PUBLIC_SITE_ORIGIN
  || (isPreviewHost ? DEFAULT_PUBLIC_ORIGIN : (isBrowser ? window.location.origin : DEFAULT_PUBLIC_ORIGIN));

export const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (isPreviewHost ? `${DEFAULT_PUBLIC_ORIGIN}/api` : '/api');

// ── Token management ────────────────────────────────────────
let authToken: string | null = localStorage.getItem('auth_token');
let currentUser: { id: string; email: string } | null = null;
const authListeners: Set<(user: typeof currentUser) => void> = new Set();

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

// ── Asset URL normalization ─────────────────────────────────
function normalizeAssetUrl(val: string): string {
  if (!val || typeof val !== 'string') return val;
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return val;
  // Relative paths like /uploads/... or uploads/...
  const cleanPath = val.startsWith('/') ? val : `/${val}`;
  return `${PUBLIC_ORIGIN}${cleanPath}`;
}

const IMAGE_FIELDS = ['image_url', 'logo_url', 'og_image_url', 'cta_link'];

function normalizeRowAssets(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const key of IMAGE_FIELDS) {
    if (out[key] && typeof out[key] === 'string') {
      out[key] = normalizeAssetUrl(out[key]);
    }
  }
  return out;
}

// ── Storage adapter (VPS upload) ────────────────────────────
function createStorageBucket(bucket: string) {
  return {
    async upload(filePath: string, file: File | Blob) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', filePath);
      try {
        const resp = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: 'Upload failed' }));
          return { data: null, error: { message: err.error || 'Upload failed' } };
        }
        const result = await resp.json();
        const publicUrl = normalizeAssetUrl(result.url || result.path || '');
        return { data: { path: result.path || filePath, publicUrl }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    getPublicUrl(filePath: string) {
      return { data: { publicUrl: normalizeAssetUrl(filePath) } };
    },
  };
}

// ── Query Builder (VPS REST API) ────────────────────────────
class QueryBuilder {
  private table: string;
  private _filters: Array<{ column: string; op: string; value: any }> = [];
  private _orderCol?: string;
  private _orderAsc = true;
  private _limitVal?: number;
  private _single = false;
  private _maybeSingle = false;
  private _selectCols?: string;
  private _method: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null = null;
  private _payload?: any;
  private _notFilters: Array<{ column: string; op: string; value: any }> = [];
  private _inFilters: Array<{ column: string; values: any[] }> = [];
  private _returnSelect = false;

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: any): this {
    this._filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: any): this {
    this._filters.push({ column, op: 'neq', value });
    return this;
  }

  not(column: string, op: string, value: any): this {
    this._notFilters.push({ column, op, value });
    return this;
  }

  is(column: string, value: any): this {
    if (value === null) {
      this._filters.push({ column, op: 'is_null', value: null });
    }
    return this;
  }

  in(column: string, values: any[]): this {
    this._inFilters.push({ column, values });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this._orderCol = column;
    this._orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number): this {
    this._limitVal = n;
    return this;
  }

  single(): this {
    this._single = true;
    return this;
  }

  maybeSingle(): this {
    this._maybeSingle = true;
    this._single = true;
    return this;
  }

  select(columns?: string): this {
    if (this._method === 'insert' || this._method === 'update' || this._method === 'upsert') {
      this._returnSelect = true;
      this._selectCols = columns;
      return this;
    }
    this._method = 'select';
    this._selectCols = columns;
    return this;
  }

  insert(payload: any): this {
    this._method = 'insert';
    this._payload = payload;
    return this;
  }

  update(payload: any): this {
    this._method = 'update';
    this._payload = payload;
    return this;
  }

  delete(): this {
    this._method = 'delete';
    return this;
  }

  upsert(payload: any): this {
    this._method = 'upsert';
    this._payload = payload;
    return this;
  }

  then(
    resolve?: ((value: { data: any; error: any }) => any) | null,
    reject?: ((reason: any) => any) | null
  ): Promise<any> {
    return this._execute().then(resolve, reject);
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      const method = this._method || 'select';
      const url = new URL(`${API_BASE}/${this.table}`, window.location.origin);

      // Build query params for filters
      for (const f of this._filters) {
        if (f.op === 'is_null') {
          url.searchParams.append(`${f.column}`, 'is.null');
        } else {
          url.searchParams.append(`${f.column}`, `${f.op}.${f.value}`);
        }
      }
      for (const f of this._notFilters) {
        url.searchParams.append(`${f.column}`, `not.${f.op}.${f.value}`);
      }
      for (const f of this._inFilters) {
        url.searchParams.append(`${f.column}`, `in.(${f.values.join(',')})`);
      }

      if (this._orderCol) {
        url.searchParams.append('order', `${this._orderCol}.${this._orderAsc ? 'asc' : 'desc'}`);
      }
      if (this._limitVal) {
        url.searchParams.append('limit', String(this._limitVal));
      }
      if (this._selectCols && method === 'select') {
        url.searchParams.append('select', this._selectCols);
      }

      let httpMethod = 'GET';
      let body: string | undefined;

      switch (method) {
        case 'insert':
          httpMethod = 'POST';
          body = JSON.stringify(this._payload);
          break;
        case 'update':
          httpMethod = 'PATCH';
          body = JSON.stringify(this._payload);
          break;
        case 'delete':
          httpMethod = 'DELETE';
          break;
        case 'upsert':
          httpMethod = 'PUT';
          body = JSON.stringify(this._payload);
          break;
        default:
          httpMethod = 'GET';
      }

      const resp = await fetch(url.toString(), {
        method: httpMethod,
        headers: getHeaders(),
        body,
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        return { data: null, error: { message: errBody.error || `HTTP ${resp.status}` } };
      }

      let data = await resp.json().catch(() => null);

      // Normalize assets
      if (Array.isArray(data)) {
        data = data.map(normalizeRowAssets);
      } else if (data && typeof data === 'object') {
        // Some endpoints wrap in { data: [...] }
        if (Array.isArray(data.data)) {
          data = data.data.map(normalizeRowAssets);
        } else if (data.data && typeof data.data === 'object') {
          data = normalizeRowAssets(data.data);
        } else {
          data = normalizeRowAssets(data);
        }
      }

      if (this._single && Array.isArray(data)) {
        if (data.length === 0) {
          if (this._maybeSingle) return { data: null, error: null };
          return { data: null, error: { message: 'No rows found' } };
        }
        return { data: data[0], error: null };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

// ── Auth adapter (VPS only) ─────────────────────────────────
const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Login failed' }));
        return { data: null, error: { message: err.error || 'Login failed' } };
      }
      const vpsData = await resp.json();
      authToken = vpsData.token;
      currentUser = vpsData.user;
      localStorage.setItem('auth_token', vpsData.token);
      localStorage.setItem('auth_user', JSON.stringify(vpsData.user));
      authListeners.forEach(fn => fn(currentUser));
      return { data: { user: vpsData.user, session: { access_token: vpsData.token } }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },

  async signOut() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    authListeners.forEach(fn => fn(null));
  },

  async getSession() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    if (token && user) {
      authToken = token;
      currentUser = JSON.parse(user);
      try {
        const resp = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error('Token expired');
        return { data: { session: { access_token: token, user: currentUser } }, error: null };
      } catch {
        await auth.signOut();
      }
    }
    return { data: { session: null }, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const vpsUser = localStorage.getItem('auth_user');
    const vpsToken = localStorage.getItem('auth_token');
    if (vpsUser && vpsToken) {
      currentUser = JSON.parse(vpsUser);
      setTimeout(() => callback('SIGNED_IN', { user: currentUser, access_token: vpsToken }), 0);
    }

    const listener = (user: typeof currentUser) => {
      if (user) {
        callback('SIGNED_IN', { user, access_token: localStorage.getItem('auth_token') });
      } else {
        callback('SIGNED_OUT', null);
      }
    };
    authListeners.add(listener);

    return {
      data: {
        subscription: {
          unsubscribe: () => { authListeners.delete(listener); },
        },
      },
    };
  },
};

// ── Realtime stub (no-op for VPS) ───────────────────────────
function createChannel(name: string) {
  const handlers: any[] = [];
  return {
    on(_event: string, _filter: any, cb: any) {
      handlers.push(cb);
      return this;
    },
    subscribe() { return this; },
    unsubscribe() {},
  };
}

// ── Main API object ─────────────────────────────────────────
export const api = {
  from: (table: string) => new QueryBuilder(table),
  storage: { from: (bucket: string) => createStorageBucket(bucket) },
  auth,
  channel: (name: string) => createChannel(name),
  removeChannel: (_channel: any) => {},
};

export const supabase = api;
