import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  GripVertical, Eye, EyeOff, Pencil, Save, Loader2,
  Layout, Users, Cog, Layers, Package, Building2, FileText, Phone,
} from 'lucide-react';
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface SectionConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  settingsTab?: string; // which tab to open in Site Settings
  adminPage?: string;   // or a dedicated admin page
}

const allSections: SectionConfig[] = [
  { id: 'hero', label: 'Hero Banner', icon: Layout, settingsTab: 'hero' },
  { id: 'about', label: 'About Us', icon: Users, settingsTab: 'about' },
  { id: 'services', label: 'Services / Categories', icon: Cog, settingsTab: 'services' },
  { id: 'process', label: 'How It Works', icon: Layers, settingsTab: 'process' },
  { id: 'products', label: 'Featured Products', icon: Package, adminPage: '/admin/products' },
  { id: 'clients', label: 'Clients', icon: Building2, adminPage: '/admin/clients' },
  { id: 'quote', label: 'Quote Request Form', icon: FileText },
  { id: 'contact', label: 'Contact', icon: Phone, settingsTab: 'contact' },
];

interface HomeSectionsData {
  order: string[];
  hidden: string[];
}

const defaultData: HomeSectionsData = {
  order: allSections.map(s => s.id),
  hidden: [],
};

const AdminHomeSections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sections, setSections] = useState<HomeSectionsData>(defaultData);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const { data: saved, isLoading } = useQuery({
    queryKey: ['site-settings-home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'home_sections')
        .maybeSingle();
      if (error) throw error;
      return data?.setting_value as unknown as HomeSectionsData | null;
    },
  });

  useEffect(() => {
    if (saved) {
      setSections({
        order: saved.order?.length ? saved.order : defaultData.order,
        hidden: saved.hidden ?? [],
      });
    }
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'home_sections')
        .maybeSingle();

      const payload = { setting_key: 'home_sections', setting_value: sections as unknown as Json };

      if (existing) {
        const { error } = await supabase.from('site_settings').update(payload).eq('setting_key', 'home_sections');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-home-sections'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast({ title: 'Home sections saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const toggleVisibility = (id: string) => {
    setSections(prev => ({
      ...prev,
      hidden: prev.hidden.includes(id)
        ? prev.hidden.filter(h => h !== id)
        : [...prev.hidden, id],
    }));
  };

  const moveSection = (from: number, to: number) => {
    setSections(prev => {
      const newOrder = [...prev.order];
      const [item] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, item);
      return { ...prev, order: newOrder };
    });
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveSection(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => setDragIdx(null);

  const orderedSections = sections.order
    .map(id => allSections.find(s => s.id === id))
    .filter(Boolean) as SectionConfig[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Page Sections</h1>
          <p className="text-muted-foreground text-sm">Drag to reorder, toggle visibility, or click edit to modify content</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Order
        </Button>
      </div>

      <div className="space-y-2">
        {orderedSections.map((section, idx) => {
          const isHidden = sections.hidden.includes(section.id);
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
                isHidden ? 'opacity-50' : ''
              } ${dragIdx === idx ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />

                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{section.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {isHidden ? 'Hidden' : 'Visible'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleVisibility(section.id)}
                    aria-label={`Toggle ${section.label}`}
                  />
                  <button
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent/10 transition-colors"
                    title={isHidden ? 'Hidden' : 'Visible'}
                  >
                    {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  {(section.settingsTab || section.adminPage) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        if (section.adminPage) {
                          navigate(section.adminPage);
                        } else {
                          navigate('/admin/settings');
                        }
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHomeSections;
