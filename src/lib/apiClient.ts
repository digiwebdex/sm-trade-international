/**
 * Frontend API Client — Drop-in replacement for Supabase client
 * 
 * Routes database queries through the real Supabase client,
 * while keeping custom VPS auth & storage adapters.
 */
import { supabase as realSupabase } from '@/integrations/supabase/client';

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

// ── Storage adapter ─────────────────────────────────────────
function createStorageBucket(bucket: string) {
  return {
    async upload(filePath: string, file: File | Blob) {
      // Use real Supabase storage
      const { data, error } = await realSupabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (error) return { data: null, error: { message: error.message } };
      const { data: urlData } = realSupabase.storage.from(bucket).getPublicUrl(data.path);
      return { data: { path: data.path, publicUrl: urlData.publicUrl }, error: null };
    },
    getPublicUrl(filePath: string) {
      const { data } = realSupabase.storage.from(bucket).getPublicUrl(filePath);
      return { data: { publicUrl: data.publicUrl } };
    },
  };
}

// ── Query Builder using real Supabase client ────────────────
class QueryBuilder {
  private table: string;
  private _filters: Array<{ column: string; op: string; value: any }> = [];
  private _orderCol?: string;
  private _orderAsc = true;
  private _limitVal?: number;
  private _single = false;
  private _selectCols?: string;
  private _method: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null = null;
  private _payload?: any;
  private _notFilters: Array<{ column: string; op: string; value: any }> = [];
  private _inFilters: Array<{ column: string; values: any[] }> = [];
  private _maybeSingle = false;
  private _returnSelect?: string; // for .insert().select() chain

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
    // If a write method was already set, this is a "return data" request
    if (this._method === 'insert' || this._method === 'update' || this._method === 'upsert') {
      this._returnSelect = columns || '*';
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
      switch (this._method) {
        case 'select':
          return await this._doSelect();
        case 'insert':
          return await this._doInsert();
        case 'update':
          return await this._doUpdate();
        case 'delete':
          return await this._doDelete();
        case 'upsert':
          return await this._doUpsert();
        default:
          return await this._doSelect();
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  private _applyFilters(query: any): any {
    let q = query;
    for (const f of this._filters) {
      if (f.op === 'eq') q = q.eq(f.column, f.value);
      if (f.op === 'neq') q = q.neq(f.column, f.value);
      if (f.op === 'is_null') q = q.is(f.column, null);
    }
    for (const f of this._notFilters) {
      if (f.op === 'is' && f.value === null) q = q.not(f.column, 'is', null);
    }
    for (const f of this._inFilters) {
      q = q.in(f.column, f.values);
    }
    return q;
  }

  private async _doSelect(): Promise<{ data: any; error: any }> {
    let query = realSupabase.from(this.table as any).select(this._selectCols || '*');
    query = this._applyFilters(query);
    if (this._orderCol) {
      query = query.order(this._orderCol, { ascending: this._orderAsc });
    }
    if (this._limitVal) {
      query = query.limit(this._limitVal);
    }
    if (this._maybeSingle) {
      return await query.maybeSingle();
    }
    if (this._single) {
      return await query.single();
    }
    return await query;
  }

  private async _doInsert(): Promise<{ data: any; error: any }> {
    let query = realSupabase.from(this.table as any).insert(this._payload as any);
    if (this._returnSelect) {
      query = (query as any).select(this._returnSelect);
    }
    if (this._single) {
      return await (query as any).single();
    }
    return await query;
  }

  private async _doUpdate(): Promise<{ data: any; error: any }> {
    let query = realSupabase.from(this.table as any).update(this._payload as any);
    query = this._applyFilters(query);
    if (this._returnSelect) {
      query = (query as any).select(this._returnSelect);
    }
    if (this._single) {
      return await (query as any).single();
    }
    return await query;
  }

  private async _doDelete(): Promise<{ data: any; error: any }> {
    let query = realSupabase.from(this.table as any).delete();
    query = this._applyFilters(query);
    return await query;
  }

  private async _doUpsert(): Promise<{ data: any; error: any }> {
    let query = realSupabase.from(this.table as any).upsert(this._payload as any);
    if (this._returnSelect) {
      query = (query as any).select(this._returnSelect);
    }
    if (this._single) {
      return await (query as any).single();
    }
    return await query;
  }
}

// ── Auth adapter ────────────────────────────────────────────
const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // Try real Supabase auth first
    const { data, error } = await realSupabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Fallback to VPS auth
      try {
        const resp = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!resp.ok) {
          const err = await resp.json();
          return { data: null, error: { message: err.error || error.message } };
        }
        const vpsData = await resp.json();
        authToken = vpsData.token;
        currentUser = vpsData.user;
        localStorage.setItem('auth_token', vpsData.token);
        localStorage.setItem('auth_user', JSON.stringify(vpsData.user));
        authListeners.forEach(fn => fn(currentUser));
        return { data: { user: vpsData.user, session: { access_token: vpsData.token } }, error: null };
      } catch (fallbackErr: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    // Real Supabase auth succeeded
    currentUser = data.user ? { id: data.user.id, email: data.user.email || '' } : null;
    authListeners.forEach(fn => fn(currentUser));
    return { data, error: null };
  },

  async signOut() {
    await realSupabase.auth.signOut();
    authToken = null;
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    authListeners.forEach(fn => fn(null));
  },

  async getSession() {
    const { data, error } = await realSupabase.auth.getSession();
    if (data?.session) {
      currentUser = data.session.user ? { id: data.session.user.id, email: data.session.user.email || '' } : null;
      return { data, error };
    }
    // Fallback to VPS token
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
    // Use real Supabase auth state
    const { data } = realSupabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        currentUser = session.user ? { id: session.user.id, email: session.user.email || '' } : null;
      } else {
        currentUser = null;
      }
      callback(event, session);
    });

    // Also check VPS auth fallback
    const vpsUser = localStorage.getItem('auth_user');
    if (vpsUser) {
      const parsed = JSON.parse(vpsUser);
      currentUser = parsed;
      callback('SIGNED_IN', { user: parsed, access_token: localStorage.getItem('auth_token') });
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => { data.subscription.unsubscribe(); },
        },
      },
    };
  },
};

// ── Main API object (drop-in replacement for supabase) ──────
export const api = {
  from: (table: string) => new QueryBuilder(table),
  storage: { from: (bucket: string) => createStorageBucket(bucket) },
  auth,
  channel: (name: string) => realSupabase.channel(name),
  removeChannel: (channel: any) => realSupabase.removeChannel(channel),
};

// For backward compatibility — alias
export const supabase = api;
