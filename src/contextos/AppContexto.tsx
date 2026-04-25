import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import type {
  AppState,
  Cliente,
  CostoFijo,
  CostoVariable,
  Pedido,
  PedidoItem,
  Producto,
  Proveedor,
  Compra,
  Lote,
  Venta,
  VentaItem,
  EstadoPedido,
} from "@/tipos";

const STORAGE_KEY = "distribuidora-recess::v2";

const initialState: AppState = {
  onboarded: false,
  businessName: "Distribuidora Recess",
  pedidoSeq: 0,
  products: [],
  suppliers: [],
  clientes: [],
  purchases: [],
  lots: [],
  sales: [],
  saleItems: [],
  pedidos: [],
  pedidoItems: [],
  fixedCosts: [],
  variableCosts: [],
};

export type Action =
  | {
      type: "INIT";
      payload: {
        businessName: string;
        products: Producto[];
        suppliers: Proveedor[];
        clientes: Cliente[];
      };
    }
  | { type: "RESET" }
  | { type: "RENAME_BUSINESS"; payload: string }
  | { type: "ADD_PRODUCT"; payload: Producto }
  | { type: "UPD_PRODUCT"; payload: Producto }
  | { type: "DEL_PRODUCT"; payload: string }
  | { type: "ADD_SUPPLIER"; payload: Proveedor }
  | { type: "UPD_SUPPLIER"; payload: Proveedor }
  | { type: "DEL_SUPPLIER"; payload: string }
  | { type: "ADD_CLIENTE"; payload: Cliente }
  | { type: "UPD_CLIENTE"; payload: Cliente }
  | { type: "DEL_CLIENTE"; payload: string }
  | { type: "ADD_PURCHASE"; payload: { purchase: Compra; lot: Lote } }
  | {
      type: "ADD_SALE";
      payload: {
        sale: Venta;
        items: VentaItem[];
        lots: Lote[];
        clienteBalanceDelta?: number;
      };
    }
  | {
      type: "ADD_PEDIDO";
      payload: { pedido: Pedido; items: PedidoItem[] };
    }
  | {
      type: "UPD_PEDIDO_ESTADO";
      payload: {
        pedidoId: string;
        estado: EstadoPedido;
        deliver?: {
          sale: Venta;
          items: VentaItem[];
          lots: Lote[];
          clienteBalanceDelta?: number;
        };
      };
    }
  | {
      type: "TOGGLE_PEDIDO_PAID";
      payload: { pedidoId: string };
    }
  | { type: "DEL_PEDIDO"; payload: string }
  | { type: "ADD_FIXED"; payload: CostoFijo }
  | { type: "DEL_FIXED"; payload: string }
  | { type: "ADD_VAR"; payload: CostoVariable }
  | { type: "DEL_VAR"; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        onboarded: true,
        businessName: action.payload.businessName,
        products: action.payload.products,
        suppliers: action.payload.suppliers,
        clientes: action.payload.clientes,
      };
    case "RESET":
      return { ...initialState };
    case "RENAME_BUSINESS":
      return { ...state, businessName: action.payload };
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };
    case "UPD_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "DEL_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "ADD_SUPPLIER":
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case "UPD_SUPPLIER":
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case "DEL_SUPPLIER":
      return {
        ...state,
        suppliers: state.suppliers.filter((s) => s.id !== action.payload),
      };
    case "ADD_CLIENTE":
      return { ...state, clientes: [...state.clientes, action.payload] };
    case "UPD_CLIENTE":
      return {
        ...state,
        clientes: state.clientes.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case "DEL_CLIENTE":
      return {
        ...state,
        clientes: state.clientes.filter((c) => c.id !== action.payload),
      };
    case "ADD_PURCHASE":
      return {
        ...state,
        purchases: [...state.purchases, action.payload.purchase],
        lots: [...state.lots, action.payload.lot],
      };
    case "ADD_SALE": {
      const { sale, items, lots, clienteBalanceDelta } = action.payload;
      const clientes =
        clienteBalanceDelta && sale.clienteId
          ? state.clientes.map((c) =>
              c.id === sale.clienteId
                ? { ...c, balance: c.balance + clienteBalanceDelta }
                : c,
            )
          : state.clientes;
      return {
        ...state,
        sales: [...state.sales, sale],
        saleItems: [...state.saleItems, ...items],
        lots,
        clientes,
      };
    }
    case "ADD_PEDIDO":
      return {
        ...state,
        pedidoSeq: state.pedidoSeq + 1,
        pedidos: [...state.pedidos, action.payload.pedido],
        pedidoItems: [...state.pedidoItems, ...action.payload.items],
      };
    case "UPD_PEDIDO_ESTADO": {
      const { pedidoId, estado, deliver } = action.payload;
      const pedidos = state.pedidos.map((p) =>
        p.id === pedidoId
          ? { ...p, status: estado, saleId: deliver?.sale.id ?? p.saleId }
          : p,
      );
      if (deliver) {
        const { sale, items, lots, clienteBalanceDelta } = deliver;
        const clientes =
          clienteBalanceDelta && sale.clienteId
            ? state.clientes.map((c) =>
                c.id === sale.clienteId
                  ? { ...c, balance: c.balance + clienteBalanceDelta }
                  : c,
              )
            : state.clientes;
        return {
          ...state,
          pedidos,
          sales: [...state.sales, sale],
          saleItems: [...state.saleItems, ...items],
          lots,
          clientes,
        };
      }
      return { ...state, pedidos };
    }
    case "TOGGLE_PEDIDO_PAID": {
      const pedido = state.pedidos.find((p) => p.id === action.payload.pedidoId);
      if (!pedido) return state;
      const nextPaid = !pedido.paid;
      const pedidos = state.pedidos.map((p) =>
        p.id === pedido.id ? { ...p, paid: nextPaid } : p,
      );
      // Si era cuenta corriente y se entregó, ajustar deuda del cliente
      // Marcar pagado → restar; volver a impago → sumar de nuevo
      const shouldAdjust =
        pedido.payMethod === "cuenta_corriente" &&
        pedido.status === "entregado" &&
        pedido.clienteId;
      if (!shouldAdjust) return { ...state, pedidos };
      const delta = nextPaid ? -pedido.total : pedido.total;
      const clientes = state.clientes.map((c) =>
        c.id === pedido.clienteId
          ? { ...c, balance: Math.max(0, c.balance + delta) }
          : c,
      );
      return { ...state, pedidos, clientes };
    }
    case "DEL_PEDIDO":
      return {
        ...state,
        pedidos: state.pedidos.filter((p) => p.id !== action.payload),
        pedidoItems: state.pedidoItems.filter(
          (it) => it.pedidoId !== action.payload,
        ),
      };
    case "ADD_FIXED":
      return { ...state, fixedCosts: [...state.fixedCosts, action.payload] };
    case "DEL_FIXED":
      return {
        ...state,
        fixedCosts: state.fixedCosts.filter((c) => c.id !== action.payload),
      };
    case "ADD_VAR":
      return {
        ...state,
        variableCosts: [...state.variableCosts, action.payload],
      };
    case "DEL_VAR":
      return {
        ...state,
        variableCosts: state.variableCosts.filter(
          (c) => c.id !== action.payload,
        ),
      };
    default:
      return state;
  }
}

