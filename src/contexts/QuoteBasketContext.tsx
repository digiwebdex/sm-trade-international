import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface BasketItem {
  id: string;
  titleEn: string;
  titleBn: string;
  src: string;
  category: string;
  quantity: number;
}

interface QuoteBasketContextType {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearBasket: () => void;
  totalItems: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const QuoteBasketContext = createContext<QuoteBasketContextType | null>(null);

export const useQuoteBasket = () => {
  const ctx = useContext(QuoteBasketContext);
  if (!ctx) throw new Error('useQuoteBasket must be used within QuoteBasketProvider');
  return ctx;
};

export const QuoteBasketProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: Omit<BasketItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const clearBasket = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <QuoteBasketContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearBasket, totalItems, isOpen, setIsOpen }}>
      {children}
    </QuoteBasketContext.Provider>
  );
};
