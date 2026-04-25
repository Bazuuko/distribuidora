import { z } from "zod";

const numberLike = z.preprocess((v) => {
  if (typeof v === "number") return v;
  const s = String(v ?? "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/\.(?=\d{3}(?:[,.\s]|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}, z.number().nonnegative());

export const productoImportSchema = z.object({
  name: z.string().min(1),
  saleType: z
    .string()
    .optional()
    .transform((v) => (v?.toLowerCase().includes("kilo") ? "kilo" : "unidad")),
  cost: numberLike,
  priceLocal: numberLike,
  priceReparto: numberLike.optional(),
  category: z.string().optional().default(""),
});

export const proveedorImportSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional().default(""),
});

export const clienteImportSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  zone: z.string().optional().default(""),
});

export const compraImportSchema = z.object({
  productName: z.string().min(1),
  qty: numberLike,
  costUnit: numberLike,
  supplierName: z.string().optional().default(""),
  date: z.string().optional().default(""),
});

export const costoFijoImportSchema = z.object({
  name: z.string().min(1),
  amount: numberLike,
});

export type ProductoImport = z.infer<typeof productoImportSchema>;
export type ProveedorImport = z.infer<typeof proveedorImportSchema>;
export type ClienteImport = z.infer<typeof clienteImportSchema>;
export type CompraImport = z.infer<typeof compraImportSchema>;
export type CostoFijoImport = z.infer<typeof costoFijoImportSchema>;
