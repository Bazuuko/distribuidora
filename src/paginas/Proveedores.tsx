import { useState } from "react";
import { Check, Plus, Trash2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { Btn, Card, Empty, Field, Modal, SectionHeader } from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { fmt, fmtDate, uid } from "@/lib/utils";
import type { Proveedor } from "@/tipos";

interface FormState {
  name: string;
  contact: string;
  active: boolean;
}

const blank = (): FormState => ({ name: "", contact: "", active: true });

export function Proveedores() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank);

  const open = (s?: Proveedor) => {
    if (s) {
      setEditId(s.id);
      setForm({ name: s.name, contact: s.contact, active: s.active });
    } else {
      setEditId(null);
      setForm(blank());
    }
    setModal(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Falta el nombre");
      return;
    }
    dispatch({
      type: editId ? "UPD_SUPPLIER" : "ADD_SUPPLIER",
      payload: {
        id: editId || uid(),
        name: form.name.trim(),
        contact: form.contact.trim(),
        active: form.active,
      },
    });
    toast.success(editId ? "Proveedor actualizado" : "Proveedor creado");
    setModal(false);
  };

  const remove = () => {
    if (!editId) return;
    if (!confirm("¿Eliminar proveedor?")) return;
    dispatch({ type: "DEL_SUPPLIER", payload: editId });
    toast.success("Eliminado");
    setModal(false);
  };

  return (
    <div className="pb-20">
      <SectionHeader
        title="Proveedores"
        sub="Gestión"
        action={
          <Btn icon={Plus} size="sm" onClick={() => open()}>
            Nuevo
          </Btn>
        }
      />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        {state.suppliers.length === 0 ? (
          <Empty
            icon={Truck}
            title="Sin proveedores"
            sub="Agregá tus proveedores"
            cta={
              <Btn icon={Plus} onClick={() => open()}>
                Nuevo proveedor
              </Btn>
            }
          />
        ) : (
          state.suppliers.map((sup) => {
            const compras = state.purchases.filter(
              (c) => c.supplierId === sup.id,
            );
            const total = compras.reduce((a, x) => a + x.totalCost, 0);
            const last = [...compras].sort((a, b) =>
              b.date.localeCompare(a.date),
            )[0];
            return (
              <Card
                key={sup.id}
                accent="#2C3E5C"
                onClick={() => open(sup)}
                className={`mb-2.5 ${!sup.active ? "opacity-60" : ""}`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-[17px] font-bold text-[#2C3E5C]">
                      {sup.name}
                    </div>
                    {sup.contact && (
                      <div className="text-xs text-[#8A95A3]">
                        {sup.contact}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-[#4A5568]">
                      {compras.length} compras
                      {last && ` · última ${fmtDate(last.date)}`}
                    </div>
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#D4622A]">
                    {fmt(total)}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? "Editar Proveedor" : "Nuevo Proveedor"}
          onClose={() => setModal(false)}
        >
          <Field
            label="Nombre"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            req
          />
          <Field
            label="Contacto"
            value={form.contact}
            onChange={(v) => setForm((f) => ({ ...f, contact: v }))}
            placeholder="Tel / email"
          />
          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
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
