import { useState } from "react";
import { Check, DollarSign, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Btn,
  Card,
  Empty,
  Field,
  Modal,
  SectionHeader,
  Tabs,
} from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { fmt, fmtDate, startOfMonth, today, uid } from "@/lib/utils";

type Tab = "fixed" | "variable";

interface FormState {
  name: string;
  amount: string;
  date: string;
  desc: string;
  cat: string;
}

const blank = (): FormState => ({
  name: "",
  amount: "",
  date: today(),
  desc: "",
  cat: "",
});

export function Costos() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>("fixed");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>(blank);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const totalFixed = state.fixedCosts.reduce((a, x) => a + x.amount, 0);
  const mStart = startOfMonth();
  const totalVar = state.variableCosts
    .filter((c) => c.date >= mStart)
    .reduce((a, x) => a + x.amount, 0);

  const saveFixed = () => {
    if (!form.name || !form.amount) {
      toast.error("Faltan datos");
      return;
    }
    dispatch({
      type: "ADD_FIXED",
      payload: { id: uid(), name: form.name.trim(), amount: +form.amount },
    });
    toast.success("Costo fijo agregado");
    setForm(blank());
    setModal(false);
  };

  const saveVar = () => {
    if (!form.desc || !form.amount) {
      toast.error("Faltan datos");
      return;
    }
    dispatch({
      type: "ADD_VAR",
      payload: {
        id: uid(),
        date: form.date,
        description: form.desc.trim(),
        amount: +form.amount,
        category: form.cat.trim(),
      },
    });
    toast.success("Costo variable agregado");
    setForm(blank());
    setModal(false);
  };

  return (
    <div className="pb-20">
      <SectionHeader
        title="Costos"
        sub="Control"
        action={
          <Btn icon={Plus} size="sm" onClick={() => setModal(true)}>
            Nuevo
          </Btn>
        }
      />
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "fixed", label: "Fijos" },
          { key: "variable", label: "Variables" },
        ]}
      />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        <div className="mb-3.5 rounded-2xl bg-gradient-to-br from-[#2C3E5C] to-[#1A2840] p-4">
          <div className="font-[family-name:var(--font-display)] text-[11px] uppercase text-white/60">
            {tab === "fixed" ? "Total mensual fijos" : "Variables este mes"}
          </div>
          <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
            {fmt(tab === "fixed" ? totalFixed : totalVar)}
          </div>
        </div>

        {tab === "fixed" ? (
          state.fixedCosts.length === 0 ? (
            <Empty
              icon={DollarSign}
              title="Sin costos fijos"
              sub="Alquiler, sueldos, servicios..."
              cta={
                <Btn icon={Plus} onClick={() => setModal(true)}>
                  Agregar
                </Btn>
              }
            />
          ) : (
            state.fixedCosts.map((c) => (
              <Card key={c.id} accent="#D4622A" className="mb-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#2C3E5C]">
                    {c.name}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#D4622A]">
                      {fmt(c.amount)}
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: "DEL_FIXED", payload: c.id })
                      }
                      className="rounded-lg bg-[#C0392B]/15 p-1.5 transition hover:bg-[#C0392B]/25"
                    >
                      <Trash2 size={14} color="#C0392B" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )
        ) : state.variableCosts.length === 0 ? (
          <Empty
            icon={DollarSign}
            title="Sin costos variables"
            sub="Combustible, viáticos, reparaciones..."
            cta={
              <Btn icon={Plus} onClick={() => setModal(true)}>
                Agregar
              </Btn>
            }
          />
        ) : (
          [...state.variableCosts]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((c) => (
              <Card key={c.id} accent="#2C3E5C" className="mb-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-[15px] font-bold text-[#2C3E5C]">
                      {c.description}
                    </div>
                    <div className="text-xs text-[#8A95A3]">
                      {fmtDate(c.date)}
                      {c.category && ` · ${c.category}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#D4622A]">
                      {fmt(c.amount)}
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: "DEL_VAR", payload: c.id })
                      }
                      className="rounded-lg bg-[#C0392B]/15 p-1.5 transition hover:bg-[#C0392B]/25"
                    >
                      <Trash2 size={14} color="#C0392B" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>

      {modal && (
        <Modal
          title={`Nuevo costo ${tab === "fixed" ? "fijo" : "variable"}`}
          onClose={() => setModal(false)}
        >
          {tab === "fixed" ? (
            <>
              <Field
                label="Nombre"
                value={form.name}
                onChange={(v) => set("name", v)}
                req
              />
              <Field
                label="Monto mensual"
                value={form.amount}
                onChange={(v) => set("amount", v)}
                type="number"
                req
              />
              <Btn icon={Check} full onClick={saveFixed}>
                Guardar
              </Btn>
            </>
          ) : (
            <>
              <Field
                label="Fecha"
                value={form.date}
                onChange={(v) => set("date", v)}
                type="date"
              />
              <Field
                label="Descripción"
                value={form.desc}
                onChange={(v) => set("desc", v)}
                req
              />
              <Field
                label="Monto"
                value={form.amount}
                onChange={(v) => set("amount", v)}
                type="number"
                req
              />
              <Field
                label="Categoría"
                value={form.cat}
                onChange={(v) => set("cat", v)}
                placeholder="Ej: Combustible"
              />
              <Btn icon={Check} full onClick={saveVar}>
                Guardar
              </Btn>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
