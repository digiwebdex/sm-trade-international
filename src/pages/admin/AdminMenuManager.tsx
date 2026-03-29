import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, GripVertical, Trash2, Save, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface NavMenuItem {
  id: string;
  label_en: string;
  label_bn: string;
  href: string;
  type: 'hash' | 'route' | 'external';
  is_active: boolean;
  sort_order: number;
}

const DEFAULT_MENU: NavMenuItem[] = [
  { id: 'home', label_en: 'Home', label_bn: 'হোম', href: '#home', type: 'hash', is_active: true, sort_order: 0 },
  { id: 'about', label_en: 'About', label_bn: 'আমাদের সম্পর্কে', href: '/about', type: 'route', is_active: true, sort_order: 1 },
  { id: 'services', label_en: 'Services', label_bn: 'সেবা', href: '#services', type: 'hash', is_active: true, sort_order: 2 },
  { id: 'products', label_en: 'Products', label_bn: 'পণ্য', href: '#products', type: 'hash', is_active: true, sort_order: 3 },
  { id: 'gallery', label_en: 'Gallery', label_bn: 'গ্যালারি', href: '/gallery', type: 'route', is_active: true, sort_order: 4 },
  { id: 'configurator', label_en: 'Configure', label_bn: 'কনফিগার', href: '/configurator', type: 'route', is_active: true, sort_order: 5 },
  { id: 'contact', label_en: 'Contact', label_bn: 'যোগাযোগ', href: '#contact', type: 'hash', is_active: true, sort_order: 6 },
];

const AdminMenuManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [menuItems, setMenuItems] = useState<NavMenuItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedMenu, isLoading } = useQuery({
    queryKey: ['site-settings', 'nav_menu'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'nav_menu')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (savedMenu?.setting_value) {
      const items = (savedMenu.setting_value as any)?.items;
      if (Array.isArray(items) && items.length > 0) {
        setMenuItems(items.sort((a: NavMenuItem, b: NavMenuItem) => a.sort_order - b.sort_order));
      } else {
        setMenuItems(DEFAULT_MENU);
      }
    } else if (!isLoading) {
      setMenuItems(DEFAULT_MENU);
    }
  }, [savedMenu, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (items: NavMenuItem[]) => {
      const payload = { items };
      if (savedMenu) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: payload })
          .eq('setting_key', 'nav_menu');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'nav_menu', setting_value: payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Menu saved successfully!' });
      setHasChanges(false);
    },
    onError: (err: any) => {
      toast({ title: 'Failed to save menu', description: err.message, variant: 'destructive' });
    },
  });

  const updateItem = (id: string, updates: Partial<NavMenuItem>) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    setHasChanges(true);
  };

  const addItem = () => {
    const newItem: NavMenuItem = {
      id: `menu-${Date.now()}`,
      label_en: 'New Link',
      label_bn: 'নতুন লিংক',
      href: '#',
      type: 'hash',
      is_active: true,
      sort_order: menuItems.length,
    };
    setMenuItems(prev => [...prev, newItem]);
    setHasChanges(true);
  };

  const removeItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id).map((item, i) => ({ ...item, sort_order: i })));
    setHasChanges(true);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    newItems.forEach((item, i) => item.sort_order = i);
    setMenuItems(newItems);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(menuItems);
  };

  const resetToDefault = () => {
    setMenuItems(DEFAULT_MENU);
    setHasChanges(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Navigation Menu</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage website navigation links — enable, disable, add, reorder, or remove items.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            Reset Default
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Menu'}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              item.is_active ? 'bg-card border-border' : 'bg-muted/50 border-border/50 opacity-60'
            }`}
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-0.5 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => moveItem(index, 'down')}
                disabled={index === menuItems.length - 1}
                className="p-0.5 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Label (EN)</label>
                <Input
                  value={item.label_en}
                  onChange={e => updateItem(item.id, { label_en: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Label (BN)</label>
                <Input
                  value={item.label_bn}
                  onChange={e => updateItem(item.id, { label_bn: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL / Href</label>
                <Input
                  value={item.href}
                  onChange={e => updateItem(item.id, { href: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="#section or /page or https://..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <Select
                  value={item.type}
                  onValueChange={(val: 'hash' | 'route' | 'external') => updateItem(item.id, { type: val })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hash">Section (#)</SelectItem>
                    <SelectItem value="route">Page Route (/)</SelectItem>
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggle & Delete */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{item.is_active ? 'ON' : 'OFF'}</span>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={checked => updateItem(item.id, { is_active: checked })}
                />
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <Button variant="outline" className="w-full gap-2 border-dashed" onClick={addItem}>
        <Plus className="h-4 w-4" />
        Add Menu Item
      </Button>

      {/* Preview */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Preview (Active Items)</h3>
        <div className="flex flex-wrap gap-4">
          {menuItems.filter(i => i.is_active).map(item => (
            <span key={item.id} className="flex items-center gap-1 text-sm font-medium text-foreground px-3 py-1.5 rounded-md bg-muted">
              {item.label_en}
              {item.type === 'external' && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMenuManager;
