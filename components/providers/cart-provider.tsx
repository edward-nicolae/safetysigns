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
  lineId: string;
  signId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

export type SignConfiguration = {
  lineId: string;
  signId: string;
  logoPath: string;
  positionX: number;
  positionY: number;
  size: number;
  text: string;
  color: string;
  // Wizard-set fields
  materialId?: string;
  materialLabel?: string;
  orientation?: "portrait" | "landscape" | "square";
  sizeId?: string;
  width?: number;
  height?: number;
  schemeId?: string;
  schemeColor?: string;
};

// Input for adding/identifying a product (no lineId — that's generated internally)
export type AddItemInput = {
  signId: string;
  title: string;
  price: number;
  image: string;
};

type ConfigData = Omit<SignConfiguration, "lineId" | "signId">;

type CartContextType = {
  items: CartItem[];
  // Manages a single unconfigured line per signId (merge by signId when no config)
  setUnconfiguredQuantity: (item: AddItemInput, quantity: number) => void;
  // Always creates a new line with a fresh lineId + attaches config
  addConfiguredLine: (item: AddItemInput, config: ConfigData, quantity?: number) => void;
  // Creates or updates config on an existing cart line (no new cart item added)
  updateConfiguredLine: (lineId: string, signId: string, config: ConfigData) => void;
  // Line-level quantity controls (use lineId)
  increaseQty: (lineId: string) => void;
  decreaseQty: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  configurations: Record<string, SignConfiguration>;
  removeConfiguration: (lineId: string) => void;
  getConfiguration: (lineId: string) => SignConfiguration | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "safetysigns-cart";

type PersistedCartState = {
  items: CartItem[];
  configurations: Record<string, SignConfiguration>;
};

function generateLineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [configurations, setConfigurations] = useState<Record<string, SignConfiguration>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedCartState | unknown[];

      if (Array.isArray(parsed)) {
        // Legacy format: plain items array (old CartItem had `id` not `signId`/`lineId`)
        const migrated: CartItem[] = (parsed as Record<string, unknown>[]).map((item) => ({
          lineId: generateLineId(),
          signId: String(item.signId ?? item.id ?? ""),
          title: String(item.title ?? ""),
          price: Number(item.price ?? 0),
          image: String(item.image ?? ""),
          quantity: Number(item.quantity ?? 1),
        }));
        setItems(migrated);
        return;
      }

      if (parsed && typeof parsed === "object") {
        const state = parsed as PersistedCartState;
        const rawItems = Array.isArray(state.items) ? state.items : [];

        // Migrate items that used the old `id` field instead of `signId`/`lineId`
        const migratedItems: CartItem[] = rawItems.map((item: Record<string, unknown>) => {
          if (item.lineId && item.signId) return item as unknown as CartItem;
          return {
            lineId: generateLineId(),
            signId: String(item.signId ?? item.id ?? ""),
            title: String(item.title ?? ""),
            price: Number(item.price ?? 0),
            image: String(item.image ?? ""),
            quantity: Number(item.quantity ?? 1),
          };
        });

        setItems(migratedItems);
        setConfigurations(state.configurations ?? {});
      }
    } catch {
      setItems([]);
      setConfigurations({});
    }
  }, []);

  useEffect(() => {
    const stateToPersist: PersistedCartState = { items, configurations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
  }, [items, configurations]);

  const setUnconfiguredQuantity = useCallback(
    (item: AddItemInput, quantity: number) => {
      const normalized = Math.max(0, Math.floor(quantity));
      setItems((prev) => {
        const unconfiguredIdx = prev.findIndex(
          (p) => p.signId === item.signId && !configurations[p.lineId],
        );

        if (normalized === 0) {
          if (unconfiguredIdx === -1) return prev;
          return prev.filter((_, i) => i !== unconfiguredIdx);
        }

        if (unconfiguredIdx !== -1) {
          return prev.map((p, i) =>
            i === unconfiguredIdx ? { ...p, ...item, quantity: normalized } : p,
          );
        }

        return [...prev, { lineId: generateLineId(), ...item, quantity: normalized }];
      });
    },
    [configurations],
  );

  const addConfiguredLine = (item: AddItemInput, config: ConfigData, quantity = 1) => {
    const lineId = generateLineId();
    setItems((prev) => [...prev, { lineId, ...item, quantity: Math.max(1, quantity) }]);
    setConfigurations((prev) => ({
      ...prev,
      [lineId]: { lineId, signId: item.signId, ...config },
    }));
  };

  const updateConfiguredLine = (lineId: string, signId: string, config: ConfigData) => {
    setConfigurations((prev) => {
      const existing = prev[lineId];
      if (existing) {
        return { ...prev, [lineId]: { ...existing, ...config } };
      }

      return {
        ...prev,
        [lineId]: {
          lineId,
          signId,
          ...config,
        },
      };
    });
  };

  const increaseQty = (lineId: string) => {
    setItems((prev) =>
      prev.map((p) => (p.lineId === lineId ? { ...p, quantity: p.quantity + 1 } : p)),
    );
  };

  const decreaseQty = (lineId: string) => {
    setItems((prev) =>
      prev
        .map((p) => (p.lineId === lineId ? { ...p, quantity: p.quantity - 1 } : p))
        .filter((p) => p.quantity > 0),
    );
  };

  const removeItem = (lineId: string) => {
    setItems((prev) => prev.filter((p) => p.lineId !== lineId));
    setConfigurations((prev) => {
      if (!prev[lineId]) return prev;
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  };

  const clearCart = useCallback(() => {
    setItems([]);
    setConfigurations({});
  }, []);

  const removeConfiguration = useCallback((lineId: string) => {
    setConfigurations((prev) => {
      if (!prev[lineId]) return prev;
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }, []);

  const getConfiguration = useCallback(
    (lineId: string) => configurations[lineId] ?? null,
    [configurations],
  );

  const value = useMemo(() => {
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return {
      items,
      setUnconfiguredQuantity,
      addConfiguredLine,
      updateConfiguredLine,
      increaseQty,
      decreaseQty,
      removeItem,
      clearCart,
      itemCount,
      subtotal,
      configurations,
      removeConfiguration,
      getConfiguration,
    };
  }, [items, configurations, getConfiguration, clearCart, removeConfiguration, setUnconfiguredQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
