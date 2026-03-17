import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, FolderOpen, Image, Users, Mail, FileText, ArrowRight, Clock, Building2 } from 'lucide-react';

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  path: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [products, categories, gallery, clients, messages, quotes, pendingQuotes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('gallery').select('id', { count: 'exact', head: true }),
        supabase.from('client_logos').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats([
        { label: 'Products', value: products.count ?? 0, icon: Package, color: 'text-blue-500', path: '/admin/products' },
        { label: 'Categories', value: categories.count ?? 0, icon: FolderOpen, color: 'text-green-500', path: '/admin/categories' },
        { label: 'Gallery Items', value: gallery.count ?? 0, icon: Image, color: 'text-purple-500', path: '/admin/gallery' },
        { label: 'Clients', value: clients.count ?? 0, icon: Users, color: 'text-orange-500', path: '/admin/clients' },
        { label: 'Unread Messages', value: messages.count ?? 0, icon: Mail, color: 'text-red-500', path: '/admin/messages' },
        { label: 'Quote Requests', value: quotes.count ?? 0, icon: FileText, color: 'text-emerald-500', path: '/admin/quotes' },
      ]);

      // Fetch recent data
      const [quotesData, messagesData] = await Promise.all([
        supabase.from('quote_requests').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setRecentQuotes(quotesData.data ?? []);
      setRecentMessages(messagesData.data ?? []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    quoted: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => (
          <Card
            key={stat.label}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate(stat.path)}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Quote Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Quote Requests
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/admin/quotes')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No quote requests yet</p>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map(q => (
                  <div key={q.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/quotes')}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q.company_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{q.contact_person} · {q.product_interest || 'General inquiry'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`text-[9px] px-1.5 py-0 ${statusColors[q.status] || 'bg-muted'}`}>
                        {q.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDate(q.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Recent Messages
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/admin/messages')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/messages')}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!m.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Mail className={`h-4 w-4 ${!m.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.name}
                        {!m.is_read && <span className="inline-block w-2 h-2 bg-primary rounded-full ml-2" />}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(m.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
