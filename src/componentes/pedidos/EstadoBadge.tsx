import { ESTADO_PEDIDO_LABEL, type EstadoPedido } from "@/tipos";

const COLORS: Record<EstadoPedido, { bg: string; fg: string }> = {
  solicitado: { bg: "#3D5278", fg: "#fff" },
  preparando: { bg: "#C47A00", fg: "#fff" },
  en_reparto: { bg: "#D4622A", fg: "#fff" },
  entregado: { bg: "#2D7A4F", fg: "#fff" },
  cancelado: { bg: "#8A95A3", fg: "#fff" },
};

interface EstadoBadgeProps {
  estado: EstadoPedido;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const c = COLORS[estado];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide font-[family-name:var(--font-display)]"
      style={{ background: c.bg, color: c.fg }}
    >
      {ESTADO_PEDIDO_LABEL[estado]}
    </span>
  );
}
