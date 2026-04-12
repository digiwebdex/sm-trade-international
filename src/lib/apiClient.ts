/**
 * Frontend API Client — All data flows through the VPS backend.
 * Client-side filtering/ordering because the VPS CRUD returns all rows.
 */

const PREVIEW_HOST_MARKERS = ['lovableproject.com', 'id-preview--', 'lovable.app'];
const DEFAULT_PUBLIC_ORIGIN = 'https://smtradeint.com';
const UPLOAD_ROUTE_PREFIX = '/uploads';
const KNOWN_UPLOAD_BUCKETS = ['cms-images', 'products', 'quote-attachments'] as const;
const CMS_UPLOAD_FOLDERS = ['products', 'gallery', 'hero-slides', 'clients', 'seo', 'product-views', 'variant-images', 'variants'] as const;
const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const isPreviewHost = PREVIEW_HOST_MARKERS.some(marker => hostname.includes(marker));

export const PUBLIC_ORIGIN = import.meta.env.VITE_PUBLIC_SITE_ORIGIN
  || (isPreviewHost ? DEFAULT_PUBLIC_ORIGIN : (isBrowser ? window.location.origin : DEFAULT_PUBLIC_ORIGIN));

export const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (isPreviewHost ? `${DEFAULT_PUBLIC_ORIGIN}/api` : '/api');

