import { MessageCircle, ArrowUp } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useEffect, useState } from 'react';

const WhatsAppFloat = () => {
  const { get } = useSiteSettings();
  const whatsapp = get('contact', 'whatsapp_number', '8801867666888');
  const cleanNumber = whatsapp.replace(/[^0-9]/g, '') || '8801867666888';
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <a
        href={`https://wa.me/${cleanNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-[hsl(142,70%,40%)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[hsl(142,70%,35%)] transition-all hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 bg-sm-red text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[hsl(var(--sm-red-dark))] transition-all hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-7 w-7" />
        </button>
      )}
    </>
  );
};

export default WhatsAppFloat;