function loadInitial(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Merge garantiza compatibilidad si hay estado v1 con campos faltantes
    return {
      ...initialState,
      ...parsed,
      // Re-asegurar arrays defensivamente (si el JSON viene corrupto)
      products: Array.isArray(parsed.products) ? parsed.products : [],
      suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
      clientes: Array.isArray(parsed.clientes) ? parsed.clientes : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      lots: Array.isArray(parsed.lots) ? parsed.lots : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      saleItems: Array.isArray(parsed.saleItems) ? parsed.saleItems : [],
      pedidos: Array.isArray(parsed.pedidos) ? parsed.pedidos : [],
      pedidoItems: Array.isArray(parsed.pedidoItems) ? parsed.pedidoItems : [],
      fixedCosts: Array.isArray(parsed.fixedCosts) ? parsed.fixedCosts : [],
      variableCosts: Array.isArray(parsed.variableCosts)
        ? parsed.variableCosts
        : [],
    };
  } catch {
    return initialState;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const persistFailedRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      persistFailedRef.current = false;
    } catch (err) {
      // QuotaExceededError u otro: avisar UNA sola vez
      if (!persistFailedRef.current) {
        persistFailedRef.current = true;
        const msg =
          err instanceof Error && err.name === "QuotaExceededError"
            ? "Espacio lleno: descargá un backup desde Ajustes"
            : "No pude guardar los cambios — revisá Ajustes";
        toast.error(msg, { duration: 6000 });
      }
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>;
    return { ...initialState, ...parsed };
  } catch {
    return null;
  }
}
