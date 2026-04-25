import { useMemo, useState } from "react";
import { Check, Plus, ShoppingCart, Trash2, X } from "lucide-react";
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
import { PAY_LABEL } from "@/tipos";
import type { Channel, PayMethod, Venta, VentaItem } from "@/tipos";

interface Line {
  pid: string;
  qty: string;
  manual: boolean;
  manualPrice: string;
}

const blankLine = (): Line => ({
  pid: "",
  qty: "",
  manual: false,
  manualPrice: "",
});

type Filter = "all" | "local" | "reparto";

export function Ventas() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [channel, setChannel] = useState<Channel>("local");
  const [pay, setPay] = useState<PayMethod>("efectivo");
  const [clienteId, setClienteId] = useState<string>("");
  const [discountPct, setDiscountPct] = useState<string>("");
  const [items, setItems] = useState<Line[]>([blankLine()]);
  const [filter, setFilter] = useState<Filter>("all");

  const upd = (i: number, patch: Partial<Line>) =>
    setItems((curr) => curr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addLine = () => setItems((curr) => [...curr, blankLine()]);
  const removeLine = (i: number) =>
    setItems((curr) =>
      curr.length === 1 ? [blankLine()] : curr.filter((_, idx) => idx !== i),
    );

  const priceFor = (pid: string) => {
    const p = state.products.find((x) => x.id === pid);
    if (!p) return 0;
    return channel === "reparto" ? p.priceReparto : p.priceLocal;
  };

  const preview = useMemo(
    () =>
      items
        .filter((it) => it.pid && +it.qty > 0)
        .map((it) => {
          const qty = +it.qty;
          const unit =
            it.manual && +it.manualPrice > 0 ? +it.manualPrice : priceFor(it.pid);
          const { avgCost } = fifoDeduct(it.pid, qty, state.lots);
          return {
            pid: it.pid,
            qty,
            unit,
            cost: avgCost,
            sub: unit * qty,
            mar: (unit - avgCost) * qty,
          };
        }),
    [items, channel, state.lots, state.products],
  );

  const subTotal = preview.reduce((a, x) => a + x.sub, 0);
  const discountAmount = +discountPct > 0 ? subTotal * (+discountPct / 100) : 0;
  const total = Math.max(0, subTotal - discountAmount);
  const totalCost = preview.reduce((a, x) => a + x.cost * x.qty, 0);
  const margin = total - totalCost;

  const reset = () => {
    setItems([blankLine()]);
    setChannel("local");
    setPay("efectivo");
    setClienteId("");
    setDiscountPct("");
  };

  const save = () => {
    if (!preview.length) {
      toast.error("Agregá al menos un producto");
      return;
    }
    if (pay === "cuenta_corriente" && !clienteId) {
      toast.error("Para cuenta corriente seleccioná un cliente");
      return;
    }
    // Validación stock acumulada por producto (varias líneas del mismo producto)
    const totalQtyByProduct = new Map<string, number>();
    for (const it of preview) {
      totalQtyByProduct.set(
        it.pid,
        (totalQtyByProduct.get(it.pid) ?? 0) + it.qty,
      );
    }
    for (const [pid, qty] of totalQtyByProduct) {
      const st = getStock(pid, state.lots);
      if (qty > st + 1e-6) {
        const name = state.products.find((p) => p.id === pid)?.name ?? "";
        toast.error(`Stock insuficiente: ${name} (pediste ${qty}, hay ${st})`);
        return;
      }
    }
    const sid = uid();
    let lots = [...state.lots];
    const ventaItems: VentaItem[] = preview.map((it) => {
      const result = fifoDeduct(it.pid, it.qty, lots);
      lots = result.updatedLots;
      return {
        id: uid(),
        saleId: sid,
        productId: it.pid,
        qty: it.qty,
        priceAtSale: it.unit,
        costUnit: result.avgCost,
        subtotal: it.unit * it.qty,
        marginItem: (it.unit - result.avgCost) * it.qty,
      };
    });
    const sale: Venta = {
      id: sid,
      date: today(),
      channel,
      payMethod: pay,
      status: "completada",
      total,
      margin,
      clienteId,
      discount: discountAmount,
    };
    dispatch({
      type: "ADD_SALE",
      payload: {
        sale,
        items: ventaItems,
        lots,
        clienteBalanceDelta:
          pay === "cuenta_corriente" && clienteId ? total : 0,
      },
    });

    toast.success(`Venta de ${fmt(total)} registrada`);
    reset();
    setModal(false);
  };

  const sorted = useMemo(() => {
    const f =
      filter === "all"
        ? state.sales
        : state.sales.filter((x) => x.channel === filter);
    return [...f].sort((a, b) => b.date.localeCompare(a.date));
  }, [state.sales, filter]);

  const clienteName = (id: string) =>
    state.clientes.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="pb-20">
      <SectionHeader
        title="Ventas"
        sub="Registro · POS"
        action={
          <Btn icon={Plus} size="sm" onClick={() => setModal(true)}>
            Nueva
          </Btn>
        }
      />
      <Tabs<Filter>
        active={filter}
        onChange={setFilter}
        tabs={[
          { key: "all", label: "Todas" },
          { key: "local", label: "Local" },
          { key: "reparto", label: "Reparto" },
        ]}
      />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        {sorted.length === 0 ? (
          <Empty
            icon={ShoppingCart}
            title="Sin ventas"
            sub="Registrá tu primera venta"
            cta={
              <Btn icon={Plus} onClick={() => setModal(true)}>
                Nueva venta
              </Btn>
            }
          />
        ) : (
          sorted.map((v) => {
            const its = state.saleItems.filter((x) => x.saleId === v.id);
            const cn = clienteName(v.clienteId);
            return (
              <Card
                key={v.id}
                accent={v.channel === "local" ? "#D4622A" : "#2C3E5C"}
                className="mb-2.5"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#2C3E5C]">
                      {fmtDate(v.date)}
                    </div>
                    {cn && (
                      <div className="text-xs text-[#4A5568]">{cn}</div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Tag
                        label={v.channel.toUpperCase()}
                        color={v.channel === "local" ? "#D4622A" : "#2C3E5C"}
                      />
                      <Tag label={PAY_LABEL[v.payMethod]} color="#4A5568" />
                      <Tag
                        label={`${its.length} ÍTEMS`}
                        color="#8A95A3"
                      />
                      {v.discount > 0 && (
                        <Tag
                          label={`-${fmt(v.discount)}`}
                          color="#C47A00"
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-display)] text-[20px] font-bold text-[#2C3E5C]">
                      {fmt(v.total)}
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: v.margin >= 0 ? "#2D7A4F" : "#C0392B" }}
                    >
                      {v.margin >= 0 ? "+" : ""}
                      {fmt(v.margin)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {modal && (
        <Modal title="Nueva Venta" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Canal"
              value={channel}
              onChange={(v) => setChannel(v as Channel)}
              options={[
                { v: "local", l: "Local" },
                { v: "reparto", l: "Reparto" },
              ]}
            />
            <Field
              label="Pago"
              value={pay}
              onChange={(v) => setPay(v as PayMethod)}
              options={[
                { v: "efectivo", l: "Efectivo" },
                { v: "transferencia", l: "Transferencia" },
                { v: "tarjeta", l: "Tarjeta" },
                { v: "cuenta_corriente", l: "Cuenta corriente" },
              ]}
            />
          </div>
          <Field
            label="Cliente (opcional)"
            value={clienteId}
            onChange={setClienteId}
            options={[
              { v: "", l: "Sin cliente" },
              ...state.clientes
                .filter((c) => c.active)
                .map((c) => ({ v: c.id, l: c.name })),
            ]}
            hint={
              pay === "cuenta_corriente" && !clienteId
                ? "⚠️ Para cuenta corriente seleccioná un cliente"
                : undefined
            }
          />
          <Divider label="Productos" />
          {items.map((it, i) => {
            const auto = priceFor(it.pid);
            const st = it.pid ? getStock(it.pid, state.lots) : 999;
            const lineTotal =
              (it.manual && +it.manualPrice > 0 ? +it.manualPrice : auto) *
              (+it.qty || 0);
            return (
              <Card key={i} className="mb-2.5 bg-[#F5F0E8]">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-[family-name:var(--font-display)] text-[11px] uppercase text-[#8A95A3]">
                    Línea {i + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeLine(i)}
                      className="rounded p-1 text-[#C0392B] hover:bg-[#C0392B]/10"
                      aria-label="Quitar línea"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <Field
                  label="Producto"
                  value={it.pid}
                  onChange={(v) => upd(i, { pid: v })}
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
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Cantidad"
                    value={it.qty}
                    onChange={(v) => upd(i, { qty: v })}
                    type="number"
                    hint={
                      it.pid && +it.qty > st ? "⚠️ Stock insuficiente" : ""
                    }
                    small
                  />
                  <div>
                    <div className="mb-1 font-[family-name:var(--font-display)] text-[11px] font-bold uppercase text-[#4A5568]">
                      Precio Auto
                    </div>
                    <div className="rounded-xl border-[1.5px] border-[#D8CEBC] bg-[#FDFBF7] px-3.5 py-2.5 font-[family-name:var(--font-display)] text-sm font-bold text-[#D4622A]">
                      {fmt(auto)}
                    </div>
                  </div>
                </div>
                <label className="my-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={it.manual}
                    onChange={(e) => upd(i, { manual: e.target.checked })}
                  />
                  <span className="text-[13px]">Precio manual</span>
                </label>
                {it.manual && (
                  <Field
                    label="Precio manual"
                    value={it.manualPrice}
                    onChange={(v) => upd(i, { manualPrice: v })}
                    type="number"
                    small
                  />
                )}
                {lineTotal > 0 && (
                  <div className="mt-1 text-right text-xs text-[#4A5568]">
                    Subtotal: <span className="font-bold">{fmt(lineTotal)}</span>
                  </div>
                )}
              </Card>
            );
          })}
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
            label="Descuento %"
            value={discountPct}
            onChange={setDiscountPct}
            type="number"
            small
          />

          {preview.length > 0 && (
            <div className="mb-3.5 rounded-2xl bg-gradient-to-br from-[#2C3E5C] to-[#1A2840] p-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-white/60">
                    Subtotal
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-base font-bold text-white">
                    {fmt(subTotal)}
                  </div>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-white/60">
                    Total
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                    {fmt(total)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-white/60">
                    Margen
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#7FD4A8]">
                    {fmt(margin)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <Btn
            icon={Check}
            full
            size="lg"
            onClick={save}
            disabled={
              !preview.length ||
              (pay === "cuenta_corriente" && !clienteId)
            }
          >
            Confirmar Venta
          </Btn>
        </Modal>
      )}
    </div>
  );
}
