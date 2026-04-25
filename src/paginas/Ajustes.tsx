import { useRef, useState } from "react";
import { Check, Database, Download, RotateCcw, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Btn, Card, Field, SectionHeader } from "@/componentes/ui";
import {
  exportState,
  importState,
  useApp,
} from "@/contextos/AppContexto";

export function Ajustes() {
  const { state, dispatch } = useApp();
  const [busName, setBusName] = useState(state.businessName);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = [
    { label: "Productos", v: state.products.length },
    { label: "Clientes", v: state.clientes.length },
    { label: "Proveedores", v: state.suppliers.length },
    { label: "Ventas", v: state.sales.length },
    { label: "Pedidos", v: state.pedidos.length },
    { label: "Compras", v: state.purchases.length },
  ];

  const exportar = () => {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recess-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup descargado");
  };

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (
      !confirm(
        "Esto reemplaza TODOS los datos actuales. ¿Continuar?",
      )
    )
      return;
    const text = await file.text();
    const next = importState(text);
    if (!next) {
      toast.error("Archivo inválido");
      return;
    }
    localStorage.setItem(
      "distribuidora-recess::v2",
      JSON.stringify(next),
    );
    location.reload();
  };

  const reset = () => {
    if (
      !confirm(
        "Vas a borrar TODO. ¿Estás 100% seguro?",
      )
    )
      return;
    if (
      !confirm(
        "Última oportunidad: confirmá BORRAR todos los datos.",
      )
    )
      return;
    dispatch({ type: "RESET" });
    location.reload();
  };

  return (
    <div className="pb-20">
      <SectionHeader title="Ajustes" sub="Datos · Backup" />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        <Card className="mb-3.5">
          <div className="mb-3 font-[family-name:var(--font-display)] text-[14px] font-bold uppercase text-[#2C3E5C]">
            Negocio
          </div>
          <Field
            label="Nombre"
            value={busName}
            onChange={setBusName}
          />
          <Btn
            icon={Check}
            size="sm"
            onClick={() => {
              dispatch({ type: "RENAME_BUSINESS", payload: busName.trim() });
              toast.success("Nombre actualizado");
            }}
          >
            Guardar nombre
          </Btn>
        </Card>

        <Card className="mb-3.5">
          <div className="mb-3 font-[family-name:var(--font-display)] text-[14px] font-bold uppercase text-[#2C3E5C]">
            Datos almacenados
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-[#F5F0E8] p-3 text-center"
              >
                <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#2C3E5C]">
                  {s.v}
                </div>
                <div className="text-[10px] uppercase text-[#8A95A3]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-3.5">
          <div className="mb-3 flex items-center gap-2">
            <Database size={18} color="#2C3E5C" />
            <div className="font-[family-name:var(--font-display)] text-[14px] font-bold uppercase text-[#2C3E5C]">
              Backup / Restore
            </div>
          </div>
          <p className="mb-3 text-xs text-[#4A5568]">
            Tus datos viven en este navegador. Si limpiás el caché o cambiás de
            dispositivo, vas a perderlos. Bajá un backup para protegerte.
          </p>
          <div className="flex flex-col gap-2">
            <Btn icon={Download} variant="navy" full onClick={exportar}>
              Descargar backup (.json)
            </Btn>
            <Btn
              icon={Upload}
              variant="light"
              full
              onClick={() => fileRef.current?.click()}
            >
              Restaurar desde backup
            </Btn>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={importar}
              className="hidden"
            />
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <RotateCcw size={18} color="#C0392B" />
            <div className="font-[family-name:var(--font-display)] text-[14px] font-bold uppercase text-[#C0392B]">
              Zona peligrosa
            </div>
          </div>
          <Btn icon={Trash2} variant="danger" full onClick={reset}>
            Borrar TODOS los datos
          </Btn>
        </Card>
      </div>
    </div>
  );
}
