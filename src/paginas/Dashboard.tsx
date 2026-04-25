import {
  AlertTriangle,
  ChefHat,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  PackageX,
  Truck,
  Receipt,
} from "lucide-react";
import { Card, Stat, Divider, Tag } from "@/componentes/ui";
import { useApp } from "@/contextos/AppContexto";
import {
  daysAgo,
  fmt,
  fmtN,
  getStock,
  startOfMonth,
  today,
} from "@/lib/utils";
import type { Tab } from "@/componentes/layout/BottomNav";

interface DashboardProps {
  goto: (t: Tab) => void;
}

export function Dashboard({ goto }: DashboardProps) {
  const { state } = useApp();
  const now = new Date();
  const todayS = today();
  const wAgo = daysAgo(7);
  const mStart = startOfMonth(now);
  const pmStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const pmEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .slice(0, 10);

  const completed = state.sales.filter((x) => x.status === "completada");
  const inRange = (from: string, to: string) =>
    completed.filter((x) => x.date >= from && x.date <= to);

  const td = inRange(todayS, todayS);
  const wk = inRange(wAgo, todayS);
  const mo = inRange(mStart, todayS);
  const pm = inRange(pmStart, pmEnd);

  const sum = (xs: typeof completed, k: "total" | "margin") =>
    xs.reduce((a, x) => a + x[k], 0);

  const moRev = sum(mo, "total");
  const pmRev = sum(pm, "total");
  const moMar = sum(mo, "margin");
  const trend = pmRev > 0 ? ((moRev - pmRev) / pmRev) * 100 : 0;

  const fixed = state.fixedCosts.reduce((a, x) => a + x.amount, 0);
  const varMo = state.variableCosts
    .filter((c) => c.date >= mStart)
    .reduce((a, x) => a + x.amount, 0);
  const netResult = moMar - fixed - varMo;

  // Top productos del mes
  const pStats: Record<string, { qty: number; rev: number; mar: number }> = {};
  state.saleItems.forEach((it) => {
    const sale = state.sales.find((x) => x.id === it.saleId);
    if (!sale || sale.status !== "completada" || sale.date < mStart) return;
    if (!pStats[it.productId])
      pStats[it.productId] = { qty: 0, rev: 0, mar: 0 };
    pStats[it.productId].qty += it.qty;
    pStats[it.productId].rev += it.subtotal;
    pStats[it.productId].mar += it.marginItem;
  });
  const pName = (id: string) =>
    state.products.find((p) => p.id === id)?.name || "—";
  const sortBy = (k: "qty" | "rev" | "mar") =>
    Object.entries(pStats).sort((a, b) => b[1][k] - a[1][k])[0];
  const topQ = sortBy("qty");
  const topR = sortBy("rev");
  const topM = sortBy("mar");

  // Punto de equilibrio
  const avgPct = mo.length > 0 && moRev > 0 ? moMar / moRev : 0.25;
  const avgTicket = mo.length > 0 ? moRev / mo.length : 0;
  const be = avgTicket > 0 ? Math.ceil(fixed / (avgTicket * avgPct)) : 0;

  // Salud
  const health: "g" | "y" | "r" =
    netResult > 0 && trend >= 0
      ? "g"
      : netResult > 0 || trend > -5
        ? "y"
        : "r";
  const healthLabel = { g: "🟢 CRECIMIENTO", y: "🟡 ESTABLE", r: "🔴 CAÍDA" }[
    health
  ];
  const healthColor = { g: "#7FD4A8", y: "#F7C96A", r: "#F08080" }[health];
  const healthBg = { g: "#2D7A4F30", y: "#C47A0030", r: "#C0392B30" }[health];

  // Alertas
  type Alerta = { msg: string; lvl: "r" | "y"; tab?: Tab };
  const alerts: Alerta[] = [];
  state.products.forEach((p) => {
    if (!p.active) return;
    const st = getStock(p.id, state.lots);
    if (st === 0)
      alerts.push({ msg: `Sin stock: ${p.name}`, lvl: "r", tab: "compras" });
    else if (p.reorderPoint > 0 && st <= p.reorderPoint)
      alerts.push({
        msg: `Reponer ${p.name} (stock ${fmtN(st, 1)})`,
        lvl: "y",
        tab: "compras",
      });
    else if (st < 5 && p.reorderPoint === 0)
      alerts.push({ msg: `Stock bajo: ${p.name}`, lvl: "y", tab: "compras" });
  });

  // Pedidos pendientes
  const pendientesHoy = state.pedidos.filter(
    (p) =>
      p.scheduledDate <= todayS &&
      (p.status === "solicitado" ||
        p.status === "preparando" ||
        p.status === "en_reparto"),
  );
  if (pendientesHoy.length > 0) {
    alerts.unshift({
      msg: `${pendientesHoy.length} pedidos para entregar hoy o vencidos`,
      lvl: "y",
      tab: "pedidos",
    });
  }

  // Cuenta corriente
  const totalDeuda = state.clientes.reduce(
    (a, c) => a + (c.balance > 0 ? c.balance : 0),
    0,
  );

  return (
    <div className="pb-24">
      {/* Hero */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-[#1A2840] via-[#2C3E5C] to-[#3D5278] px-5 pb-7"
        style={{ paddingTop: `calc(1.5rem + var(--safe-top))` }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-[180px] w-[180px] rounded-full bg-[#D4622A]/10 blur-2xl" />
        <div className="pointer-events-none absolute right-12 top-32 h-[100px] w-[100px] rounded-full border border-[#D4622A]/15" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-[#E16C32] to-[#B04A1A] p-1.5 shadow-[0_4px_12px_-2px_rgba(212,98,42,0.5)]">
              <ChefHat size={16} color="#fff" strokeWidth={2.4} />
            </div>
            <span className="text-[13px] uppercase tracking-[0.15em] text-[#D4622A] font-[family-name:var(--font-display)]">
              {state.businessName}
            </span>
          </div>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-0.5 text-xs capitalize text-white/60">
                {now.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <h1 className="text-[30px] font-bold uppercase leading-none tracking-tight text-white font-[family-name:var(--font-display)]">
                Dashboard
              </h1>
            </div>
            <div
              className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold whitespace-nowrap font-[family-name:var(--font-display)]"
              style={{
                background: healthBg,
                borderColor: healthColor + "80",
                color: healthColor,
              }}
            >
              {healthLabel}
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-sm">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/60 font-[family-name:var(--font-display)]">
              Resultado neto del mes
            </div>
            <div
              className="text-[36px] font-bold leading-none tabular-nums font-[family-name:var(--font-display)]"
              style={{ color: netResult >= 0 ? "#7FD4A8" : "#F08080" }}
            >
              {fmt(netResult)}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { l: "Margen", v: fmt(moMar) },
                { l: "Fijos", v: fmt(fixed) },
                { l: "Variables", v: fmt(varMo) },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-lg bg-white/5 px-2.5 py-2"
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/55 font-[family-name:var(--font-display)]">
                    {x.l}
                  </div>
                  <div className="mt-0.5 text-[13px] font-bold tabular-nums text-white/95">
                    {x.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-[#F5F0E8] px-4 pt-4">
        {/* KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <Stat
            label="Hoy"
            value={fmt(sum(td, "total"))}
            sub={`${td.length} ventas`}
            icon={ShoppingCart}
            color="#D4622A"
          />
          <Stat
            label="Semana"
            value={fmt(sum(wk, "total"))}
            sub={`${wk.length} ventas`}
            icon={TrendingUp}
            color="#2D7A4F"
          />
          <Stat
            label="Mes"
            value={fmt(moRev)}
            sub={`${mo.length} ventas`}
            icon={ShoppingCart}
            color="#2C3E5C"
            trend={trend}
          />
          <Stat
            label="Margen mes"
            value={fmt(moMar)}
            sub={`${moRev > 0 ? ((moMar / moRev) * 100).toFixed(1) : 0}%`}
            icon={DollarSign}
            color="#D4622A"
          />
        </div>

        {/* Top productos */}
        <Card className="mb-3.5">
          <div className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold uppercase text-[#2C3E5C]">
            Top productos · Mes
          </div>
          <Divider />
          <div className="mt-2.5 grid gap-2">
            {[
              {
                l: "Más vendido",
                id: topQ?.[0],
                v: topQ ? `${fmtN(topQ[1].qty)} uds` : "—",
              },
              {
                l: "Mayor facturación",
                id: topR?.[0],
                v: topR ? fmt(topR[1].rev) : "—",
              },
              {
                l: "Mayor margen",
                id: topM?.[0],
                v: topM ? fmt(topM[1].mar) : "—",
              },
            ].map((x) => (
              <div
                key={x.l}
                className="flex items-center justify-between rounded-xl border border-[#EDE5D4] bg-[#F5F0E8] px-3 py-2.5"
              >
                <div>
                  <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-[#8A95A3]">
                    {x.l}
                  </div>
                  <div className="text-sm font-bold text-[#2C3E5C]">
                    {x.id ? pName(x.id) : "—"}
                  </div>
                </div>
                <div className="font-[family-name:var(--font-display)] text-sm font-bold text-[#D4622A]">
                  {x.v}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Punto de equilibrio + cta cuenta corriente */}
        <div className="mb-3.5 grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-[#D4622A] to-[#B04A1A] p-4">
            <div className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold uppercase text-white">
              ⚖️ Punto de Equilibrio
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l: "Ventas / Mes", v: be },
                { l: "Ventas / Día", v: Math.ceil(be / 30) },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl bg-white/20 px-3 py-2.5"
                >
                  <div className="font-[family-name:var(--font-display)] text-[10px] uppercase text-white/75">
                    {x.l}
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-[28px] font-bold text-white">
                    {x.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalDeuda > 0 && (
            <button
              onClick={() => goto("clientes")}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-[0_2px_8px_rgba(44,62,92,0.06)] border border-[#D8CEBC]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#C47A001F] p-2">
                  <Receipt size={20} color="#C47A00" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#8A95A3] font-[family-name:var(--font-display)]">
                    Cuenta corriente
                  </div>
                  <div className="text-base font-bold text-[#2C3E5C]">
                    {state.clientes.filter((c) => c.balance > 0).length}{" "}
                    clientes
                  </div>
                </div>
              </div>
              <div className="font-[family-name:var(--font-display)] text-lg font-bold text-[#C0392B]">
                {fmt(totalDeuda)}
              </div>
            </button>
          )}
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-3 grid gap-2">
            {alerts.slice(0, 6).map((a, i) => (
              <button
                key={i}
                onClick={() => a.tab && goto(a.tab)}
                className="flex items-center gap-2.5 rounded-xl border-l-4 px-3 py-2.5 text-left transition"
                style={{
                  background: (a.lvl === "r" ? "#C0392B" : "#C47A00") + "12",
                  borderLeftColor: a.lvl === "r" ? "#C0392B" : "#C47A00",
                }}
              >
                {a.lvl === "r" ? (
                  <PackageX size={16} color="#C0392B" />
                ) : (
                  <AlertTriangle size={16} color="#C47A00" />
                )}
                <span className="text-[13px] text-[#1A2030]">{a.msg}</span>
              </button>
            ))}
          </div>
        )}

        {/* CTA pedidos pendientes */}
        {pendientesHoy.length > 0 && (
          <Card
            accent="#D4622A"
            onClick={() => goto("pedidos")}
            className="mb-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck size={22} color="#D4622A" />
                <div>
                  <div className="font-[family-name:var(--font-display)] font-bold uppercase text-[#2C3E5C]">
                    Pedidos del día
                  </div>
                  <div className="text-[11px] text-[#8A95A3]">
                    {pendientesHoy.length} pendientes
                  </div>
                </div>
              </div>
              <Tag label="VER" color="#D4622A" />
            </div>
          </Card>
        )}

        {state.products.length === 0 && (
          <Card className="mb-3 bg-[#FDF2E5]">
            <div className="text-sm text-[#1A2030]">
              👋 Empecemos: cargá productos en{" "}
              <button
                onClick={() => goto("productos")}
                className="font-bold text-[#D4622A] underline"
              >
                Productos
              </button>{" "}
              para empezar a vender.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
