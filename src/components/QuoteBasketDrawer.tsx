import { useState } from 'react';
import { useQuoteBasket } from '@/contexts/QuoteBasketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Trash2, Plus, Minus, MessageCircle, Send, X, ArrowLeft, Loader2 } from 'lucide-react';

const QuoteBasketDrawer = () => {
  const { items, removeItem, updateQuantity, clearBasket, totalItems, isOpen, setIsOpen } = useQuoteBasket();
  const { lang } = useLanguage();
  const { get } = useSiteSettings();
  const { toast } = useToast();
  const whatsappNumber = (get('contact', 'whatsapp_number', '8801867666888') as string).replace(/[^0-9]/g, '') || '8801867666888';

  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const title = (item: typeof items[0]) => lang === 'en' ? item.titleEn : item.titleBn;

  const getWhatsAppUrl = () => {
    const itemsList = items.map((item, i) =>
      `${i + 1}. ${title(item)} (Qty: ${item.quantity})`
    ).join('\n');

    const message = lang === 'en'
      ? `Hi, I'd like to request a quote for the following products:\n\n${itemsList}\n\nPlease share pricing and customization details.`
      : `হ্যালো, আমি নিম্নলিখিত পণ্যগুলির জন্য কোটেশন চাই:\n\n${itemsList}\n\nদয়া করে মূল্য ও কাস্টমাইজেশনের বিবরণ জানাবেন।`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: lang === 'en' ? 'Please fill in name and email' : 'নাম ও ইমেইল পূরণ করুন',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const resp = await fetch(`${apiBase}/send-quote-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            title: title(item),
            quantity: item.quantity,
            image: item.src,
          })),
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim() || undefined,
          message: form.message.trim() || undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send');
      }

      toast({
        title: lang === 'en' ? 'Quote request sent!' : 'কোটেশন অনুরোধ পাঠানো হয়েছে!',
        description: lang === 'en'
          ? 'We will get back to you shortly.'
          : 'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।',
      });
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', message: '' });
      clearBasket();
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: lang === 'en' ? 'Failed to send quote request' : 'কোটেশন অনুরোধ পাঠাতে ব্যর্থ',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating basket button */}
      {totalItems > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-1/2 -translate-y-1/2 right-4 z-50 bg-accent text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Open quote basket"
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-6 h-6 px-1 flex items-center justify-center shadow-md">
            {totalItems > 999 ? '999+' : totalItems}
          </span>
        </button>
      )}

      {/* Drawer */}
      <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setShowForm(false); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              {showForm && (
                <button onClick={() => setShowForm(false)} className="hover:text-accent transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <ShoppingBag className="h-5 w-5 text-accent" />
              {showForm
                ? (lang === 'en' ? 'Request Quote' : 'কোটেশন অনুরোধ')
                : (lang === 'en' ? 'Quote Basket' : 'কোটেশন বাস্কেট')}
              {!showForm && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalItems} {lang === 'en' ? 'items' : 'টি পণ্য'})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 && !showForm ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {lang === 'en'
                  ? 'Your quote basket is empty. Browse the catalog and add products to get started.'
                  : 'আপনার কোটেশন বাস্কেট খালি। ক্যাটালগ ব্রাউজ করুন এবং পণ্য যোগ করুন।'}
              </p>
            </div>
          ) : showForm ? (
            /* Quote Request Form */
            <form onSubmit={handleSendQuote} className="flex flex-col flex-1">
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {/* Summary of items */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-semibold mb-2">
                      {lang === 'en' ? `${items.length} products selected` : `${items.length}টি পণ্য নির্বাচিত`}
                    </p>
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-muted-foreground text-xs py-0.5">
                        <span className="truncate mr-2">{title(item)}</span>
                        <span className="shrink-0">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <Input
                    placeholder={(lang === 'en' ? 'Your Name' : 'আপনার নাম') + ' *'}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    placeholder={(lang === 'en' ? 'Email Address' : 'ইমেইল') + ' *'}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                  <Input
                    type="tel"
                    placeholder={lang === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                  <Textarea
                    placeholder={lang === 'en' ? 'Additional message (optional)' : 'অতিরিক্ত বার্তা (ঐচ্ছিক)'}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={3}
                  />
                </div>
              </ScrollArea>

              <div className="border-t border-border px-6 py-4">
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-accent hover:bg-accent/90 text-white gap-2"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {lang === 'en' ? 'Sending...' : 'পাঠানো হচ্ছে...'}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {lang === 'en' ? 'Send Quote Request' : 'কোটেশন অনুরোধ পাঠান'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                      <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0">
                        <img src={item.src} alt={title(item)} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{title(item)}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors self-start"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t border-border px-6 py-4 space-y-3">
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-white gap-2"
                  size="lg"
                  onClick={() => setShowForm(true)}
                >
                  <Send className="h-4 w-4" />
                  {lang === 'en' ? 'Request Quote' : 'কোটেশন অনুরোধ'}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full gap-2 border-[hsl(142,70%,40%)] text-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,40%)]/10"
                  size="lg"
                >
                  <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    {lang === 'en' ? 'Send via WhatsApp' : 'WhatsApp এ পাঠান'}
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-destructive gap-2"
                  size="sm"
                  onClick={clearBasket}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {lang === 'en' ? 'Clear Basket' : 'বাস্কেট খালি করুন'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default QuoteBasketDrawer;
