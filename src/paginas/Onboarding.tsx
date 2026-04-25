import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChefHat,
  DollarSign,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { Btn, Card, Field } from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { uid } from "@/lib/utils";
import type { Cliente, Producto, Proveedor, SaleType } from "@/tipos";

interface ProductoForm {
  name: string;
  type: SaleType;
  cost: string;
  local: string;
  reparto: string;
}

interface ProveedorForm {
  name: string;
  contact: string;
}

interface ClienteForm {
  name: string;
  phone: string;
  zone: string;
}

const blankProd = (): ProductoForm => ({
  name: "",
  type: "kilo",
  cost: "",
  local: "",
  reparto: "",
});
const blankSupp = (): ProveedorForm => ({ name: "", contact: "" });
const blankClient = (): ClienteForm => ({ name: "", phone: "", zone: "" });

export function Onboarding() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Distribuidora Recess");
  const [prods, setProds] = useState<ProductoForm[]>([blankProd()]);
  const [supps, setSupps] = useState<ProveedorForm[]>([blankSupp()]);
  const [clients, setClients] = useState<ClienteForm[]>([blankClient()]);

  const updP = <K extends keyof ProductoForm>(
    i: number,
    k: K,
    v: ProductoForm[K],
  ) =>
    setProds((arr) =>
      arr.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)),
    );
  const updS = <K extends keyof ProveedorForm>(
    i: number,
    k: K,
    v: ProveedorForm[K],
  ) =>
    setSupps((arr) =>
      arr.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)),
    );
  const updC = <K extends keyof ClienteForm>(
    i: number,
    k: K,
    v: ClienteForm[K],
  ) =>
    setClients((arr) =>
      arr.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)),
    );

  const finish = () => {
    const products: Producto[] = prods
      .filter((p) => p.name.trim())
      .map((p) => ({
        id: uid(),
        name: p.name.trim(),
        saleType: p.type,
        cost: +p.cost || 0,
        priceLocal: +p.local || 0,
        priceReparto: +p.reparto || 0,
        active: true,
        supplierId: "",
        category: "",
        reorderPoint: 0,
      }));
    const suppliers: Proveedor[] = supps
      .filter((s) => s.name.trim())
      .map((s) => ({
        id: uid(),
        name: s.name.trim(),
        contact: s.contact.trim(),
        active: true,
      }));
    const clientes: Cliente[] = clients
      .filter((c) => c.name.trim())
      .map((c) => ({
        id: uid(),
        name: c.name.trim(),
        phone: c.phone.trim(),
        address: "",
        zone: c.zone.trim(),
        notes: "",
        defaultChannel: "reparto",
        defaultPay: "efectivo",
        active: true,
        balance: 0,
      }));
    dispatch({
      type: "INIT",
      payload: {
        businessName: name.trim() || "Distribuidora",
        products,
        suppliers,
        clientes,
      },
    });
  };

  const features = [
    {
      icon: ShoppingCart,
      title: "Ventas por canal",
      desc: "Local y reparto con precios diferenciados",
    },
    {
      icon: Truck,
      title: "Pedidos y reparto",
      desc: "Estados, ruta del día y cuenta corriente",
    },
    {
      icon: DollarSign,
      title: "Margen en tiempo real",
      desc: "Punto de equilibrio y resultado neto",
    },
    {
      icon: AlertTriangle,
      title: "Alertas inteligentes",
      desc: "Stock bajo, reposición, deuda",
    },
  ];

  const steps = [
    {
      title: "Tu negocio en segundos",
      content: (
        <>
          <p className="mb-5 leading-relaxed text-[#4A5568]">
            Controlá <strong className="text-[#2C3E5C]">ventas, stock,
            pedidos, clientes y rentabilidad</strong> de tu distribuidora. Todo
            en tu navegador, sin cuentas.
          </p>
          <div className="mb-5 grid gap-2.5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-center gap-3 rounded-xl border border-[#EDE5D4] bg-[#F5F0E8] p-3"
                >
                  <div className="flex-shrink-0 rounded-lg bg-[#D4622A]/20 p-2">
                    <Icon size={18} color="#D4622A" />
                  </div>
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#2C3E5C]">
                      {f.title}
                    </div>
                    <div className="text-xs text-[#8A95A3]">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <Field
            label="Nombre del negocio"
            value={name}
            onChange={setName}
            req
          />
        </>
      ),
    },
    {
      title: "Primeros productos",
      content: (
        <>
          <p className="mb-3.5 text-[13px] text-[#8A95A3]">
            Podés agregar más después.
          </p>
          {prods.map((p, i) => (
            <Card key={i} className="mb-3 bg-[#F5F0E8]">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-[11px] uppercase text-[#8A95A3]">
                  Producto {i + 1}
                </span>
                {prods.length > 1 && (
                  <button
                    onClick={() =>
                      setProds((a) => a.filter((_, idx) => idx !== i))
                    }
                    className="rounded p-1 text-[#C0392B]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <Field
                label="Nombre"
                value={p.name}
                onChange={(v) => updP(i, "name", v)}
                placeholder="Ej: Pollo trozado"
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Tipo"
                  value={p.type}
                  onChange={(v) => updP(i, "type", v as SaleType)}
                  options={[
                    { v: "kilo", l: "Por Kilo" },
                    { v: "unidad", l: "Por Unidad" },
                  ]}
                />
                <Field
                  label="Costo"
                  value={p.cost}
                  onChange={(v) => updP(i, "cost", v)}
                  type="number"
                />
                <Field
                  label="Precio Local"
                  value={p.local}
                  onChange={(v) => updP(i, "local", v)}
                  type="number"
                />
                <Field
                  label="Precio Reparto"
                  value={p.reparto}
                  onChange={(v) => updP(i, "reparto", v)}
                  type="number"
                />
              </div>
            </Card>
          ))}
          <Btn
            variant="ghost"
            icon={Plus}
            size="sm"
            onClick={() => setProds([...prods, blankProd()])}
          >
            Agregar producto
          </Btn>
        </>
      ),
    },
    {
      title: "Proveedores",
      content: (
        <>
          <p className="mb-3.5 text-[13px] text-[#8A95A3]">
            Vinculá tus proveedores. Si no tenés ahora, podés saltar.
          </p>
          {supps.map((s, i) => (
            <Card key={i} className="mb-3 bg-[#F5F0E8]">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-[11px] uppercase text-[#8A95A3]">
                  Proveedor {i + 1}
                </span>
                {supps.length > 1 && (
                  <button
                    onClick={() =>
                      setSupps((a) => a.filter((_, idx) => idx !== i))
                    }
                    className="rounded p-1 text-[#C0392B]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <Field
                label="Nombre"
                value={s.name}
                onChange={(v) => updS(i, "name", v)}
                placeholder="Ej: Frigorífico Norte"
              />
              <Field
                label="Contacto"
                value={s.contact}
                onChange={(v) => updS(i, "contact", v)}
                placeholder="Tel / email"
              />
            </Card>
          ))}
          <Btn
            variant="ghost"
            icon={Plus}
            size="sm"
            onClick={() => setSupps([...supps, blankSupp()])}
          >
            Agregar proveedor
          </Btn>
        </>
      ),
    },
    {
      title: "Clientes principales",
      content: (
        <>
          <p className="mb-3.5 text-[13px] text-[#8A95A3]">
            Cargá tus mejores clientes para empezar. Todos los datos se guardan
            en tu navegador.
          </p>
          {clients.map((c, i) => (
            <Card key={i} className="mb-3 bg-[#F5F0E8]">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-[11px] uppercase text-[#8A95A3]">
                  Cliente {i + 1}
                </span>
                {clients.length > 1 && (
                  <button
                    onClick={() =>
                      setClients((a) => a.filter((_, idx) => idx !== i))
                    }
                    className="rounded p-1 text-[#C0392B]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <Field
                label="Nombre"
                value={c.name}
                onChange={(v) => updC(i, "name", v)}
                placeholder="Ej: Carnicería La Paloma"
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Teléfono"
                  value={c.phone}
                  onChange={(v) => updC(i, "phone", v)}
                  type="tel"
                />
                <Field
                  label="Zona"
                  value={c.zone}
                  onChange={(v) => updC(i, "zone", v)}
                />
              </div>
            </Card>
          ))}
          <Btn
            variant="ghost"
            icon={Plus}
            size="sm"
            onClick={() => setClients([...clients, blankClient()])}
          >
            Agregar cliente
          </Btn>
        </>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F0E8]">
      <div className="bg-gradient-to-br from-[#1A2840] to-[#2C3E5C] px-6 pt-9 pb-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex rounded-xl bg-[#D4622A] p-2">
            <ChefHat size={22} color="#fff" />
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-[20px] font-bold uppercase text-white">
              Distribuidora
            </div>
            <div className="font-[family-name:var(--font-display)] text-[13px] uppercase tracking-[0.15em] text-[#D4622A]">
              Recess
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded transition-colors"
              style={{
                background: i <= step ? "#D4622A" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold uppercase text-[#2C3E5C]">
          {steps[step].title}
        </h1>
        {steps[step].content}
      </div>
      <div className="flex gap-2.5 border-t border-[#D8CEBC] bg-[#FDFBF7] px-5 py-3.5 pb-8">
        {step > 0 && (
          <Btn variant="light" full onClick={() => setStep(step - 1)}>
            Atrás
          </Btn>
        )}
        {step < steps.length - 1 ? (
          <Btn full onClick={() => setStep(step + 1)}>
            Continuar
          </Btn>
        ) : (
          <Btn full icon={Check} onClick={finish}>
            Comenzar
          </Btn>
        )}
      </div>
    </div>
  );
}
