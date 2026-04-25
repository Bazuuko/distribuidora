import {
  Box,
  Settings,
  Truck,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Tab } from "./BottomNav";

interface MoreItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

const ITEMS: MoreItem[] = [
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    description: "Cuentas, direcciones, deudas",
    color: "#D4622A",
  },
  {
    id: "compras",
    label: "Compras",
    icon: Box,
    description: "Stock, lotes y FIFO",
    color: "#3D5278",
  },
  {
    id: "proveedores",
    label: "Proveedores",
    icon: Truck,
    description: "Datos y compras totales",
    color: "#2C3E5C",
  },
  {
    id: "costos",
    label: "Costos",
    icon: Wallet,
    description: "Fijos y variables del mes",
    color: "#C47A00",
  },
  {
    id: "importar",
    label: "Importar",
    icon: Upload,
    description: "Excel / CSV con mapeo",
    color: "#2D7A4F",
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icon: Settings,
    description: "Backup, reset, datos",
    color: "#4A5568",
  },
];

interface MoreSheetProps {
  active: Tab;
  onPick: (t: Tab) => void;
  onClose: () => void;
}

export function MoreSheet({ active, onPick, onClose }: MoreSheetProps) {
  return (
    <div
      className="glass no-print fixed inset-0 z-[300] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 rounded-t-3xl bg-[#FDFBF7] shadow-[var(--shadow-popover)] animate-slide-up"
        style={{
          paddingBottom: `calc(72px + var(--safe-bottom))`,
        }}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-[#D8CEBC]" />
        </div>
        <div className="px-5 pb-2 pt-3">
          <div className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A95A3]">
            Más opciones
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          {ITEMS.map((m) => {
            const Icon = m.icon;
            const isActive = active === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onPick(m.id);
                  onClose();
                }}
                className="press flex flex-col items-start gap-2 rounded-2xl border border-[#EDE5D4] bg-white p-3.5 text-left transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                style={
                  isActive
                    ? {
                        borderColor: m.color,
                        background: m.color + "0F",
                      }
                    : undefined
                }
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: m.color + "1F" }}
                >
                  <Icon size={20} color={m.color} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-[14px] font-bold uppercase tracking-wide text-[#2C3E5C]">
                    {m.label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[#8A95A3]">
                    {m.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
