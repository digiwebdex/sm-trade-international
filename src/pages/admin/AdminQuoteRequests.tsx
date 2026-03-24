import { useState } from 'react';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2, Clock, Building2, User, Mail, Phone, Package, Hash,
  Search, FileText, ExternalLink, Eye, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  quoted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const AdminQuoteRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['admin-quote-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('quote_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quote-requests'] });
      toast({ title: 'Status updated ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quote_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quote-requests'] });
      setDeleteId(null);
      toast({ title: 'Quote request deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const filtered = quotes.filter(q => {
    const matchSearch = !search || 
      q.company_name.toLowerCase().includes(search.toLowerCase()) ||
      q.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      q.email.toLowerCase().includes(search.toLowerCase()) ||
      (q.product_interest || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = quotes.filter(q => q.status === 'pending').length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quote Requests</h1>
          <p className="text-muted-foreground text-sm">
            {quotes.length} total requests
            {pendingCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingCount} pending</Badge>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, person, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || statusFilter !== 'all' ? 'No matching quote requests.' : 'No quote requests yet.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <Card key={q.id} className={`transition-colors ${q.status === 'pending' ? 'border-yellow-300/50 bg-yellow-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {q.company_name}
                      </p>
                      <Badge className={`text-[10px] px-2 py-0 border ${statusColors[q.status] || 'bg-muted text-foreground'}`}>
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{q.contact_person}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{q.email}</span>
                      {q.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{q.phone}</span>}
                      {q.quantity && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />Qty: {q.quantity}</span>}
                    </div>
                    {q.product_interest && (
                      <p className="text-xs text-foreground/70 flex items-center gap-1 mb-1">
                        <Package className="h-3 w-3" /> {q.product_interest}
                      </p>
                    )}
                    <p className="text-sm text-foreground/80 line-clamp-2">{q.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(q.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setViewItem(q)} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Select
                      value={q.status}
                      onValueChange={(status) => updateStatus.mutate({ id: q.id, status })}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(q.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Request Details
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Company</p>
                  <p className="font-semibold">{viewItem.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Contact Person</p>
                  <p className="font-semibold">{viewItem.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Email</p>
                  <a href={`mailto:${viewItem.email}`} className="text-primary hover:underline">{viewItem.email}</a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Phone</p>
                  <p>{viewItem.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Product Interest</p>
                  <p>{viewItem.product_interest || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Quantity</p>
                  <p>{viewItem.quantity || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Status</p>
                  <Badge className={`text-xs border ${statusColors[viewItem.status]}`}>
                    {viewItem.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Submitted</p>
                  <p className="text-xs">{formatDate(viewItem.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Message</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{viewItem.message}</p>
              </div>
              {viewItem.logo_url && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Attached Logo</p>
                  <a href={viewItem.logo_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> View attachment
                  </a>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Select
                  value={viewItem.status}
                  onValueChange={(status) => {
                    updateStatus.mutate({ id: viewItem.id, status });
                    setViewItem({ ...viewItem, status });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote Request?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminQuoteRequests;
