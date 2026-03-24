import { useState } from 'react';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Package, Image, Users, Tag, Archive, CheckCircle2 } from 'lucide-react';

const downloadCSV = (rows: Record<string, any>[], filename: string) => {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

interface BackupItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fetchFn: () => Promise<Record<string, any>[]>;
  filename: string;
}

const AdminBackup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const backupItems: BackupItem[] = [
    {
      id: 'products',
      label: 'Products',
      description: 'All product records including names, descriptions, categories and images.',
      icon: Package,
      color: 'text-blue-500',
      filename: `smti-products-${new Date().toISOString().split('T')[0]}.csv`,
      fetchFn: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, name_en, name_bn, description_en, description_bn, image_url, is_active, sort_order, created_at, category_id')
          .order('sort_order');
        if (error) throw error;
        return data ?? [];
      },
    },
    {
      id: 'variants',
      label: 'Product Variants',
      description: 'All variant records with SKU, design, color, pricing and stock information.',
      icon: Tag,
      color: 'text-purple-500',
      filename: `smti-variants-${new Date().toISOString().split('T')[0]}.csv`,
      fetchFn: async () => {
        const { data, error } = await supabase
          .from('product_variants')
          .select('id, product_id, variant_label_en, variant_label_bn, sku, color_hex, color_name, design_type, unit_price, min_quantity, is_active, sort_order, created_at')
          .order('sort_order');
        if (error) throw error;
        return data ?? [];
      },
    },
    {
      id: 'gallery',
      label: 'Gallery',
      description: 'All gallery images with titles, categories, and URLs.',
      icon: Image,
      color: 'text-green-500',
      filename: `smti-gallery-${new Date().toISOString().split('T')[0]}.csv`,
      fetchFn: async () => {
        const { data, error } = await supabase
          .from('gallery')
          .select('id, title_en, title_bn, category, image_url, is_active, sort_order, created_at')
          .order('sort_order');
        if (error) throw error;
        return data ?? [];
      },
    },
    {
      id: 'clients',
      label: 'Clients',
      description: 'All client logos with names, websites, and display order.',
      icon: Users,
      color: 'text-orange-500',
      filename: `smti-clients-${new Date().toISOString().split('T')[0]}.csv`,
      fetchFn: async () => {
        const { data, error } = await supabase
          .from('client_logos')
          .select('id, name, logo_url, website_url, is_active, sort_order, created_at')
          .order('sort_order');
        if (error) throw error;
        return data ?? [];
      },
    },
    {
      id: 'categories',
      label: 'Categories',
      description: 'All product categories with bilingual names and descriptions.',
      icon: Archive,
      color: 'text-rose-500',
      filename: `smti-categories-${new Date().toISOString().split('T')[0]}.csv`,
      fetchFn: async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name_en, name_bn, description_en, description_bn, icon, is_active, sort_order, created_at')
          .order('sort_order');
        if (error) throw error;
        return data ?? [];
      },
    },
  ];

  const handleExport = async (item: BackupItem) => {
    setLoading(item.id);
    try {
      const rows = await item.fetchFn();
      if (rows.length === 0) {
        toast({ title: 'No data', description: `No ${item.label.toLowerCase()} records found.` });
      } else {
        downloadCSV(rows, item.filename);
        setDone(prev => new Set([...prev, item.id]));
        toast({ title: `✅ ${item.label} exported`, description: `${rows.length} records downloaded.` });
      }
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleFullBackup = async () => {
    setLoading('all');
    let totalRecords = 0;
    try {
      for (const item of backupItems) {
        const rows = await item.fetchFn();
        if (rows.length > 0) {
          downloadCSV(rows, item.filename);
          totalRecords += rows.length;
          setDone(prev => new Set([...prev, item.id]));
          await new Promise(r => setTimeout(r, 300)); // small delay between downloads
        }
      }
      toast({ title: '🎉 Full backup complete', description: `${totalRecords} records exported across ${backupItems.length} files.` });
    } catch (err: any) {
      toast({ title: 'Backup failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary" /> Data Backup
        </h1>
        <p className="text-muted-foreground mt-1">Export your site data as CSV files. All files include headers and are UTF-8 encoded with BOM for Excel compatibility.</p>
      </div>

      {/* Full Backup CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-base">Full Site Backup</p>
            <p className="text-sm text-muted-foreground mt-0.5">Download all {backupItems.length} CSV files at once — products, variants, gallery, clients, and categories.</p>
          </div>
          <Button
            onClick={handleFullBackup}
            disabled={loading !== null}
            size="lg"
            className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white shrink-0"
          >
            {loading === 'all' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting…</>
            ) : (
              <><Download className="h-4 w-4 mr-2" /> Download All</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Individual exports */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {backupItems.map(item => {
          const Icon = item.icon;
          const isDone = done.has(item.id);
          const isLoading = loading === item.id;

          return (
            <Card key={item.id} className={`transition-all hover:shadow-md ${isDone ? 'border-green-300' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {item.label}
                  {isDone && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                </CardTitle>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport(item)}
                  disabled={loading !== null}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting…</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Export {item.label}</>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center font-mono truncate">{item.filename}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> CSV files are downloaded directly to your device. No data is sent to any external server. 
            Files include UTF-8 BOM for proper display in Microsoft Excel and Google Sheets.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackup;
