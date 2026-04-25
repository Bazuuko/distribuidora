import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Phone,
  Plus,
  Printer,
  Truck,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Btn,
  Card,
  Divider,
  Empty,
  Field,
  Modal,
  SectionHeader,
  Tabs,
  Tag,
} from "@/componentes/ui";
import { EstadoBadge } from "@/componentes/pedidos/EstadoBadge";
import { Remito } from "@/componentes/pedidos/Remito";
import { useApp } from "@/contextos/AppContexto";
import {
  fifoDeduct,
  fmt,
  fmtDate,
  fmtN,
  getStock,
  today,
  uid,
} from "@/lib/utils";
import {
  PAY_LABEL,
  type Channel,
  type EstadoPedido,
  type PayMethod,
  type Pedido,
  type PedidoItem,
  type Venta,
  type VentaItem,
} from "@/tipos";

interface Line {
  pid: string;
  qty: string;
}

const blankLine = (): Line => ({ pid: "", qty: "" });

interface FormState {
  clienteId: string;
  scheduledDate: string;
  channel: Channel;
  payMethod: PayMethod;
  notes: string;
  zone: string;
  items: Line[];
}

const blank = (): FormState => ({
  clienteId: "",
  scheduledDate: today(),
  channel: "reparto",
  payMethod: "efectivo",
  notes: "",
  zone: "",
  items: [blankLine()],
});

type Filter = "activos" | "hoy" | "entregados" | "cancelados";

const NEXT_ESTADO: Record<EstadoPedido, EstadoPedido | null> = {
  solicitado: "preparando",
  preparando: "en_reparto",
  en_reparto: "entregado",
  entregado: null,
  cancelado: null,
};

