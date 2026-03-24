import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, CheckCircle2, Package, AlertCircle, RefreshCw } from 'lucide-react';

const DESIGNS = [
  { key: 'A', label: 'Design A - Minimal Logo', label_bn: 'ডিজাইন A - মিনিমাল লোগো' },
  { key: 'B', label: 'Design B - Full Logo Print', label_bn: 'ডিজাইন B - ফুল লোগো প্রিন্ট' },
  { key: 'C', label: 'Design C - Embossed Logo', label_bn: 'ডিজাইন C - এমবসড লোগো' },
  { key: 'D', label: 'Design D - Gold Foil Logo', label_bn: 'ডিজাইন D - গোল্ড ফয়েল লোগো' },
  { key: 'E', label: 'Design E - Laser Engraved', label_bn: 'ডিজাইন E - লেজার এনগ্রেভড' },
];

const COLORS = [
  { key: 'BLK', label: 'Black', label_bn: 'কালো', hex: '#1a1a1a' },
  { key: 'NVY', label: 'Navy Blue', label_bn: 'নেভি ব্লু', hex: '#1B3A6B' },
  { key: 'BRN', label: 'Brown', label_bn: 'বাদামি', hex: '#6B3A2A' },
  { key: 'BRG', label: 'Burgundy', label_bn: 'বার্গান্ডি', hex: '#6B1A2A' },
  { key: 'CST', label: 'Custom Color', label_bn: 'কাস্টম কালার', hex: '#888888' },
];

// Generate a product code from the name
const toProductCode = (name: string, index: number): string => {
  const words = name.split(' ').filter(w => w.length > 2);
  const code = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  return `${code}${String(index + 1).padStart(2, '0')}`;
};

interface GenerationResult {
  productId: string;
  productName: string;
  generated: number;
  skipped: number;
  error?: string;
}

const AdminVariantGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products-generator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingVariants = [] } = useQuery({
    queryKey: ['all-existing-skus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('product_id, sku');
      if (error) throw error;
      return data;
    },
  });

  const existingSkuSet = new Set(existingVariants.map(v => v.sku).filter(Boolean));
  const existingProductVariantCount: Record<string, number> = {};
  existingVariants.forEach(v => {
    existingProductVariantCount[v.product_id] = (existingProductVariantCount[v.product_id] || 0) + 1;
  });

  const totalExpected = products.length * DESIGNS.length * COLORS.length;
  const totalExisting = Object.values(existingProductVariantCount).reduce((a, b) => a + b, 0);
  const totalPending = totalExpected - totalExisting;

  const generateVariants = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    let sortBase = 1;

    const newResults: GenerationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const productCode = toProductCode(prod.name_en, i);
      let generated = 0;
      let skipped = 0;
      let errorMsg: string | undefined;

      try {
        const variantsToInsert = [];

        for (let d = 0; d < DESIGNS.length; d++) {
          for (let c = 0; c < COLORS.length; c++) {
            const design = DESIGNS[d];
            const color = COLORS[c];
            const sku = `SMTI-${productCode}-${design.key}-${color.key}`;

            if (existingSkuSet.has(sku)) {
              skipped++;
              continue;
            }

            variantsToInsert.push({
              product_id: prod.id,
              variant_label_en: `${design.label} | ${color.label}`,
              variant_label_bn: `${design.label_bn} | ${color.label_bn}`,
              sku,
              color_hex: color.hex,
              color_name: color.label,
              design_type: design.key,
              unit_price: 0,
              min_quantity: 10,
              is_active: true,
              sort_order: sortBase + d * COLORS.length + c,
            });
          }
        }

        if (variantsToInsert.length > 0) {
          const { error } = await supabase.from('product_variants').insert(variantsToInsert);
          if (error) throw error;
          generated = variantsToInsert.length;
        }
      } catch (err: any) {
        errorMsg = err.message;
      }

      sortBase += DESIGNS.length * COLORS.length;
      newResults.push({ productId: prod.id, productName: prod.name_en, generated, skipped, error: errorMsg });
      setResults([...newResults]);
      setProgress(Math.round(((i + 1) / products.length) * 100));
    }

    setIsRunning(false);
    const totalGenerated = newResults.reduce((a, r) => a + r.generated, 0);
    const totalSkipped = newResults.reduce((a, r) => a + r.skipped, 0);
    queryClient.invalidateQueries({ queryKey: ['all-existing-skus'] });
    queryClient.invalidateQueries({ queryKey: ['product-variants'] });

    toast({
      title: `✅ Generation Complete`,
      description: `${totalGenerated} variants created, ${totalSkipped} already existed.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" /> Variant Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Auto-generate 25 variants per product (5 designs × 5 colors) with unique SKUs. Duplicate SKUs are automatically skipped.
        </p>
      </div>

      {/* Summary card */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Products</p>
            <p className="text-2xl font-bold mt-1">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Expected Variants</p>
            <p className="text-2xl font-bold mt-1">{totalExpected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{products.length} × {DESIGNS.length} × {COLORS.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">To Generate</p>
            <p className="text-2xl font-bold mt-1 text-primary">{totalPending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{totalExisting} already exist</p>
          </CardContent>
        </Card>
      </div>

      {/* Design & Color preview */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">5 Design Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DESIGNS.map(d => (
              <div key={d.key} className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 justify-center font-mono">{d.key}</Badge>
                <span className="text-sm">{d.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">5 Color Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {COLORS.map(c => (
              <div key={c.key} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                <Badge variant="outline" className="font-mono text-xs">{c.key}</Badge>
                <span className="text-sm">{c.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SKU Format */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm font-medium mb-1">SKU Format</p>
          <code className="text-sm bg-muted px-3 py-1.5 rounded-md block">
            SMTI-&#123;PRODUCTCODE&#125;-&#123;DESIGN&#125;-&#123;COLOR&#125;
          </code>
          <p className="text-xs text-muted-foreground mt-2">Example: <code className="bg-muted px-1 rounded">SMTI-CPT01-A-BLK</code> = Corporate Premium Tie #1, Design A, Black</p>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={generateVariants}
              disabled={isRunning || isLoading || totalPending === 0}
              size="lg"
              className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white"
            >
              {isRunning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              ) : totalPending === 0 ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> All Variants Exist</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" /> Generate {totalPending.toLocaleString()} Variants</>
              )}
            </Button>
            {results.length > 0 && !isRunning && (
              <Button variant="outline" onClick={() => { setResults([]); setProgress(0); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset
              </Button>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing products…</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Generation Results</CardTitle>
            <CardDescription>
              {results.reduce((a, r) => a + r.generated, 0)} created · {results.reduce((a, r) => a + r.skipped, 0)} skipped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-2">
              {results.map(r => (
                <div key={r.productId} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0 text-sm">
                  {r.error ? (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : r.generated > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 truncate">{r.productName}</span>
                  {r.generated > 0 && <Badge variant="secondary" className="text-green-700 bg-green-100 shrink-0">+{r.generated}</Badge>}
                  {r.skipped > 0 && <Badge variant="outline" className="shrink-0 text-xs">{r.skipped} skipped</Badge>}
                  {r.error && <Badge variant="destructive" className="shrink-0 text-xs">Error</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminVariantGenerator;
