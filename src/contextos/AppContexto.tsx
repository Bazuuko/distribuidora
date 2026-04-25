import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
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
      payload: { sale: Venta; items: VentaItem[]; lots: Lote[] };
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
        deliver?: { sale: Venta; items: VentaItem[]; lots: Lote[] };
      };
    }
  | { type: "MARK_PEDIDO_PAID"; payload: { pedidoId: string; paid: boolean } }
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
      return initialState;
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
    case "ADD_SALE":
      return {
        ...state,
        sales: [...state.sales, action.payload.sale],
        saleItems: [...state.saleItems, ...action.payload.items],
        lots: action.payload.lots,
      };
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
        return {
          ...state,
          pedidos,
          sales: [...state.sales, deliver.sale],
          saleItems: [...state.saleItems, ...deliver.items],
          lots: deliver.lots,
        };
      }
      return { ...state, pedidos };
    }
    case "MARK_PEDIDO_PAID":
      return {
        ...state,
        pedidos: state.pedidos.map((p) =>
          p.id === action.payload.pedidoId
            ? { ...p, paid: action.payload.paid }
            : p,
        ),
      };
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
    return { ...initialState, ...parsed };
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or disabled */
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
