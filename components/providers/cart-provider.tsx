"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

export type SignConfiguration = {
  signId: string;
  logoPath: string;
  positionX: number;
  positionY: number;
  size: number;
};

type AddItemInput = Omit<CartItem, "quantity">;

type CartContextType = {
  items: CartItem[];
  addItem: (item: AddItemInput) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  uploadedLogoPath: string | null;
  setUploadedLogoPath: (path: string | null) => void;
  configurations: Record<string, SignConfiguration>;
  saveConfiguration: (config: SignConfiguration) => void;
  getConfiguration: (signId: string) => SignConfiguration | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "safetysigns-cart";

type PersistedCartState = {
  items: CartItem[];
  uploadedLogoPath: string | null;
  configurations: Record<string, SignConfiguration>;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [uploadedLogoPath, setUploadedLogoPath] = useState<string | null>(null);
  const [configurations, setConfigurations] = useState<Record<string, SignConfiguration>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedCartState | CartItem[];

      if (Array.isArray(parsed)) {
        setItems(parsed);
        return;
      }

      if (parsed && typeof parsed === "object") {
        setItems(Array.isArray(parsed.items) ? parsed.items : []);
        setUploadedLogoPath(parsed.uploadedLogoPath ?? null);
        setConfigurations(parsed.configurations ?? {});
      }
    } catch {
      setItems([]);
      setUploadedLogoPath(null);
      setConfigurations({});
    }
  }, []);

  useEffect(() => {
    const stateToPersist: PersistedCartState = {
      items,
      uploadedLogoPath,
      configurations,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
  }, [items, uploadedLogoPath, configurations]);

  const addItem = (item: AddItemInput) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const increaseQty = (id: string) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p))
    );
  };

  const decreaseQty = (id: string) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCart = () => setItems([]);

  const saveConfiguration = (config: SignConfiguration) => {
    setConfigurations((prev) => ({
      ...prev,
      [config.signId]: config,
    }));
  };

  const getConfiguration = useCallback(
    (signId: string) => configurations[signId] ?? null,
    [configurations]
  );

  const value = useMemo(() => {
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return {
      items,
      addItem,
      increaseQty,
      decreaseQty,
      removeItem,
      clearCart,
      itemCount,
      subtotal,
      uploadedLogoPath,
      setUploadedLogoPath,
      configurations,
      saveConfiguration,
      getConfiguration,
    };
  }, [items, uploadedLogoPath, configurations, getConfiguration]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
