import { fmt, fmtDate } from "@/lib/utils";
import { PAY_LABEL } from "@/tipos";
import type { Pedido, PedidoItem } from "@/tipos";

interface RemitoProps {
  pedido: Pedido;
  items: PedidoItem[];
  businessName: string;
}

export function Remito({ pedido, items, businessName }: RemitoProps) {
  return (
    <div id="remito-print" className="hidden print:block">
      <div style={{ fontFamily: "Arial, sans-serif", color: "#000" }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{businessName}</h1>
        <div style={{ fontSize: 14, marginBottom: 16 }}>
          REMITO N° {String(pedido.numero).padStart(5, "0")}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div>
              <strong>Cliente:</strong> {pedido.clienteNombreSnapshot}
            </div>
            <div>
              <strong>Zona:</strong> {pedido.zone || "—"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>
              <strong>Fecha:</strong> {fmtDate(pedido.scheduledDate)}
            </div>
            <div>
              <strong>Pago:</strong> {PAY_LABEL[pedido.payMethod]}
            </div>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Producto</th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>Cant.</th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>Precio</th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ padding: "6px 4px" }}>{it.productName}</td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>{it.qty}</td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>
                  {fmt(it.priceAtOrder)}
                </td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>
                  {fmt(it.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", padding: 8, fontWeight: "bold" }}>
                TOTAL
              </td>
              <td style={{ textAlign: "right", padding: 8, fontWeight: "bold", fontSize: 18 }}>
                {fmt(pedido.total)}
              </td>
            </tr>
          </tfoot>
        </table>
        {pedido.notes && (
          <div style={{ marginTop: 16 }}>
            <strong>Notas:</strong> {pedido.notes}
          </div>
        )}
        <div style={{ marginTop: 64, display: "flex", justifyContent: "space-between" }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: 4, width: 200, textAlign: "center" }}>
            Firma cliente
          </div>
          <div style={{ borderTop: "1px solid #000", paddingTop: 4, width: 200, textAlign: "center" }}>
            Repartidor
          </div>
        </div>
      </div>
    </div>
  );
}
