import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  Btn,
  Card,
  Field,
  SectionHeader,
} from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import { today, uid } from "@/lib/utils";
import {
  clienteImportSchema,
  compraImportSchema,
  costoFijoImportSchema,
  productoImportSchema,
  proveedorImportSchema,
} from "@/lib/schemas";

type ImportType =
  | "products"
  | "suppliers"
  | "clientes"
  | "purchases"
  | "fixedcosts";

interface FieldDef {
  key: string;
  label: string;
  req: boolean;
  hint: string;
}

interface SchemaDef {
  label: string;
  fields: FieldDef[];
}

const SCHEMA: Record<ImportType, SchemaDef> = {
  products: {
    label: "Productos",
    fields: [
      { key: "name", label: "Nombre", req: true, hint: "Nombre del producto" },
      { key: "saleType", label: "Tipo", req: false, hint: "kilo / unidad" },
      { key: "cost", label: "Costo", req: true, hint: "Costo de compra" },
      {
        key: "priceLocal",
        label: "Precio Local",
        req: true,
        hint: "Precio canal local",
      },
      {
        key: "priceReparto",
        label: "Precio Reparto",
        req: false,
        hint: "Precio reparto",
      },
      { key: "category", label: "Categoría", req: false, hint: "Ej: Carnes" },
    ],
  },
  suppliers: {
    label: "Proveedores",
    fields: [
      { key: "name", label: "Nombre", req: true, hint: "Nombre" },
      { key: "contact", label: "Contacto", req: false, hint: "Tel/email" },
    ],
  },
  clientes: {
    label: "Clientes",
    fields: [
      { key: "name", label: "Nombre", req: true, hint: "Nombre" },
      { key: "phone", label: "Teléfono", req: false, hint: "WhatsApp" },
      { key: "address", label: "Dirección", req: false, hint: "Calle, num" },
      { key: "zone", label: "Zona", req: false, hint: "Barrio / zona" },
    ],
  },
  purchases: {
    label: "Compras",
    fields: [
      {
        key: "productName",
        label: "Producto",
        req: true,
        hint: "Nombre exacto",
      },
      { key: "qty", label: "Cantidad", req: true, hint: "Cantidad" },
      {
        key: "costUnit",
        label: "Costo unitario",
        req: true,
        hint: "Costo/u",
      },
      {
        key: "supplierName",
        label: "Proveedor",
        req: false,
        hint: "Nombre",
      },
      { key: "date", label: "Fecha", req: false, hint: "YYYY-MM-DD" },
    ],
  },
  fixedcosts: {
    label: "Costos Fijos",
    fields: [
      { key: "name", label: "Nombre", req: true, hint: "Descripción" },
      { key: "amount", label: "Monto", req: true, hint: "Monto mensual" },
    ],
  },
};

const SYNONYMS: Record<string, string[]> = {
  name: ["nombre", "name", "producto", "descripcion", "item", "cliente"],
  saleType: ["tipo", "type", "venta"],
  cost: ["costo", "cost", "costo_unitario", "precio_costo"],
  priceLocal: ["precio_local", "local", "precio local", "p_local"],
  priceReparto: [
    "precio_reparto",
    "reparto",
    "precio reparto",
    "p_reparto",
  ],
  category: ["categoria", "category", "rubro"],
  contact: ["contacto", "contact", "telefono", "email"],
  phone: ["telefono", "phone", "tel", "celular", "whatsapp", "wsp"],
  address: ["direccion", "address", "domicilio", "calle"],
  zone: ["zona", "zone", "barrio", "localidad"],
  productName: [
    "producto",
    "product",
    "nombre_producto",
    "articulo",
    "item",
  ],
  qty: ["cantidad", "qty", "quantity", "kilos", "cant"],
  costUnit: [
    "costo_unitario",
    "costo unitario",
    "cost",
    "precio_costo",
  ],
  supplierName: ["proveedor", "supplier"],
  date: ["fecha", "date"],
  amount: ["monto", "amount", "importe", "valor"],
};

interface RawRow {
  [k: string]: unknown;
}

