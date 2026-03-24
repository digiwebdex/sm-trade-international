import { useState, useRef } from 'react';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileJson, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type TargetTable = 'products' | 'gallery' | 'client_logos';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const TABLE_CONFIG: Record<TargetTable, { label: string; requiredFields: string[]; optionalFields: string[]; description: string }> = {
  products: {
    label: 'Products',
    requiredFields: ['name_en'],
    optionalFields: ['name_bn', 'description_en', 'description_bn', 'image_url', 'category_id', 'is_active', 'sort_order'],
    description: 'Import products with name, description, image URL, and category.',
  },
  gallery: {
    label: 'Gallery',
    requiredFields: ['image_url'],
    optionalFields: ['title_en', 'title_bn', 'category', 'is_active', 'sort_order'],
    description: 'Import gallery images with URL, title, and category.',
  },
  client_logos: {
    label: 'Client Logos',
    requiredFields: ['name'],
    optionalFields: ['logo_url', 'website_url', 'is_active', 'sort_order'],
    description: 'Import client logos with name, logo URL, and website.',
  },
};

const AdminImport = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [table, setTable] = useState<TargetTable>('products');
  const [parsedData, setParsedData] = useState<Record<string, unknown>[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories-for-import'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name_en').order('name_en');
      return data ?? [];
    },
  });

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)/g) || [];
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
      });
      return row;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let data: Record<string, unknown>[];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          data = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          data = parseCSV(text);
        }
        if (data.length === 0) {
          toast({ title: 'Empty file', description: 'No data rows found.', variant: 'destructive' });
          return;
        }
        setParsedData(data);
        toast({ title: `${data.length} rows parsed`, description: `Ready to import into ${TABLE_CONFIG[table].label}.` });
      } catch {
        toast({ title: 'Parse error', description: 'Could not parse the file. Ensure valid CSV or JSON format.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;
    setImporting(true);
    setResult(null);

    const config = TABLE_CONFIG[table];
    const allFields = [...config.requiredFields, ...config.optionalFields];
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);
      const cleanBatch = batch.map((row, idx) => {
        const clean: Record<string, unknown> = {};
        for (const field of allFields) {
          if (row[field] !== undefined && row[field] !== '') {
            if (field === 'is_active') {
              clean[field] = row[field] === 'true' || row[field] === '1' || row[field] === true;
            } else if (field === 'sort_order') {
              clean[field] = parseInt(String(row[field]), 10) || 0;
            } else {
              clean[field] = row[field];
            }
          }
        }
        // Validate required fields
        for (const req of config.requiredFields) {
          if (!clean[req]) {
            errors.push(`Row ${i + idx + 1}: missing required field "${req}"`);
            return null;
          }
        }
        return clean;
      });

      const validRows = cleanBatch.filter(Boolean) as Record<string, unknown>[];
      failed += cleanBatch.length - validRows.length;

      if (validRows.length > 0) {
        const { error, data } = await supabase.from(table).insert(validRows as any).select();
        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          failed += validRows.length;
        } else {
          success += data?.length ?? validRows.length;
        }
      }
    }

    setResult({ success, failed, errors });
    setImporting(false);

    if (success > 0) {
      toast({ title: 'Import complete', description: `${success} rows imported successfully.` });
    }
  };

  const downloadTemplate = () => {
    const config = TABLE_CONFIG[table];
    const headers = [...config.requiredFields, ...config.optionalFields];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const config = TABLE_CONFIG[table];

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Upload className="h-5 w-5" /> Data Import Tool
          </CardTitle>
          <CardDescription>
            Import products, gallery images, or client logos from CSV or JSON files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select table */}
          <div className="space-y-2">
            <label className="text-sm font-medium">1. Select target</label>
            <Select value={table} onValueChange={(v) => { setTable(v as TargetTable); setParsedData(null); setResult(null); setFileName(''); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TABLE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>

          {/* Field info */}
          <div className="rounded-lg bg-secondary p-4 space-y-2">
            <p className="text-xs font-medium">Required fields: <span className="text-sm-red">{config.requiredFields.join(', ')}</span></p>
            <p className="text-xs font-medium">Optional fields: <span className="text-muted-foreground">{config.optionalFields.join(', ')}</span></p>
            {table === 'products' && categories && categories.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                <p className="font-medium text-foreground">Category IDs:</p>
                {categories.map(c => (
                  <p key={c.id} className="ml-2">{c.name_en}: <code className="text-[10px] bg-muted px-1 rounded">{c.id}</code></p>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-2">
              <Download className="h-3 w-3 mr-1" /> Download CSV Template
            </Button>
          </div>

          {/* Step 2: Upload file */}
          <div className="space-y-2">
            <label className="text-sm font-medium">2. Upload file (CSV or JSON)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFile}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  {fileName.endsWith('.json') ? <FileJson className="h-5 w-5 text-primary" /> : <FileSpreadsheet className="h-5 w-5 text-primary" />}
                  <span className="text-sm font-medium">{fileName}</span>
                  <span className="text-xs text-muted-foreground">({parsedData?.length ?? 0} rows)</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select a CSV or JSON file</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview (first 5 rows)</label>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary">
                      {Object.keys(parsedData[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 max-w-[200px] truncate">{String(val ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Import */}
          {parsedData && parsedData.length > 0 && (
            <Button onClick={handleImport} disabled={importing} className="w-full bg-sm-red hover:bg-[hsl(var(--sm-red-dark))]">
              {importing ? 'Importing...' : `Import ${parsedData.length} rows into ${config.label}`}
            </Button>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 space-y-2 ${result.failed > 0 ? 'bg-destructive/10' : 'bg-green-50 dark:bg-green-950/20'}`}>
              <div className="flex items-center gap-2">
                {result.failed > 0 ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <span className="text-sm font-medium">
                  {result.success} imported, {result.failed} failed
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-destructive space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImport;
