import {
  Home,
  Menu,
  Package,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab =
  | "home"
  | "ventas"
  | "pedidos"
  | "productos"
  | "compras"
  | "proveedores"
  | "clientes"
  | "costos"
  | "importar"
  | "ajustes";

interface NavItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "ventas", label: "Ventas", icon: ShoppingCart },
  { id: "pedidos", label: "Pedidos", icon: Truck },
  { id: "productos", label: "Productos", icon: Package },
];

export const MORE_NAV: NavItem[] = [
  { id: "clientes", label: "Clientes", icon: Home },
  { id: "compras", label: "Compras", icon: Package },
  { id: "proveedores", label: "Proveedores", icon: Home },
  { id: "costos", label: "Costos", icon: Home },
  { id: "importar", label: "Importar", icon: Home },
  { id: "ajustes", label: "Ajustes", icon: Home },
];

interface BottomNavProps {
  active: Tab;
  onChange: (t: Tab) => void;
  onMore: () => void;
  pedidosBadge?: number;
}

export function BottomNav({
  active,
  onChange,
  onMore,
  pedidosBadge,
}: BottomNavProps) {
  const items = [
    ...PRIMARY_NAV,
    { id: "more" as const, label: "Más", icon: Menu },
  ];
  const isMoreActive = MORE_NAV.some((m) => m.id === active);
  return (
    <nav
      className="no-print fixed bottom-0 left-1/2 z-[100] flex w-full max-w-[480px] -translate-x-1/2 border-t border-[#D8CEBC] bg-[#FDFBF7]/95 backdrop-blur-md"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      {items.map((n) => {
        const Icon = n.icon;
        const isActive =
          n.id === "more" ? isMoreActive : active === (n.id as Tab);
        const onClick =
          n.id === "more" ? onMore : () => onChange(n.id as Tab);
        const showBadge =
          n.id === "pedidos" && pedidosBadge && pedidosBadge > 0;
        return (
          <button
            key={n.id}
            onClick={onClick}
            aria-label={n.label}
            aria-current={isActive ? "page" : undefined}
            className="press relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2.5"
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#D4622A] to-[#E8834F]" />
            )}
            <div
              className={cn(
                "relative flex h-7 w-7 items-center justify-center transition-transform",
                isActive && "-translate-y-0.5",
              )}
            >
              <Icon
                size={22}
                color={isActive ? "#D4622A" : "#8A95A3"}
                strokeWidth={isActive ? 2.4 : 2}
              />
              {showBadge && (
                <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C0392B] px-1 text-[9px] font-bold tabular-nums text-white shadow ring-2 ring-[#FDFBF7]">
                  {pedidosBadge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.06em] font-[family-name:var(--font-display)] transition-colors",
                isActive ? "text-[#D4622A]" : "text-[#8A95A3]",
              )}
            >
              {n.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
