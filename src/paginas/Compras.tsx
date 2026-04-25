import { useMemo, useState } from "react";
import { Box, Check, Plus } from "lucide-react";
import toast from "react-hot-toast";
import {
  Btn,
  Card,
  Empty,
  Field,
  Modal,
  SectionHeader,
} from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { fmt, fmtDate, fmtN, getStock, today, uid } from "@/lib/utils";

interface FormState {
  supplierId: string;
  productId: string;
  qty: string;
  costUnit: string;
  date: string;
}

const blank = (): FormState => ({
  supplierId: "",
  productId: "",
  qty: "",
  costUnit: "",
  date: today(),
});

export function Compras() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>(blank);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.productId || !form.qty || !form.costUnit) {
      toast.error("Completá producto, cantidad y costo");
      return;
    }
    const qty = +form.qty;
    const cu = +form.costUnit;
    const pid = uid();
    dispatch({
      type: "ADD_PURCHASE",
      payload: {
        purchase: {
          id: pid,
          date: form.date,
          supplierId: form.supplierId,
          productId: form.productId,
          qty,
          costUnit: cu,
          totalCost: qty * cu,
        },
        lot: {
          id: uid(),
          productId: form.productId,
          purchaseDate: form.date,
          purchaseId: pid,
          qtyInitial: qty,
          qtyRemaining: qty,
          costPerUnit: cu,
        },
      },
    });
    toast.success(`Compra de ${fmt(qty * cu)} registrada`);
    setForm(blank());
    setModal(false);
  };

  const sorted = useMemo(
    () => [...state.purchases].sort((a, b) => b.date.localeCompare(a.date)),
    [state.purchases],
  );

  return (
    <div className="pb-20">
      <SectionHeader
        title="Compras"
        sub="Stock & Lotes"
        action={
          <Btn icon={Plus} size="sm" onClick={() => setModal(true)}>
            Nueva
          </Btn>
        }
      />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#2C3E5C] to-[#1A2840] p-4">
          <div className="mb-2.5 font-[family-name:var(--font-display)] text-[15px] font-bold uppercase text-white">
            Stock actual · FIFO
          </div>
          {state.products.filter((p) => p.active).length === 0 && (
            <div className="text-xs text-white/60">
              No hay productos activos
            </div>
          )}
          {state.products
            .filter((p) => p.active)
            .map((p) => {
              const st = getStock(p.id, state.lots);
              return (
                <div
                  key={p.id}
                  className="mb-1.5 flex items-center justify-between rounded-xl bg-white/[0.08] px-3 py-2.5"
                >
                  <div className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
                    {p.name}
                  </div>
                  <div
                    className="font-[family-name:var(--font-display)] text-[20px] font-bold"
                    style={{ color: st === 0 ? "#F08080" : "#7FD4A8" }}
                  >
                    {fmtN(st, 2)}
                  </div>
                </div>
              );
            })}
        </div>

        {sorted.length === 0 ? (
          <Empty
            icon={Box}
            title="Sin compras"
            sub="Registrá tu primera compra"
            cta={
              <Btn icon={Plus} onClick={() => setModal(true)}>
                Nueva compra
              </Btn>
            }
          />
        ) : (
          sorted.map((c) => {
            const prod = state.products.find((x) => x.id === c.productId);
            const supp = state.suppliers.find((x) => x.id === c.supplierId);
            return (
              <Card key={c.id} accent="#D4622A" className="mb-2.5">
                <div className="flex justify-between">
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#2C3E5C]">
                      {prod?.name || "Producto"}
                    </div>
                    <div className="text-xs text-[#8A95A3]">
                      {supp?.name || "Sin proveedor"} · {fmtDate(c.date)}
                    </div>
                    <div className="mt-1 text-[13px] text-[#4A5568]">
                      {fmtN(c.qty, 2)} · {fmt(c.costUnit)} c/u
                    </div>
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-lg font-bold text-[#D4622A]">
                    {fmt(c.totalCost)}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {modal && (
        <Modal title="Nueva Compra" onClose={() => setModal(false)}>
          <Field
            label="Fecha"
            value={form.date}
            onChange={(v) => set("date", v)}
            type="date"
          />
          <Field
            label="Proveedor"
            value={form.supplierId}
            onChange={(v) => set("supplierId", v)}
            options={[
              { v: "", l: "Sin proveedor" },
              ...state.suppliers
                .filter((x) => x.active)
                .map((x) => ({ v: x.id, l: x.name })),
            ]}
          />
          <Field
            label="Producto"
            value={form.productId}
            onChange={(v) => set("productId", v)}
            req
            options={[
              { v: "", l: "Seleccionar..." },
              ...state.products
                .filter((x) => x.active)
                .map((x) => ({ v: x.id, l: x.name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Cantidad"
              value={form.qty}
              onChange={(v) => set("qty", v)}
              type="number"
              req
            />
            <Field
              label="Costo unitario"
              value={form.costUnit}
              onChange={(v) => set("costUnit", v)}
              type="number"
              req
            />
          </div>
          {form.qty && form.costUnit && (
            <div className="mb-3.5 rounded-xl bg-[#F5F0E8] px-3.5 py-2.5">
              <div className="font-[family-name:var(--font-display)] text-[11px] uppercase text-[#8A95A3]">
                Total
              </div>
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#2C3E5C]">
                {fmt(+form.qty * +form.costUnit)}
              </div>
            </div>
          )}
          <Btn icon={Check} full onClick={save}>
            Registrar Compra
          </Btn>
        </Modal>
      )}
    </div>
  );
}