export function Importar() {
  const { state, dispatch } = useApp();
  const [type, setType] = useState<ImportType>("products");
  const [rawRows, setRawRows] = useState<RawRow[] | null>(null);
  const [colKeys, setColKeys] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const schema = SCHEMA[type];

  const changeType = (v: string) => {
    setType(v as ImportType);
    setRawRows(null);
    setColKeys([]);
    setMapping({});
    setStep("upload");
    setResult(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    e.target.value = "";
    try {
      let parsed: RawRow[] = [];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const lines = text
          .trim()
          .split(/\r?\n/)
          .filter((l) => l.trim());
        if (lines.length < 2)
          throw new Error("El archivo necesita encabezado y datos.");
        const sep = lines[0].includes(";") ? ";" : ",";
        const headers = lines[0]
          .split(sep)
          .map((h) => h.trim().replace(/^"|"$/g, ""));
        parsed = lines.slice(1).map((l) => {
          const vals = l
            .split(sep)
            .map((v) => v.trim().replace(/^"|"$/g, ""));
          return Object.fromEntries(
            headers.map((h, i) => [h, vals[i] ?? ""]),
          );
        });
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, {
          type: "array",
          cellText: false,
          cellDates: true,
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json<RawRow>(ws, {
          defval: "",
          raw: false,
          dateNF: "yyyy-mm-dd",
        });
        if (!parsed.length) throw new Error("La hoja está vacía.");
      }
      const keys = Object.keys(parsed[0]);
      setRawRows(parsed);
      setColKeys(keys);
      const autoMap: Record<string, string> = {};
      schema.fields.forEach((f) => {
        const syns = SYNONYMS[f.key] ?? [f.key];
        const match = keys.find((k) => {
          const norm = k
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_");
          return syns.includes(norm) || syns.includes(k.toLowerCase().trim());
        });
        if (match) autoMap[f.key] = match;
      });
      setMapping(autoMap);
      setStep("map");
      toast.success(`${parsed.length} filas leídas`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const missingRequired = schema.fields.filter(
    (f) => f.req && !mapping[f.key],
  );

  const getMappedRows = () =>
    (rawRows ?? [])
      .map((r) => {
        const out: Record<string, string> = {};
        schema.fields.forEach((f) => {
          const col = mapping[f.key];
          out[f.key] = col ? String(r[col] ?? "").trim() : "";
        });
        return out;
      })
      .filter((r) => {
        const fr = schema.fields.find((f) => f.req);
        return fr ? r[fr.key] !== "" : true;
      });

  const doImport = () => {
    const mapped = getMappedRows();
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    const tryParse = <T,>(
      schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
      data: unknown,
    ): T | null => {
      const r = schema.safeParse(data);
      return r.success ? (r.data as T) : null;
    };

    if (type === "products") {
      mapped.forEach((r) => {
        const parsed = tryParse(productoImportSchema, r);
        if (!parsed) {
          skipped++;
          return;
        }
        dispatch({
          type: "ADD_PRODUCT",
          payload: {
            id: uid(),
            name: parsed.name,
            saleType: parsed.saleType as "kilo" | "unidad",
            cost: parsed.cost,
            priceLocal: parsed.priceLocal,
            priceReparto: parsed.priceReparto ?? 0,
            active: true,
            supplierId: "",
            category: parsed.category,
            reorderPoint: 0,
          },
        });
        created++;
      });
    } else if (type === "suppliers") {
      mapped.forEach((r) => {
        const parsed = tryParse(proveedorImportSchema, r);
        if (!parsed) {
          skipped++;
          return;
        }
        dispatch({
          type: "ADD_SUPPLIER",
          payload: {
            id: uid(),
            name: parsed.name,
            contact: parsed.contact,
            active: true,
          },
        });
        created++;
      });
    } else if (type === "clientes") {
      mapped.forEach((r) => {
        const parsed = tryParse(clienteImportSchema, r);
        if (!parsed) {
          skipped++;
          return;
        }
        dispatch({
          type: "ADD_CLIENTE",
          payload: {
            id: uid(),
            name: parsed.name,
            phone: parsed.phone,
            address: parsed.address,
            zone: parsed.zone,
            notes: "",
            defaultChannel: "reparto",
            defaultPay: "efectivo",
            active: true,
            balance: 0,
          },
        });
        created++;
      });
    } else if (type === "purchases") {
      mapped.forEach((r) => {
        const parsed = tryParse(compraImportSchema, r);
        if (!parsed) {
          skipped++;
          return;
        }
        const prod = state.products.find(
          (p) => p.name.toLowerCase() === parsed.productName.toLowerCase(),
        );
        if (!prod) {
          errors.push(`No encontrado: "${parsed.productName}"`);
          skipped++;
          return;
        }
        if (parsed.qty <= 0) {
          skipped++;
          return;
        }
        const pid = uid();
        const date = parsed.date || today();
        dispatch({
          type: "ADD_PURCHASE",
          payload: {
            purchase: {
              id: pid,
              date,
              supplierId: "",
              productId: prod.id,
              qty: parsed.qty,
              costUnit: parsed.costUnit || prod.cost,
              totalCost: parsed.qty * (parsed.costUnit || prod.cost),
            },
            lot: {
              id: uid(),
              productId: prod.id,
              purchaseDate: date,
              purchaseId: pid,
              qtyInitial: parsed.qty,
              qtyRemaining: parsed.qty,
              costPerUnit: parsed.costUnit || prod.cost,
            },
          },
        });
        created++;
      });
    } else if (type === "fixedcosts") {
      mapped.forEach((r) => {
        const parsed = tryParse(costoFijoImportSchema, r);
        if (!parsed) {
          skipped++;
          return;
        }
        dispatch({
          type: "ADD_FIXED",
          payload: { id: uid(), name: parsed.name, amount: parsed.amount },
        });
        created++;
      });
    }
    setResult({ created, skipped, errors: errors.slice(0, 5) });
    setStep("done");
    toast.success(`${created} importados`);
  };

  return (
    <div className="pb-20">
      <SectionHeader title="Importar datos" sub="Excel / CSV" />
      <div className="min-h-screen bg-[#F5F0E8] p-4">
        <Card className="mb-3">
          <Field
            label="¿Qué importar?"
            value={type}
            onChange={changeType}
            options={Object.entries(SCHEMA).map(([v, sc]) => ({
              v,
              l: sc.label,
            }))}
          />
        </Card>
        {step === "upload" && (
          <Card className="mb-3">
            <div className="mb-3.5 rounded-xl bg-[#F5F0E8] p-3">
              {schema.fields.map((f) => (
                <div key={f.key} className="mb-1 flex items-center gap-1.5">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: f.req ? "#D4622A" : "#8A95A3" }}
                  />
                  <span className="font-mono text-xs font-semibold text-[#2C3E5C]">
                    {f.label}
                  </span>
                  <span className="text-[11px] text-[#8A95A3]">
                    — {f.hint}
                  </span>
                  {f.req && (
                    <span className="text-[10px] text-[#D4622A]">*</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-[#D4622A]/60 bg-[#FDFBF7] py-7 text-center transition hover:border-[#D4622A]"
            >
              <Upload
                size={28}
                className="mx-auto mb-2"
                color="#D4622A"
              />
              <div className="font-[family-name:var(--font-display)] text-[15px] font-bold uppercase text-[#2C3E5C]">
                {loading ? "⏳ Procesando..." : "Seleccionar archivo"}
              </div>
              <div className="text-xs text-[#8A95A3]">.xlsx · .xls · .csv</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,.ods,.txt"
                onChange={handleFile}
                className="hidden"
              />
            </button>
          </Card>
        )}

        {step === "map" && rawRows && (
          <>
            <Card className="mb-3">
              <div className="mb-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase text-[#2C3E5C]">
                Alineá las columnas
              </div>
              {schema.fields.map((f) => (
                <div
                  key={f.key}
                  className="mb-3 rounded-xl bg-[#F5F0E8] p-3"
                >
                  <div className="mb-1.5 font-[family-name:var(--font-display)] text-[13px] font-bold text-[#2C3E5C]">
                    {f.label}
                    {f.req && <span className="text-[#D4622A]"> *</span>}
                  </div>
                  <select
                    value={mapping[f.key] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [f.key]: e.target.value || "",
                      }))
                    }
                    className="w-full rounded-lg border-[1.5px] bg-[#FDFBF7] px-2.5 py-2 text-[13px] focus:border-[#D4622A]"
                    style={{
                      borderColor: mapping[f.key] ? "#D4622A" : "#D8CEBC",
                    }}
                  >
                    <option value="">— No mapear —</option>
                    {colKeys.map((col) => (
                      <option key={col} value={col}>
                        {col}
                        {rawRows[0]?.[col]
                          ? ` (ej: ${String(rawRows[0][col]).slice(0, 20)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {missingRequired.length > 0 && (
                <div className="rounded-xl bg-[#C0392B]/15 p-3 text-xs text-[#C0392B]">
                  ⚠️ Faltan: {missingRequired.map((f) => f.label).join(", ")}
                </div>
              )}
            </Card>
            <Btn
              icon={Check}
              full
              size="lg"
              onClick={doImport}
              disabled={
                missingRequired.length > 0 || getMappedRows().length === 0
              }
            >
              Importar {getMappedRows().length} registros
            </Btn>
          </>
        )}

        {step === "done" && result && (
          <Card>
            <div className="py-3 text-center">
              <div className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold uppercase text-[#2C3E5C]">
                ✓ Importación completa
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[#2D7A4F]/15 p-3 text-center">
                <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#2D7A4F]">
                  {result.created}
                </div>
                <div className="text-[11px] uppercase text-[#4A5568]">
                  Importados
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F0E8] p-3 text-center">
                <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#8A95A3]">
                  {result.skipped}
                </div>
                <div className="text-[11px] uppercase text-[#4A5568]">
                  Omitidos
                </div>
              </div>
            </div>
            {result.errors.map((e, i) => (
              <div key={i} className="mb-1 text-xs text-[#C0392B]">
                {e}
              </div>
            ))}
            <Btn
              variant="navy"
              full
              onClick={() => {
                setStep("upload");
                setRawRows(null);
                setColKeys([]);
                setMapping({});
                setResult(null);
              }}
            >
              Nueva importación
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}
