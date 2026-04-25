# Distribuidora Recess

App de gestión integral para distribuidoras (carnes, fiambres, almacén). Funciona 100% en el navegador — sin servidor, sin cuenta, sin login. Los datos se guardan en `localStorage` y podés exportar/importar backup en JSON desde Ajustes.

## Stack

- React 19 + TypeScript
- Vite 5
- Tailwind CSS 4
- lucide-react (iconos)
- react-hot-toast (notificaciones)
- zod (validación de imports)
- xlsx (Excel/CSV)

## Inicio rápido

```bash
npm install
npm run dev
```

Abrí http://localhost:5173.

## Comandos

```bash
npm run dev        # desarrollo (hot reload)
npm run build      # producción (typecheck + build → dist/)
npm run preview    # previsualizar build
npm run typecheck  # solo TS
```

## Módulos

- **Dashboard** — KPIs (hoy/semana/mes), resultado neto, top productos, alertas, punto de equilibrio, salud del negocio
- **Ventas** — POS con FIFO, multi-línea, descuentos, cliente opcional, cuenta corriente
- **Pedidos / Reparto** — Estados (solicitado → preparando → en reparto → entregado), agrupación por zona, link a Maps y WhatsApp, remito imprimible, descuento de stock al entregar
- **Productos** — Catálogo, stock por lotes, punto de reposición, alertas
- **Clientes** — Datos, deuda, cuenta corriente, cobranza
- **Compras** — Lotes FIFO, integración con proveedores
- **Proveedores** — Totales y última compra
- **Costos** — Fijos y variables (mes en curso)
- **Importar** — Excel/CSV con auto-mapeo y validación zod
- **Ajustes** — Backup/restore JSON, reset, datos almacenados

## Persistencia de datos

Los datos viven en el `localStorage` del navegador bajo la clave `distribuidora-recess::v2`.

**Importante:**
- Si limpiás el caché o cambiás de dispositivo, los datos se pierden.
- En Ajustes podés **descargar un backup en JSON** y **restaurarlo** en otro navegador o dispositivo.
- Recomendamos hacer backup periódicamente (semanal mínimo).

Esta app está pensada para ser usada por un único negocio en uno o dos dispositivos. No tiene auth ni multi-usuario.

## Deploy en Vercel

1. **Importar el repo** en [vercel.com/new](https://vercel.com/new).
2. Vercel detecta automáticamente Vite. No hay variables de entorno que configurar.
3. Click en **Deploy**. En 1-2 minutos está online.

El `vercel.json` ya configura:
- Build command: `npm run build`
- Output: `dist`
- Cache largo para assets estáticos
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Rewrite SPA fallback

### Deploy manual con CLI

```bash
npm i -g vercel
vercel              # primer deploy (preview)
vercel --prod       # producción
```

## Estructura

```
src/
  componentes/
    layout/        BottomNav, MoreSheet
    pedidos/       EstadoBadge, Remito (print)
    ui/            Card, Btn, Field, Modal, Tag, Stat, Empty,
                   SectionHeader, Tabs, Divider
  contextos/       AppContexto (reducer + localStorage)
  lib/             utils (FIFO, formato, helpers), schemas (zod), tema
  paginas/         Dashboard, Ventas, Pedidos, Productos, Clientes,
                   Compras, Proveedores, Costos, Importar, Onboarding,
                   Ajustes
  tipos/           interfaces de dominio
```
