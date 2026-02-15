import { MessageCircle } from 'lucide-react';

const WhatsAppFloat = () => (
  <a
    href="https://wa.me/8801867666888"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 bg-[hsl(142,70%,40%)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[hsl(142,70%,35%)] transition-all hover:scale-110"
    aria-label="Chat on WhatsApp"
  >
    <MessageCircle className="h-7 w-7" />
  </a>
);

export default WhatsAppFloat;
