/**
 * Frontend API Client — Drop-in replacement for Supabase client
 * 
 * Supports Supabase-style chaining:
 *   supabase.from('products').select('*').eq('is_active', true).order('sort_order')
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Token management ────────────────────────────────────────
let authToken: string | null = localStorage.getItem('auth_token');
let currentUser: { id: string; email: string } | null = null;
const authListeners: Set<(user: typeof currentUser) => void> = new Set();

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

// ── Table name mapping (kebab-case for URLs) ────────────────
const TABLE_URL_MAP: Record<string, string> = {
  about_page: 'about-page',
  client_logos: 'client-logos',
  contact_messages: 'contact-messages',
  hero_slides: 'hero-slides',
  product_images: 'product-images',
  product_variants: 'product-variants',
  product_variant_images: 'product-variant-images',
  quote_requests: 'quote-requests',
  seo_meta: 'seo-meta',
  site_settings: 'site-settings',
};

function tableUrl(table: string): string {
  return `${API_BASE}/${TABLE_URL_MAP[table] || table}`;
}

// ── Query Builder (mimics Supabase .from().select/insert/etc) ─
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

  // Make the builder thenable — this is what allows `await supabase.from(...).select(...).eq(...)`
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
          // Default to select if no method specified
          return await this._doSelect();
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  private async _doSelect(): Promise<{ data: any; error: any }> {
    const params = new URLSearchParams();
    if (this._selectCols) params.set('select', this._selectCols);

    const url = `${tableUrl(this.table)}?${params}`;
    const resp = await fetch(url, { headers: getHeaders() });
    if (!resp.ok) throw new Error(await resp.text());
    let data = await resp.json();

    // Client-side filtering
    if (this._filters.length > 0) {
      data = data.filter((row: any) =>
        this._filters.every(f => {
          if (f.op === 'eq') return row[f.column] === f.value || String(row[f.column]) === String(f.value);
          if (f.op === 'neq') return row[f.column] !== f.value;
          if (f.op === 'is_null') return row[f.column] === null || row[f.column] === undefined;
          return true;
        })
      );
    }

    // Not filters
    if (this._notFilters.length > 0) {
      data = data.filter((row: any) =>
        this._notFilters.every(f => {
          if (f.op === 'is' && f.value === null) return row[f.column] !== null;
          return true;
        })
      );
    }

    // In filters
    if (this._inFilters.length > 0) {
      data = data.filter((row: any) =>
        this._inFilters.every(f => f.values.includes(row[f.column]))
      );
    }

    // Client-side ordering
    if (this._orderCol) {
      const col = this._orderCol;
      const asc = this._orderAsc;
      data.sort((a: any, b: any) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this._limitVal) data = data.slice(0, this._limitVal);
    if (this._single) return { data: data[0] || null, error: null };
    return { data, error: null };
  }

  private async _doInsert(): Promise<{ data: any; error: any }> {
    let url = tableUrl(this.table);
    const isPublicTable = ['contact_messages', 'quote_requests'].includes(this.table);
    if (isPublicTable && !authToken) {
      url = `${tableUrl(this.table)}/public`;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(this._payload),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    return { data, error: null };
  }

  private async _doUpdate(): Promise<{ data: any; error: any }> {
    const idFilter = this._filters.find(f => f.column === 'id');
    const keyFilter = this._filters.find(f => f.column === 'setting_key');
    
    if (idFilter) {
      const resp = await fetch(`${tableUrl(this.table)}/${idFilter.value}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(this._payload),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return { data, error: null };
    }
    
    // For site_settings updates by setting_key, use the POST (upsert) endpoint
    if (keyFilter && this.table === 'site_settings') {
      const resp = await fetch(tableUrl(this.table), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ setting_key: keyFilter.value, ...this._payload }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return { data, error: null };
    }

    // Generic fallback: if there's any filter, fetch matching rows to get their ID, then update by ID
    if (this._filters.length > 0) {
      const selectBuilder = new QueryBuilder(this.table);
      selectBuilder.select('*');
      this._filters.forEach(f => {
        if (f.op === 'eq') selectBuilder.eq(f.column, f.value);
      });
      const { data: rows } = await selectBuilder;
      if (rows && rows.length > 0 && rows[0].id) {
        const resp = await fetch(`${tableUrl(this.table)}/${rows[0].id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(this._payload),
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        return { data, error: null };
      }
      return { data: null, error: null };
    }

    throw new Error('update() requires at least one filter (e.g. .eq("id", value))');
  }

  private async _doDelete(): Promise<{ data: any; error: any }> {
    const idFilter = this._filters.find(f => f.column === 'id');
    if (idFilter) {
      const resp = await fetch(`${tableUrl(this.table)}/${idFilter.value}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!resp.ok) throw new Error(await resp.text());
      return { data: null, error: null };
    }
    // Support delete by product_id (for variants/images cleanup)
    const prodFilter = this._filters.find(f => f.column === 'product_id');
    if (prodFilter) {
      const resp = await fetch(`${tableUrl(this.table)}/by-product/${prodFilter.value}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!resp.ok) throw new Error(await resp.text());
      return { data: null, error: null };
    }
    // Support delete by .in('product_id', [...])
    const inFilter = this._inFilters.find(f => f.column === 'product_id');
    if (inFilter) {
      // Delete one by one
      for (const pid of inFilter.values) {
        await fetch(`${tableUrl(this.table)}/by-product/${pid}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
      }
      return { data: null, error: null };
    }
    // Support delete by .in('id', [...])
    const inIdFilter = this._inFilters.find(f => f.column === 'id');
    if (inIdFilter) {
      for (const id of inIdFilter.values) {
        await fetch(`${tableUrl(this.table)}/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
      }
      return { data: null, error: null };
    }
    throw new Error('delete() requires .eq("id", value) or .eq("product_id", value)');
  }

  private async _doUpsert(): Promise<{ data: any; error: any }> {
    if (this.table === 'site_settings') {
      return this._doInsert();
    }
    const idFilter = this._filters.find(f => f.column === 'id');
    if (idFilter) {
      this._method = 'update';
      return this._doUpdate();
    }
    return this._doInsert();
  }
}

// ── Storage adapter ─────────────────────────────────────────
function createStorageBucket(bucket: string) {
  return {
    async upload(filePath: string, file: File | Blob) {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API_BASE}/upload/${bucket}?path=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Upload failed' }));
        return { data: null, error: { message: err.error || 'Upload failed' } };
      }
      const data = await resp.json();
      return { data, error: null };
    },
    getPublicUrl(filePath: string) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
      return { data: { publicUrl: `${baseUrl}/uploads/${bucket}/${filePath}` } };
    },
  };
}

// ── Auth adapter ────────────────────────────────────────────
const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        return { data: null, error: { message: err.error } };
      }
      const data = await resp.json();
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      authListeners.forEach(fn => fn(currentUser));
      return { data: { user: data.user, session: { access_token: data.token } }, error: null };
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
    const listener = (user: typeof currentUser) => {
      callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user, access_token: authToken } : null);
    };
    authListeners.add(listener);
    const user = localStorage.getItem('auth_user');
    if (user) listener(JSON.parse(user));
    else listener(null);

    return {
      data: {
        subscription: {
          unsubscribe: () => { authListeners.delete(listener); },
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
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: () => {},
};

// For backward compatibility — alias
export const supabase = api;
