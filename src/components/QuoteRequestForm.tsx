import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileUp, X, Send, Building2, Sparkles, Copy, Check } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];

const QuoteRequestForm = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    product_interest: '',
    quantity: '',
    message: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: t('quote.fileTypeError'), variant: 'destructive' });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: t('quote.fileSizeError'), variant: 'destructive' });
      return;
    }
    setFile(f);
  };

  const generateQuote = async () => {
    if (!form.company_name && !form.product_interest && !form.message) {
      toast({
        title: lang === 'en' ? 'Please fill in some details first' : 'প্রথমে কিছু তথ্য দিন',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setGeneratedQuote('');

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            company_name: form.company_name,
            product_interest: form.product_interest,
            quantity: form.quantity,
            message: form.message,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate quote');
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setGeneratedQuote(fullText);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: lang === 'en' ? 'Quote generation failed' : 'কোটেশন তৈরি ব্যর্থ হয়েছে',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyQuote = async () => {
    await navigator.clipboard.writeText(generatedQuote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_person || !form.email || !form.message) {
      toast({ title: t('quote.requiredError'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let logo_url: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('quote-attachments')
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        logo_url = path;
      }

      const { error } = await supabase.from('quote_requests').insert({
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        product_interest: form.product_interest.trim() || null,
        quantity: form.quantity ? parseInt(form.quantity, 10) : null,
        message: form.message.trim(),
        logo_url,
      });

      if (error) throw error;

      toast({ title: t('quote.success') });
      setForm({ company_name: '', contact_person: '', email: '', phone: '', product_interest: '', quantity: '', message: '' });
      setFile(null);
      setGeneratedQuote('');
    } catch (err) {
      console.error(err);
      toast({ title: t('quote.error'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'bg-background border-border/50 shadow-sm focus:shadow-md transition-shadow';

  return (
    <section id="quote" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-accent text-sm font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Get Started' : 'শুরু করুন'}
          </span>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-7 w-7 text-primary" />
            <h2 className="text-3xl md:text-5xl font-bold">{t('quote.title')}</h2>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('quote.subtitle')}</p>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
          {/* Form — 3 cols */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input placeholder={t('quote.companyName') + ' *'} value={form.company_name} onChange={set('company_name')} className={inputClass} required />
              <Input placeholder={t('quote.contactPerson') + ' *'} value={form.contact_person} onChange={set('contact_person')} className={inputClass} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input type="email" placeholder={t('quote.email') + ' *'} value={form.email} onChange={set('email')} className={inputClass} required />
              <Input type="tel" placeholder={t('quote.phone')} value={form.phone} onChange={set('phone')} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input placeholder={t('quote.productInterest')} value={form.product_interest} onChange={set('product_interest')} className={inputClass} />
              <Input type="number" min="1" placeholder={t('quote.quantity')} value={form.quantity} onChange={set('quantity')} className={inputClass} />
            </div>
            <Textarea placeholder={t('quote.message') + ' *'} value={form.message} onChange={set('message')} rows={5} className={inputClass} required />

            {/* File upload */}
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleFile} className="hidden" />
              <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
                <FileUp className="h-4 w-4" />
                {t('quote.uploadLogo')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('quote.uploadHint')}</p>
              {file && (
                <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-md w-fit">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1 min-w-[180px]">
                <Send className="h-4 w-4" />
                {submitting ? t('quote.submitting') : t('quote.submit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={generating}
                onClick={generateQuote}
                className="gap-2 border-accent text-accent hover:bg-accent/10 flex-1 min-w-[180px]"
              >
                <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating
                  ? (lang === 'en' ? 'Generating...' : 'তৈরি হচ্ছে...')
                  : (lang === 'en' ? 'AI Quote Estimate' : 'AI কোটেশন')}
              </Button>
            </div>
          </form>

          {/* AI Quote Preview — 2 cols */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="bg-primary px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-primary-foreground text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {lang === 'en' ? 'AI Quote Preview' : 'AI কোটেশন প্রিভিউ'}
                  </span>
                </div>
                {generatedQuote && (
                  <button onClick={copyQuote} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <div className="p-5 min-h-[300px] max-h-[500px] overflow-y-auto">
                {generatedQuote ? (
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {generatedQuote}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-center text-muted-foreground">
                    <Sparkles className="h-10 w-10 mb-3 text-accent/30" />
                    <p className="text-sm">
                      {lang === 'en'
                        ? 'Fill in your requirements and click "AI Quote Estimate" to generate a professional quote instantly.'
                        : 'আপনার প্রয়োজনীয়তা পূরণ করুন এবং তাত্ক্ষণিক পেশাদার কোটেশন পেতে "AI কোটেশন" ক্লিক করুন।'}
                    </p>
                  </div>
                )}
                {generating && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuoteRequestForm;
