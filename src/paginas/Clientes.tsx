import { useDeferredValue, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Btn,
  Card,
  Empty,
  Field,
  Modal,
  SectionHeader,
  Tabs,
  Tag,
} from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { fmt, fmtDate, uid } from "@/lib/utils";
import type { Channel, Cliente, PayMethod } from "@/tipos";

interface FormState {
  name: string;
  phone: string;
  address: string;
  zone: string;
  notes: string;
  defaultChannel: Channel;
  defaultPay: PayMethod;
  active: boolean;
}

const blank = (): FormState => ({
  name: "",
  phone: "",
  address: "",
  zone: "",
  notes: "",
  defaultChannel: "reparto",
  defaultPay: "efectivo",
  active: true,
});

type Filter = "all" | "deuda";

export function Clientes() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pagoModal, setPagoModal] = useState<Cliente | null>(null);
  const [pagoMonto, setPagoMonto] = useState("");

  const open = (c?: Cliente) => {
    if (c) {
      setEditId(c.id);
      setForm({
        name: c.name,
        phone: c.phone,
        address: c.address,
        zone: c.zone,
        notes: c.notes,
        defaultChannel: c.defaultChannel,
        defaultPay: c.defaultPay,
        active: c.active,
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
    const existing = state.clientes.find((c) => c.id === editId);
    const payload: Cliente = {
      id: editId || uid(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      zone: form.zone.trim(),
      notes: form.notes.trim(),
      defaultChannel: form.defaultChannel,
      defaultPay: form.defaultPay,
      active: form.active,
      balance: existing?.balance ?? 0,
    };
    dispatch({ type: editId ? "UPD_CLIENTE" : "ADD_CLIENTE", payload });
    toast.success(editId ? "Cliente actualizado" : "Cliente creado");
    setModal(false);
  };

  const remove = () => {
    if (!editId) return;
    if (!confirm("¿Eliminar cliente?")) return;
    dispatch({ type: "DEL_CLIENTE", payload: editId });
    toast.success("Eliminado");
    setModal(false);
  };

  const registrarPago = () => {
    if (!pagoModal || !pagoMonto || +pagoMonto <= 0) {
      toast.error("Monto inválido");
      return;
    }
    const monto = +pagoMonto;
    dispatch({
      type: "UPD_CLIENTE",
      payload: { ...pagoModal, balance: Math.max(0, pagoModal.balance - monto) },
    });
    toast.success(`Pago de ${fmt(monto)} registrado`);
    setPagoModal(null);
    setPagoMonto("");
  };

  const deferredQ = useDeferredValue(q);
  const filtered = useMemo(() => {
    let list = state.clientes;
    if (filter === "deuda") list = list.filter((c) => c.balance > 0);
    const term = deferredQ.toLowerCase().trim();
    if (term) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.address.toLowerCase().includes(term) ||
          c.zone.toLowerCase().includes(term),
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [state.clientes, deferredQ, filter]);

  const conDeuda = state.clientes.filter((c) => c.balance > 0).length;

  return (
    <div className="pb-20">
      <SectionHeader
        title="Clientes"
        sub={`Cuentas · ${state.clientes.length}`}
        action={
          <Btn icon={Plus} size="sm" onClick={() => open()}>
            Nuevo
          </Btn>
        }
      />
      <Tabs<Filter>
        active={filter}
        onChange={setFilter}
        tabs={[
          { key: "all", label: "Todos" },
          { key: "deuda", label: "Con deuda", badge: conDeuda },
        ]}
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
            placeholder="Buscar por nombre, tel, zona..."
            className="w-full rounded-xl border-[1.5px] border-[#D8CEBC] bg-[#F5F0E8] py-2.5 pl-9 pr-3.5 text-sm focus:border-[#D4622A]"
          />
        </div>
      </div>
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        {filtered.length === 0 ? (
          <Empty
            icon={Users}
            title={q || filter === "deuda" ? "Sin resultados" : "Sin clientes"}
            sub="Agregá tu primer cliente"
            cta={
              <Btn icon={Plus} onClick={() => open()}>
                Nuevo cliente
              </Btn>
            }
          />
        ) : (
          filtered.map((c) => {
            const ventasCount = state.sales.filter(
              (v) => v.clienteId === c.id,
            ).length;
            const lastSale = [...state.sales]
              .filter((v) => v.clienteId === c.id)
              .sort((a, b) => b.date.localeCompare(a.date))[0];
            return (
              <Card
                key={c.id}
                accent={c.balance > 0 ? "#C47A00" : "#2C3E5C"}
                className={`mb-2.5 ${!c.active ? "opacity-60" : ""}`}
                onClick={() => open(c)}
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-[family-name:var(--font-display)] text-[17px] font-bold text-[#2C3E5C]">
                      {c.name}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {c.zone && <Tag label={c.zone.toUpperCase()} color="#3D5278" />}
                      {c.balance > 0 && (
                        <Tag label="DEUDA" color="#C47A00" />
                      )}
                    </div>
                    {c.phone && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#4A5568]">
                        <Phone size={12} /> {c.phone}
                      </div>
                    )}
                    {c.address && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#4A5568]">
                        <MapPin size={12} /> {c.address}
                      </div>
                    )}
                    <div className="mt-1.5 text-[11px] text-[#8A95A3]">
                      {ventasCount} ventas
                      {lastSale && ` · última ${fmtDate(lastSale.date)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-[#8A95A3]">
                      Saldo
                    </div>
                    <div
                      className="font-[family-name:var(--font-display)] text-lg font-bold"
                      style={{ color: c.balance > 0 ? "#C0392B" : "#2D7A4F" }}
                    >
                      {fmt(c.balance)}
                    </div>
                    {c.balance > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPagoMonto(String(c.balance));
                          setPagoModal(c);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-[#2D7A4F] px-2 py-1 text-[10px] font-bold text-white"
                      >
                        <Receipt size={12} /> COBRAR
                      </button>
                    )}
                    {c.phone && (
                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-[#2C3E5C] px-2 py-1 text-[10px] font-bold text-white"
                      >
                        <ExternalLink size={12} /> WSP
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? "Editar Cliente" : "Nuevo Cliente"}
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
              label="Teléfono"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              type="tel"
              placeholder="11 5555 5555"
            />
            <Field
              label="Zona"
              value={form.zone}
              onChange={(v) => set("zone", v)}
              placeholder="Ej: Centro"
            />
          </div>
          <Field
            label="Dirección"
            value={form.address}
            onChange={(v) => set("address", v)}
            placeholder="Calle 123, piso..."
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Canal default"
              value={form.defaultChannel}
              onChange={(v) => set("defaultChannel", v as Channel)}
              options={[
                { v: "local", l: "Local" },
                { v: "reparto", l: "Reparto" },
              ]}
            />
            <Field
              label="Pago default"
              value={form.defaultPay}
              onChange={(v) => set("defaultPay", v as PayMethod)}
              options={[
                { v: "efectivo", l: "Efectivo" },
                { v: "transferencia", l: "Transferencia" },
                { v: "tarjeta", l: "Tarjeta" },
                { v: "cuenta_corriente", l: "Cuenta corriente" },
              ]}
            />
          </div>
          <Field
            label="Notas"
            value={form.notes}
            onChange={(v) => set("notes", v)}
            textarea
          />
          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
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

      {pagoModal && (
        <Modal
          title={`Cobrar a ${pagoModal.name}`}
          onClose={() => setPagoModal(null)}
        >
          <div className="mb-3.5 rounded-xl bg-[#F5F0E8] px-3.5 py-3">
            <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-[#8A95A3]">
              Saldo pendiente
            </div>
            <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#C0392B]">
              {fmt(pagoModal.balance)}
            </div>
          </div>
          <Field
            label="Monto a cobrar"
            value={pagoMonto}
            onChange={setPagoMonto}
            type="number"
          />
          <Btn icon={Check} full variant="success" onClick={registrarPago}>
            Registrar pago
          </Btn>
        </Modal>
      )}
    </div>
  );
}