export function Pedidos() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState<Filter>("activos");
  const [form, setForm] = useState<FormState>(blank);
  const [printing, setPrinting] = useState<Pedido | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) =>
        idx === i ? { ...it, ...patch } : it,
      ),
    }));

  const addLine = () =>
    setForm((f) => ({ ...f, items: [...f.items, blankLine()] }));

  const removeLine = (i: number) =>
    setForm((f) => ({
      ...f,
      items:
        f.items.length === 1
          ? [blankLine()]
          : f.items.filter((_, idx) => idx !== i),
    }));

  const priceFor = (pid: string) => {
    const p = state.products.find((x) => x.id === pid);
    if (!p) return 0;
    return form.channel === "reparto" ? p.priceReparto : p.priceLocal;
  };

  const preview = useMemo(
    () =>
      form.items
        .filter((it) => it.pid && +it.qty > 0)
        .map((it) => {
          const qty = +it.qty;
          const unit = priceFor(it.pid);
          const prod = state.products.find((p) => p.id === it.pid);
          return {
            pid: it.pid,
            qty,
            unit,
            sub: unit * qty,
            name: prod?.name ?? "",
          };
        }),
    [form.items, form.channel, state.products],
  );

  const total = preview.reduce((a, x) => a + x.sub, 0);

  const onClienteChange = (cid: string) => {
    const cliente = state.clientes.find((c) => c.id === cid);
    setForm((f) => ({
      ...f,
      clienteId: cid,
      zone: cliente?.zone ?? f.zone,
      channel: cliente?.defaultChannel ?? f.channel,
      payMethod: cliente?.defaultPay ?? f.payMethod,
    }));
  };

  const save = () => {
    if (!form.clienteId) {
      toast.error("Elegí un cliente");
      return;
    }
    if (!preview.length) {
      toast.error("Agregá productos");
      return;
    }
    const cliente = state.clientes.find((c) => c.id === form.clienteId);
    if (!cliente) return;
    const numero = state.pedidoSeq + 1;
    const pid = uid();
    const items: PedidoItem[] = preview.map((it) => ({
      id: uid(),
      pedidoId: pid,
      productId: it.pid,
      productName: it.name,
      qty: it.qty,
      priceAtOrder: it.unit,
      subtotal: it.sub,
    }));
    const pedido: Pedido = {
      id: pid,
      numero,
      date: today(),
      scheduledDate: form.scheduledDate,
      clienteId: cliente.id,
      clienteNombreSnapshot: cliente.name,
      channel: form.channel,
      payMethod: form.payMethod,
      status: "solicitado",
      total,
      margin: 0,
      cost: 0,
      paid: false,
      notes: form.notes.trim(),
      zone: form.zone.trim() || cliente.zone,
      routeOrder: 0,
      saleId: "",
    };
    dispatch({ type: "ADD_PEDIDO", payload: { pedido, items } });
    toast.success(`Pedido #${numero} creado`);
    setForm(blank());
    setModal(false);
  };

  const advance = (pedido: Pedido) => {
    const next = NEXT_ESTADO[pedido.status];
    if (!next) return;

    if (next === "entregado") {
      // Validar stock antes de descontar
      const items = state.pedidoItems.filter((it) => it.pedidoId === pedido.id);
      for (const it of items) {
        const st = getStock(it.productId, state.lots);
        if (it.qty > st) {
          toast.error(`Stock insuficiente: ${it.productName}`);
          return;
        }
      }
      // Crear venta + descontar stock por FIFO
      const sid = uid();
      let lots = [...state.lots];
      const saleItems: VentaItem[] = items.map((it) => {
        const result = fifoDeduct(it.productId, it.qty, lots);
        lots = result.updatedLots;
        return {
          id: uid(),
          saleId: sid,
          productId: it.productId,
          qty: it.qty,
          priceAtSale: it.priceAtOrder,
          costUnit: result.avgCost,
          subtotal: it.subtotal,
          marginItem: (it.priceAtOrder - result.avgCost) * it.qty,
        };
      });
      const totalCost = saleItems.reduce(
        (a, x) => a + x.costUnit * x.qty,
        0,
      );
      const margin = pedido.total - totalCost;
      const sale: Venta = {
        id: sid,
        date: today(),
        channel: pedido.channel,
        payMethod: pedido.payMethod,
        status: "completada",
        total: pedido.total,
        margin,
        clienteId: pedido.clienteId,
        discount: 0,
      };
      dispatch({
        type: "UPD_PEDIDO_ESTADO",
        payload: {
          pedidoId: pedido.id,
          estado: next,
          deliver: { sale, items: saleItems, lots },
        },
      });
      // Si paga en cuenta corriente, sumar deuda
      if (pedido.payMethod === "cuenta_corriente") {
        const cliente = state.clientes.find((c) => c.id === pedido.clienteId);
        if (cliente) {
          dispatch({
            type: "UPD_CLIENTE",
            payload: {
              ...cliente,
              balance: cliente.balance + pedido.total,
            },
          });
        }
      }
      toast.success(`Pedido #${pedido.numero} entregado`);
    } else {
      dispatch({
        type: "UPD_PEDIDO_ESTADO",
        payload: { pedidoId: pedido.id, estado: next },
      });
      toast.success(`Pedido #${pedido.numero}: ${next}`);
    }
  };

  const cancel = (pedido: Pedido) => {
    if (!confirm(`¿Cancelar pedido #${pedido.numero}?`)) return;
    dispatch({
      type: "UPD_PEDIDO_ESTADO",
      payload: { pedidoId: pedido.id, estado: "cancelado" },
    });
    toast.success("Cancelado");
  };

  const togglePaid = (pedido: Pedido) =>
    dispatch({
      type: "MARK_PEDIDO_PAID",
      payload: { pedidoId: pedido.id, paid: !pedido.paid },
    });

  const remove = (pedido: Pedido) => {
    if (!confirm(`¿Eliminar pedido #${pedido.numero} del registro?`)) return;
    dispatch({ type: "DEL_PEDIDO", payload: pedido.id });
  };

  const print = (pedido: Pedido) => {
    setPrinting(pedido);
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 100);
  };

  const filtered = useMemo(() => {
    const todayS = today();
    let list = state.pedidos;
    if (filter === "activos") {
      list = list.filter(
        (p) =>
          p.status === "solicitado" ||
          p.status === "preparando" ||
          p.status === "en_reparto",
      );
    } else if (filter === "hoy") {
      list = list.filter(
        (p) =>
          p.scheduledDate === todayS &&
          p.status !== "cancelado" &&
          p.status !== "entregado",
      );
    } else if (filter === "entregados") {
      list = list.filter((p) => p.status === "entregado");
    } else if (filter === "cancelados") {
      list = list.filter((p) => p.status === "cancelado");
    }
    return [...list].sort((a, b) => {
      // primero por fecha programada, luego por número
      const c = a.scheduledDate.localeCompare(b.scheduledDate);
      if (c !== 0) return c;
      return a.numero - b.numero;
    });
  }, [state.pedidos, filter]);

  const activosCount = state.pedidos.filter(
    (p) =>
      p.status === "solicitado" ||
      p.status === "preparando" ||
      p.status === "en_reparto",
  ).length;
  const hoyCount = state.pedidos.filter(
    (p) =>
      p.scheduledDate === today() &&
      p.status !== "cancelado" &&
      p.status !== "entregado",
  ).length;

  // Agrupar por zona si filter==="hoy"
  const groupedByZone = useMemo(() => {
    if (filter !== "hoy") return null;
    const groups: Record<string, Pedido[]> = {};
    filtered.forEach((p) => {
      const k = p.zone || "Sin zona";
      groups[k] = groups[k] ?? [];
      groups[k].push(p);
    });
    return groups;
  }, [filter, filtered]);

  const totalFiltrado = filtered.reduce((a, p) => a + p.total, 0);

  return (
    <div className="pb-20">
      <SectionHeader
        title="Pedidos"
        sub="Reparto · Entregas"
        action={
          <Btn icon={Plus} size="sm" onClick={() => setModal(true)}>
            Nuevo
          </Btn>
        }
      />
      <Tabs<Filter>
        active={filter}
        onChange={setFilter}
        tabs={[
          { key: "activos", label: "Activos", badge: activosCount },
          { key: "hoy", label: "Hoy", badge: hoyCount },
          { key: "entregados", label: "Entregados" },
          { key: "cancelados", label: "Cancelados" },
        ]}
      />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        {filtered.length > 0 && (
          <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#2C3E5C] to-[#1A2840] p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-[family-name:var(--font-display)] text-[11px] uppercase text-white/60">
                  {filtered.length}{" "}
                  {filter === "hoy" ? "para hoy" : "pedidos"}
                </div>
                <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                  {fmt(totalFiltrado)}
                </div>
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <Empty
            icon={Truck}
            title={
              filter === "hoy" ? "No hay pedidos para hoy" : "Sin pedidos"
            }
            sub={
              state.clientes.length === 0
                ? "Primero cargá un cliente"
                : "Cargá tu primer pedido"
            }
            cta={
              <Btn icon={Plus} onClick={() => setModal(true)}>
                Nuevo pedido
              </Btn>
            }
          />
        ) : groupedByZone ? (
          Object.entries(groupedByZone).map(([zone, list]) => (
            <div key={zone} className="mb-4">
              <Divider label={`${zone} · ${list.length}`} />
              {list.map((p) => (
                <PedidoCardItem
                  key={p.id}
                  pedido={p}
                  items={state.pedidoItems.filter((it) => it.pedidoId === p.id)}
                  onAdvance={() => advance(p)}
                  onCancel={() => cancel(p)}
                  onTogglePaid={() => togglePaid(p)}
                  onRemove={() => remove(p)}
                  onPrint={() => print(p)}
                  cliente={state.clientes.find((c) => c.id === p.clienteId)}
                />
              ))}
            </div>
          ))
        ) : (
          filtered.map((p) => (
            <PedidoCardItem
              key={p.id}
              pedido={p}
              items={state.pedidoItems.filter((it) => it.pedidoId === p.id)}
              onAdvance={() => advance(p)}
              onCancel={() => cancel(p)}
              onTogglePaid={() => togglePaid(p)}
              onRemove={() => remove(p)}
              onPrint={() => print(p)}
              cliente={state.clientes.find((c) => c.id === p.clienteId)}
            />
          ))
        )}
      </div>

      {modal && (
        <Modal title="Nuevo Pedido" onClose={() => setModal(false)} wide>
          {state.clientes.length === 0 ? (
            <Empty
              icon={Truck}
              title="Primero cargá un cliente"
              sub="Andá a Clientes y agregá uno"
            />
          ) : (
            <>
              <Field
                label="Cliente"
                value={form.clienteId}
                onChange={onClienteChange}
                req
                options={[
                  { v: "", l: "Seleccionar..." },
                  ...state.clientes
                    .filter((c) => c.active)
                    .map((c) => ({ v: c.id, l: c.name })),
                ]}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <Field
                  label="Fecha de entrega"
                  value={form.scheduledDate}
                  onChange={(v) => set("scheduledDate", v)}
                  type="date"
                />
                <Field
                  label="Zona"
                  value={form.zone}
                  onChange={(v) => set("zone", v)}
                />
                <Field
                  label="Canal"
                  value={form.channel}
                  onChange={(v) => set("channel", v as Channel)}
                  options={[
                    { v: "local", l: "Local" },
                    { v: "reparto", l: "Reparto" },
                  ]}
                />
                <Field
                  label="Pago"
                  value={form.payMethod}
                  onChange={(v) => set("payMethod", v as PayMethod)}
                  options={[
                    { v: "efectivo", l: "Efectivo" },
                    { v: "transferencia", l: "Transferencia" },
                    { v: "tarjeta", l: "Tarjeta" },
                    { v: "cuenta_corriente", l: "Cuenta corriente" },
                  ]}
                />
              </div>
              <Divider label="Productos" />
              {form.items.map((it, i) => (
                <Card key={i} className="mb-2.5 bg-[#F5F0E8]">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-[family-name:var(--font-display)] text-[11px] uppercase text-[#8A95A3]">
                      Línea {i + 1}
                    </span>
                    {form.items.length > 1 && (
                      <button
                        onClick={() => removeLine(i)}
                        className="rounded p-1 text-[#C0392B]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Field
                    label="Producto"
                    value={it.pid}
                    onChange={(v) => updLine(i, { pid: v })}
                    options={[
                      { v: "", l: "Seleccionar..." },
                      ...state.products
                        .filter((p) => p.active)
                        .map((p) => ({
                          v: p.id,
                          l: `${p.name} (stock: ${fmtN(getStock(p.id, state.lots), 2)})`,
                        })),
                    ]}
                  />
                  <Field
                    label="Cantidad"
                    value={it.qty}
                    onChange={(v) => updLine(i, { qty: v })}
                    type="number"
                    small
                  />
                </Card>
              ))}
              <Btn
                variant="ghost"
                icon={Plus}
                size="sm"
                onClick={addLine}
                className="mb-3.5"
              >
                Agregar línea
              </Btn>
              <Field
                label="Notas"
                value={form.notes}
                onChange={(v) => set("notes", v)}
                textarea
              />
              {preview.length > 0 && (
                <div className="mb-3.5 rounded-2xl bg-gradient-to-br from-[#2C3E5C] to-[#1A2840] p-4">
                  <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-white/60">
                    Total estimado
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
                    {fmt(total)}
                  </div>
                </div>
              )}
              <Btn icon={Check} full size="lg" onClick={save}>
                Crear Pedido
              </Btn>
            </>
          )}
        </Modal>
      )}

      {/* Remito para imprimir */}
      {printing && (
        <Remito
          pedido={printing}
          items={state.pedidoItems.filter((it) => it.pedidoId === printing.id)}
          businessName={state.businessName}
        />
      )}
    </div>
  );
}

interface PedidoCardItemProps {
  pedido: Pedido;
  items: PedidoItem[];
  cliente?: { phone: string; address: string };
  onAdvance: () => void;
  onCancel: () => void;
  onTogglePaid: () => void;
  onRemove: () => void;
  onPrint: () => void;
}

function PedidoCardItem({
  pedido,
  items,
  cliente,
  onAdvance,
  onCancel,
  onTogglePaid,
  onRemove,
  onPrint,
}: PedidoCardItemProps) {
  const next = NEXT_ESTADO[pedido.status];
  const accentMap: Record<EstadoPedido, string> = {
    solicitado: "#3D5278",
    preparando: "#C47A00",
    en_reparto: "#D4622A",
    entregado: "#2D7A4F",
    cancelado: "#8A95A3",
  };
  const wsLink = cliente?.phone
    ? `https://wa.me/${cliente.phone.replace(/\D/g, "")}`
    : null;
  const mapsLink = cliente?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.address)}`
    : null;

  return (
    <Card accent={accentMap[pedido.status]} className="mb-2.5">
      <div className="flex justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-display)] text-[18px] font-bold text-[#2C3E5C]">
              #{String(pedido.numero).padStart(4, "0")}
            </span>
            <EstadoBadge estado={pedido.status} />
            {pedido.paid && <Tag label="PAGADO" color="#2D7A4F" />}
          </div>
          <div className="font-[family-name:var(--font-display)] text-[15px] font-bold text-[#2C3E5C]">
            {pedido.clienteNombreSnapshot}
          </div>
          {pedido.zone && (
            <div className="text-xs text-[#8A95A3]">{pedido.zone}</div>
          )}
          <div className="mt-1 text-xs text-[#4A5568]">
            Entrega: {fmtDate(pedido.scheduledDate)} ·{" "}
            {PAY_LABEL[pedido.payMethod]}
          </div>
          <div className="mt-1.5 text-[12px] text-[#4A5568]">
            {items.length} ítems
          </div>
          {pedido.notes && (
            <div className="mt-1 text-xs italic text-[#8A95A3]">
              "{pedido.notes}"
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-xl font-bold text-[#2C3E5C]">
            {fmt(pedido.total)}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {next && (
          <Btn
            size="sm"
            icon={next === "entregado" ? CheckCircle2 : ArrowRight}
            onClick={onAdvance}
            variant={next === "entregado" ? "success" : "primary"}
          >
            {next === "preparando" && "Preparar"}
            {next === "en_reparto" && "Salir a reparto"}
            {next === "entregado" && "Entregar"}
          </Btn>
        )}
        {pedido.status === "entregado" && (
          <Btn
            size="sm"
            icon={pedido.paid ? X : Check}
            variant={pedido.paid ? "light" : "success"}
            onClick={onTogglePaid}
          >
            {pedido.paid ? "Marcar impago" : "Cobrar"}
          </Btn>
        )}
        <Btn size="sm" icon={Printer} variant="navy" onClick={onPrint}>
          Remito
        </Btn>
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#2C3E5C] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-[#2C3E5C] font-[family-name:var(--font-display)]"
          >
            <MapPin size={14} /> Mapa
          </a>
        )}
        {wsLink && (
          <a
            href={wsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#2D7A4F] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-[#2D7A4F] font-[family-name:var(--font-display)]"
          >
            <Phone size={14} /> WhatsApp
            <ExternalLink size={11} />
          </a>
        )}
        {pedido.status !== "entregado" && pedido.status !== "cancelado" && (
          <Btn size="sm" variant="light" icon={X} onClick={onCancel}>
            Cancelar
          </Btn>
        )}
        {(pedido.status === "cancelado" || pedido.status === "entregado") && (
          <Btn size="sm" variant="light" icon={Trash2} onClick={onRemove}>
            Borrar
          </Btn>
        )}
      </div>
    </Card>
  );
}
