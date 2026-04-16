/**
 * AdminTranslations — Bulk-translate existing rows from English to Bengali + Chinese.
 *
 * Calls the VPS endpoints:
 *   POST /api/translate/bulk/:table
 *   POST /api/translate/bulk-site-settings
 *   GET  /api/translate/health
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Languages, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { API_BASE } from '@/lib/apiClient';

const BULK_TABLES = [
  { key: 'categories', label: 'Categories', icon: '📂' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'product_variants', label: 'Product Variants', icon: '🎨' },
  { key: 'gallery', label: 'Gallery', icon: '🖼️' },
  { key: 'about_page', label: 'About Page', icon: '📄' },
  { key: 'seo_meta', label: 'SEO Metadata', icon: '🔍' },
];

type JobResult = {
  table: string;
  total: number;
  updated: number;
  skipped?: number;
  errors?: any[];
};

const AdminTranslations = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, JobResult>>({});
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'ok' | 'down'>('checking');
  const [serviceLangs, setServiceLangs] = useState<string[]>([]);

  // Health check on mount
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/translate/health`)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d.ok) {
          setServiceStatus('ok');
          setServiceLangs(d.languages || []);
        } else {
          setServiceStatus('down');
        }
      })
      .catch(() => { if (mounted) setServiceStatus('down'); });
    return () => { mounted = false; };
  }, []);

  const token = localStorage.getItem('auth_token') || '';

  const runBulk = async (table: string) => {
    setRunning(table);
    try {
      const url = table === 'site_settings'
        ? `${API_BASE}/translate/bulk-site-settings`
        : `${API_BASE}/translate/bulk/${table}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ onlyIfEmpty: true, targets: ['bn', 'zh'] }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setResults(prev => ({ ...prev, [table]: data }));
      toast({
        title: `✅ ${table} translated`,
        description: `${data.updated || 0} rows updated, ${data.skipped || 0} skipped`,
      });
    } catch (err: any) {
      toast({ title: `Failed: ${table}`, description: err.message, variant: 'destructive' });
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    for (const t of BULK_TABLES) {
      await runBulk(t.key);
    }
    await runBulk('site_settings');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" />
          Auto-Translation
        </h1>
        <p className="text-muted-foreground mt-1">
          Translate existing English content to Bengali (বাংলা) and Chinese (中文) automatically.
          Only empty fields are filled — your existing translations are preserved.
        </p>
      </div>

      {/* Service status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {serviceStatus === 'checking' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm">Checking translation service…</span>
                </>
              )}
              {serviceStatus === 'ok' && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">LibreTranslate is running</p>
                    <p className="text-xs text-muted-foreground">
                      Available languages: {serviceLangs.join(', ') || 'unknown'}
                    </p>
                  </div>
                </>
              )}
              {serviceStatus === 'down' && (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Translation service offline</p>
                    <p className="text-xs text-muted-foreground">
                      Check that the <code className="bg-muted px-1 rounded">libretranslate</code> Docker container is running.
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={runAll}
              disabled={!!running || serviceStatus !== 'ok'}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {running ? `Translating ${running}…` : 'Translate Everything'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-table cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...BULK_TABLES, { key: 'site_settings', label: 'Site Settings (JSON)', icon: '⚙️' }].map(t => {
          const r = results[t.key];
          const isRunning = running === t.key;
          return (
            <Card key={t.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {r && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Total: {r.total}</Badge>
                    <Badge className="bg-green-600">Updated: {r.updated}</Badge>
                    {typeof r.skipped === 'number' && (
                      <Badge variant="outline">Skipped: {r.skipped}</Badge>
                    )}
                    {r.errors && r.errors.length > 0 && (
                      <Badge variant="destructive">Errors: {r.errors.length}</Badge>
                    )}
                  </div>
                )}
                <Button
                  onClick={() => runBulk(t.key)}
                  disabled={!!running || serviceStatus !== 'ok'}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  {isRunning ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Translating…</>
                  ) : (
                    <><Languages className="h-4 w-4" /> Translate {t.label}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">💡 How it works</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>From now on, you only need to fill the <strong>English</strong> field when adding/editing content.</li>
            <li>The system auto-translates to Bengali (বাংলা) and Chinese (中文) on save.</li>
            <li>If you manually fill a Bengali or Chinese field, your value is preserved (never overwritten).</li>
            <li>This page is only for back-filling translations on existing content.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTranslations;
