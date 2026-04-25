import { useDeferredValue, useMemo, useState } from "react";
import {
  Check,
  Package,
  PackageX,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Btn,
  Card,
  Empty,
  Field,
  Modal,
  SectionHeader,
  Tag,
} from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { fmt, fmtN, getStock, uid } from "@/lib/utils";
import type { Producto, SaleType } from "@/tipos";

interface FormState {
  name: string;
  saleType: SaleType;
  cost: string;
  priceLocal: string;
  priceReparto: string;
  supplierId: string;
  category: string;
  reorderPoint: string;
  active: boolean;
}

const blank = (): FormState => ({
  name: "",
  saleType: "kilo",
  cost: "",
  priceLocal: "",
  priceReparto: "",
  supplierId: "",
  category: "",
  reorderPoint: "",
  active: true,
});

export function Productos() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<FormState>(blank);

  const open = (p?: Producto) => {
    if (p) {
      setEditId(p.id);
      setForm({
        name: p.name,
        saleType: p.saleType,
        cost: String(p.cost),
        priceLocal: String(p.priceLocal),
        priceReparto: String(p.priceReparto),
        supplierId: p.supplierId,
        category: p.category,
        reorderPoint: String(p.reorderPoint || ""),
        active: p.active,
      });
    } else {
      setEditId(null);
      setForm(blank());
    }
    setModal(true);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Falta el nombre");
      return;
    }
    const payload: Producto = {
      id: editId || uid(),
      name: form.name.trim(),
      saleType: form.saleType,
      cost: +form.cost || 0,
      priceLocal: +form.priceLocal || 0,
      priceReparto: +form.priceReparto || 0,
      supplierId: form.supplierId,
      category: form.category.trim(),
      reorderPoint: +form.reorderPoint || 0,
      active: form.active,
    };
    dispatch({ type: editId ? "UPD_PRODUCT" : "ADD_PRODUCT", payload });
    toast.success(editId ? "Producto actualizado" : "Producto creado");
    setModal(false);
  };

  const remove = () => {
    if (!editId) return;
    const lots = state.lots.filter((l) => l.productId === editId);
    const sales = state.saleItems.filter((it) => it.productId === editId);
    const pedidos = state.pedidoItems.filter((it) => it.productId === editId);
    if (lots.length || sales.length || pedidos.length) {
      const ok = confirm(
        `Este producto tiene historial:\n` +
          `• ${lots.length} lotes\n` +
          `• ${sales.length} ítems vendidos\n` +
          `• ${pedidos.length} ítems en pedidos\n\n` +
          `Si lo borrás, ese historial queda apuntando a un producto inexistente. ` +
          `Te conviene desactivarlo en lugar de eliminarlo.\n\n¿Eliminar igual?`,
      );
      if (!ok) return;
    } else if (!confirm("¿Eliminar producto?")) {
      return;
    }
    dispatch({ type: "DEL_PRODUCT", payload: editId });
    toast.success("Eliminado");
    setModal(false);
  };

  const margin = (price: number, cost: number) =>
    price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";

  const deferredQ = useDeferredValue(q);
  const filtered = useMemo(() => {
    const term = deferredQ.toLowerCase().trim();
    if (!term) return state.products;
    return state.products.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term),
    );
  }, [state.products, deferredQ]);

  return (
    <div className="pb-20">
      <SectionHeader
        title="Productos"
        sub="Catálogo"
        action={
          <Btn icon={Plus} size="sm" onClick={() => open()}>
            Nuevo
          </Btn>
        }
      />

      <div className="border-b border-[#EDE5D4] bg-[#FDFBF7] p-3.5">
        <div className="relative">
          <Search
            size={16}
            color="#8A95A3"
            className="absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-xl border-[1.5px] border-[#D8CEBC] bg-[#F5F0E8] py-2.5 pl-9 pr-3.5 text-sm text-[#1A2030] focus:border-[#D4622A]"
          />
        </div>
      </div>

      <div className="min-h-screen bg-[#F5F0E8] p-4">
        {filtered.length === 0 ? (
          <Empty
            icon={Package}
            title={q ? "Sin resultados" : "Sin productos"}
            sub="Agregá tu primer producto"
            cta={
              <Btn icon={Plus} onClick={() => open()}>
                Nuevo producto
              </Btn>
            }
          />
        ) : (
          filtered.map((p) => {
            const st = getStock(p.id, state.lots);
            const supplier = state.suppliers.find((x) => x.id === p.supplierId);
            const lowReorder = p.reorderPoint > 0 && st <= p.reorderPoint;
            return (
              <Card
                key={p.id}
                accent={p.active ? "#D4622A" : "#8A95A3"}
                onClick={() => open(p)}
                className={`mb-2.5 ${!p.active ? "opacity-60" : ""}`}
              >
                <div className="mb-2.5 flex justify-between">
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-[17px] font-bold text-[#2C3E5C]">
                      {p.name}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Tag
                        label={p.saleType === "kilo" ? "KILO" : "UNIDAD"}
                        color="#2C3E5C"
                      />
                      {p.category && (
                        <Tag label={p.category.toUpperCase()} color="#4A5568" />
                      )}
                      {supplier && (
                        <Tag label={supplier.name.toUpperCase()} color="#3D5278" />
                      )}
                      {st === 0 && (
                        <Tag label="SIN STOCK" color="#C0392B" />
                      )}
                      {st > 0 && lowReorder && (
                        <Tag label="REPONER" color="#C47A00" />
                      )}
                      {st > 0 && !lowReorder && st < 5 && p.reorderPoint === 0 && (
                        <Tag label="STOCK BAJO" color="#C47A00" />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-[#8A95A3]">
                      Stock
                    </div>
                    <div
                      className="font-[family-name:var(--font-display)] text-[20px] font-bold"
                      style={{ color: st === 0 ? "#C0392B" : "#2C3E5C" }}
                    >
                      {fmtN(st, 2)}
                    </div>
                  </div>
                </div>
                <div className="my-2 h-px bg-[#EDE5D4]" />
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { l: "Costo", v: fmt(p.cost), s: null as string | null },
                    {
                      l: "Local",
                      v: fmt(p.priceLocal),
                      s: `${margin(p.priceLocal, p.cost)}%`,
                    },
                    {
                      l: "Reparto",
                      v: fmt(p.priceReparto),
                      s: `${margin(p.priceReparto, p.cost)}%`,
                    },
                  ].map((c) => (
                    <div
                      key={c.l}
                      className="rounded-lg bg-[#F5F0E8] px-2.5 py-2"
                    >
                      <div className="font-[family-name:var(--font-display)] text-[9px] uppercase text-[#8A95A3]">
                        {c.l}
                      </div>
                      <div className="text-[13px] font-bold">{c.v}</div>
                      {c.s && (
                        <div className="text-[11px] font-bold text-[#2D7A4F]">
                          {c.s}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? "Editar Producto" : "Nuevo Producto"}
          onClose={() => setModal(false)}
        >
          <Field
            label="Nombre"
            value={form.name}
            onChange={(v) => set("name", v)}
            req
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Tipo"
              value={form.saleType}
              onChange={(v) => set("saleType", v as SaleType)}
              options={[
                { v: "kilo", l: "Por kilo" },
                { v: "unidad", l: "Por unidad" },
              ]}
            />
            <Field
              label="Costo"
              value={form.cost}
              onChange={(v) => set("cost", v)}
              type="number"
            />
            <Field
              label="Precio Local"
              value={form.priceLocal}
              onChange={(v) => set("priceLocal", v)}
              type="number"
            />
            <Field
              label="Precio Reparto"
              value={form.priceReparto}
              onChange={(v) => set("priceReparto", v)}
              type="number"
            />
          </div>
          <Field
            label="Categoría"
            value={form.category}
            onChange={(v) => set("category", v)}
            placeholder="Ej: Carnes, Lácteos..."
          />
          <Field
            label="Punto de reposición"
            value={form.reorderPoint}
            onChange={(v) => set("reorderPoint", v)}
            type="number"
            hint="Cuando el stock baje de este número, te aviso para reponer"
          />
          <Field
            label="Proveedor"
            value={form.supplierId}
            onChange={(v) => set("supplierId", v)}
            options={[
              { v: "", l: "Sin proveedor" },
              ...state.suppliers
                .filter((s) => s.active)
                .map((s) => ({ v: s.id, l: s.name })),
            ]}
          />
          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Activo</span>
          </label>
          <div className="flex gap-2.5">
            {editId && (
              <Btn variant="danger" icon={Trash2} size="sm" onClick={remove}>
                Eliminar
              </Btn>
            )}
            <Btn icon={Check} full onClick={save}>
              Guardar
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
