export type ID = string;
export type ISODate = string;

export type SaleType = "kilo" | "unidad";
export type Channel = "local" | "reparto";
export type PayMethod = "efectivo" | "transferencia" | "tarjeta" | "cuenta_corriente";

export interface Producto {
  id: ID;
  name: string;
  saleType: SaleType;
  cost: number;
  priceLocal: number;
  priceReparto: number;
  active: boolean;
  supplierId: ID | "";
  category: string;
  reorderPoint: number;
}

export interface Proveedor {
  id: ID;
  name: string;
  contact: string;
  active: boolean;
}

export interface Cliente {
  id: ID;
  name: string;
  phone: string;
  address: string;
  zone: string;
  notes: string;
  defaultChannel: Channel;
  defaultPay: PayMethod;
  active: boolean;
  balance: number;
}

export interface Compra {
  id: ID;
  date: ISODate;
  supplierId: ID | "";
  productId: ID;
  qty: number;
  costUnit: number;
  totalCost: number;
}

export interface Lote {
  id: ID;
  productId: ID;
  purchaseDate: ISODate;
  purchaseId: ID;
  qtyInitial: number;
  qtyRemaining: number;
  costPerUnit: number;
}

export interface Venta {
  id: ID;
  date: ISODate;
  channel: Channel;
  payMethod: PayMethod;
  status: "completada" | "anulada";
  total: number;
  margin: number;
  clienteId: ID | "";
  discount: number;
}

export interface VentaItem {
  id: ID;
  saleId: ID;
  productId: ID;
  qty: number;
  priceAtSale: number;
  costUnit: number;
  subtotal: number;
  marginItem: number;
}

export type EstadoPedido =
  | "solicitado"
  | "preparando"
  | "en_reparto"
  | "entregado"
  | "cancelado";

export interface Pedido {
  id: ID;
  numero: number;
  date: ISODate;
  scheduledDate: ISODate;
  clienteId: ID | "";
  clienteNombreSnapshot: string;
  channel: Channel;
  payMethod: PayMethod;
  status: EstadoPedido;
  total: number;
  margin: number;
  cost: number;
  paid: boolean;
  notes: string;
  zone: string;
  routeOrder: number;
  saleId: ID | "";
}

export interface PedidoItem {
  id: ID;
  pedidoId: ID;
  productId: ID;
  productName: string;
  qty: number;
  priceAtOrder: number;
  subtotal: number;
}

export interface CostoFijo {
  id: ID;
  name: string;
  amount: number;
}

export interface CostoVariable {
  id: ID;
  date: ISODate;
  description: string;
  amount: number;
  category: string;
}

export interface AppState {
  onboarded: boolean;
  businessName: string;
  pedidoSeq: number;
  products: Producto[];
  suppliers: Proveedor[];
  clientes: Cliente[];
  purchases: Compra[];
  lots: Lote[];
  sales: Venta[];
  saleItems: VentaItem[];
  pedidos: Pedido[];
  pedidoItems: PedidoItem[];
  fixedCosts: CostoFijo[];
  variableCosts: CostoVariable[];
}

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  solicitado: "Solicitado",
  preparando: "Preparando",
  en_reparto: "En reparto",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const PAY_LABEL: Record<PayMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cta. Cte.",
};