function joinPublicOrigin(pathname: string): string {
  return `${PUBLIC_ORIGIN}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function toUploadPath(pathname: string): string | null {
  const cleanPath = String(pathname || '').replace(/^\/+/, '');
  if (!cleanPath) return null;
  if (cleanPath.startsWith('uploads/')) return `/${cleanPath}`;

  if (KNOWN_UPLOAD_BUCKETS.some(bucket => cleanPath === bucket || cleanPath.startsWith(`${bucket}/`))) {
    return `${UPLOAD_ROUTE_PREFIX}/${cleanPath}`;
  }

  if (CMS_UPLOAD_FOLDERS.some(folder => cleanPath === folder || cleanPath.startsWith(`${folder}/`))) {
    return `${UPLOAD_ROUTE_PREFIX}/cms-images/${cleanPath}`;
  }

  return null;
}

// ── Table name → VPS route name mapping ─────────────────────
const TABLE_ROUTE_MAP: Record<string, string> = {
  hero_slides: 'hero-slides',
  client_logos: 'client-logos',
  about_page: 'about-page',
  seo_meta: 'seo-meta',
  contact_messages: 'contact-messages',
  quote_requests: 'quote-requests',
  product_variants: 'product-variants',
  product_images: 'product-images',
  product_variant_images: 'product-variant-images',
  site_settings: 'site-settings',
};

function tableToRoute(table: string): string {
  return TABLE_ROUTE_MAP[table] || table;
}

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
  if (val.startsWith('data:') || val.startsWith('blob:')) return val;

  if (val.startsWith('http://') || val.startsWith('https://')) {
    try {
      const url = new URL(val);
      const uploadPath = toUploadPath(url.pathname);
      return uploadPath ? joinPublicOrigin(`${uploadPath}${url.search}`) : val;
    } catch {
      return val;
    }
  }

  const uploadPath = toUploadPath(val);
  if (uploadPath) return joinPublicOrigin(uploadPath);

  const cleanPath = val.startsWith('/') ? val : `/${val}`;
  return joinPublicOrigin(cleanPath);
}

const IMAGE_FIELDS = ['image_url', 'logo_url', 'og_image_url'];

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
      const cleanFilePath = String(filePath || '').replace(/^\/+/, '');
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadUrl = `${API_BASE}/upload/${encodeURIComponent(bucket)}${cleanFilePath ? `?path=${encodeURIComponent(cleanFilePath)}` : ''}`;
        const resp = await fetch(uploadUrl, {
          method: 'POST',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: 'Upload failed' }));
          return { data: null, error: { message: err.error || 'Upload failed' } };
        }
        const result = await resp.json();
        const storedPath = result.path || (cleanFilePath ? `${bucket}/${cleanFilePath}` : bucket);
        const publicUrl = normalizeAssetUrl(result.publicUrl || storedPath || '');
        return { data: { path: storedPath, publicUrl }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    getPublicUrl(filePath: string) {
      const cleanFilePath = String(filePath || '').replace(/^\/+/, '');
      const storedPath = cleanFilePath.startsWith(`${bucket}/`) ? cleanFilePath : `${bucket}/${cleanFilePath}`;
      return { data: { publicUrl: normalizeAssetUrl(storedPath) } };
    },
  };
}

// ── Query Builder (VPS REST API + client-side filtering) ────
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

  // ── Client-side filter/sort/limit applied to fetched rows ──
  private _applyClientFilters(rows: any[]): any[] {
    let result = rows;

    // Apply eq/neq filters
    for (const f of this._filters) {
      if (f.op === 'eq') {
        result = result.filter(r => {
          const v = r[f.column];
          // Handle boolean comparison: "true"/"false" strings vs actual booleans
          if (typeof f.value === 'boolean') return v === f.value;
          if (f.value === 'true') return v === true || v === 'true';
          if (f.value === 'false') return v === false || v === 'false';
          return String(v) === String(f.value);
        });
      } else if (f.op === 'neq') {
        result = result.filter(r => String(r[f.column]) !== String(f.value));
      } else if (f.op === 'is_null') {
        result = result.filter(r => r[f.column] == null);
      }
    }

    // Apply not filters
    for (const f of this._notFilters) {
      if (f.op === 'eq') {
        result = result.filter(r => String(r[f.column]) !== String(f.value));
      }
    }

    // Apply in filters
    for (const f of this._inFilters) {
      result = result.filter(r => f.values.includes(r[f.column]));
    }

    // Apply ordering
    if (this._orderCol) {
      const col = this._orderCol;
      const asc = this._orderAsc;
      result = [...result].sort((a, b) => {
        const va = a[col], vb = b[col];
        if (va == null && vb == null) return 0;
        if (va == null) return asc ? -1 : 1;
        if (vb == null) return asc ? 1 : -1;
        if (typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
        return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }

    // Apply limit
    if (this._limitVal) {
      result = result.slice(0, this._limitVal);
    }

    return result;
  }

  // ── Parse select columns for relational includes ──
  // e.g. "*, categories(name_en, name_bn)" → needs a join
  private _parseRelations(): Array<{ key: string; table: string; fkColumn: string }> {
    if (!this._selectCols) return [];
    const relations: Array<{ key: string; table: string; fkColumn: string }> = [];
    // Match patterns like: categories(name_en, name_bn)
    const regex = /(\w+)\([^)]+\)/g;
    let match;
    while ((match = regex.exec(this._selectCols)) !== null) {
      const relTable = match[1];
      // Guess FK column: singular form + _id (e.g. categories → category_id)
      let fk = relTable.replace(/ies$/, 'y').replace(/s$/, '') + '_id';
      // Special cases
      if (relTable === 'categories') fk = 'category_id';
      if (relTable === 'products') fk = 'product_id';
      relations.push({ key: relTable, table: relTable, fkColumn: fk });
    }
    return relations;
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      const method = this._method || 'select';
      const routeName = tableToRoute(this.table);

      if (method === 'select') {
        // GET all rows from VPS, then filter client-side
        const resp = await fetch(`${API_BASE}/${routeName}`, {
          method: 'GET',
          headers: getHeaders(),
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          return { data: null, error: { message: errBody.error || `HTTP ${resp.status}` } };
        }

        let rows = await resp.json().catch(() => []);

        // Handle wrapped responses { data: [...] }
        if (rows && !Array.isArray(rows) && Array.isArray(rows.data)) {
          rows = rows.data;
        }

        // Ensure rows is an array
        if (!Array.isArray(rows)) {
          rows = rows ? [rows] : [];
        }

        // Resolve relational includes
        const relations = this._parseRelations();
        if (relations.length > 0) {
          for (const rel of relations) {
            try {
              const relRoute = tableToRoute(rel.table);
              const relResp = await fetch(`${API_BASE}/${relRoute}`, {
                method: 'GET',
                headers: getHeaders(),
              });
              if (relResp.ok) {
                let relRows = await relResp.json().catch(() => []);
                if (relRows && !Array.isArray(relRows) && Array.isArray(relRows.data)) {
                  relRows = relRows.data;
                }
                if (Array.isArray(relRows)) {
                  const relMap = new Map<string, any>();
                  for (const r of relRows) {
                    relMap.set(r.id, r);
                  }
                  // Attach related data to each row
                  for (const row of rows) {
                    const fkVal = row[rel.fkColumn];
                    if (fkVal && relMap.has(fkVal)) {
                      row[rel.key] = relMap.get(fkVal);
                    } else {
                      row[rel.key] = null;
                    }
                  }
                }
              }
            } catch {
              // If relation fetch fails, just set null
              for (const row of rows) {
                row[rel.key] = null;
              }
            }
          }
        }

        // Apply client-side filtering/ordering/limiting
        let data: any = this._applyClientFilters(rows);

        // Normalize assets
        data = data.map(normalizeRowAssets);

        // Handle single/maybeSingle
        if (this._single) {
          if (data.length === 0) {
            if (this._maybeSingle) return { data: null, error: null };
            return { data: null, error: { message: 'No rows found' } };
          }
          return { data: data[0], error: null };
        }

        return { data, error: null };
      }

      // ── INSERT ──
      if (method === 'insert') {
        const resp = await fetch(`${API_BASE}/${routeName}`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(this._payload),
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          return { data: null, error: { message: errBody.error || `HTTP ${resp.status}` } };
        }
        let data = await resp.json().catch(() => null);
        if (data) data = normalizeRowAssets(data);
        return { data: this._returnSelect ? data : data, error: null };
      }

      // ── UPDATE ──
      if (method === 'update') {
        // Find the row ID from filters
        const idFilter = this._filters.find(f => f.column === 'id' && f.op === 'eq');
        let updateUrl = `${API_BASE}/${routeName}`;

        if (idFilter) {
          updateUrl += `/${idFilter.value}`;
        } else {
          // If filtering by non-id column (e.g. setting_key), resolve the ID first
          const nonIdFilter = this._filters[0];
          if (nonIdFilter) {
            const allResp = await fetch(`${API_BASE}/${routeName}`, {
              method: 'GET',
              headers: getHeaders(),
            });
            if (allResp.ok) {
              let allRows = await allResp.json().catch(() => []);
              if (!Array.isArray(allRows) && Array.isArray(allRows?.data)) allRows = allRows.data;
              if (Array.isArray(allRows)) {
                const target = allRows.find((r: any) => String(r[nonIdFilter.column]) === String(nonIdFilter.value));
                if (target) updateUrl += `/${target.id}`;
              }
            }
          }
        }

        const resp = await fetch(updateUrl, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(this._payload),
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          return { data: null, error: { message: errBody.error || `HTTP ${resp.status}` } };
        }
        let data = await resp.json().catch(() => null);
        if (data) data = normalizeRowAssets(data);
        return { data, error: null };
      }

      // ── DELETE ──
      if (method === 'delete') {
        const idFilter = this._filters.find(f => f.column === 'id' && f.op === 'eq');
        if (!idFilter) return { data: null, error: { message: 'DELETE requires an id filter' } };
        const resp = await fetch(`${API_BASE}/${routeName}/${idFilter.value}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          return { data: null, error: { message: errBody.error || `HTTP ${resp.status}` } };
        }
        return { data: null, error: null };
      }

      // ── UPSERT (site_settings special case) ──
      if (method === 'upsert') {
        const resp = await fetch(`${API_BASE}/${routeName}`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(this._payload),
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          return { data: null, error: { message: errBody.error || `HTTP ${resp.status}` } };
        }
        let data = await resp.json().catch(() => null);
        if (data) data = normalizeRowAssets(data);
        return { data, error: null };
      }

      return { data: null, error: { message: `Unknown method: ${method}` } };
    } catch (err: any) {
      console.error('[apiClient] Error:', err);
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
function createChannel(_name: string) {
  return {
    on(_event: string, _filter: any, _cb: any) { return this; },
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
