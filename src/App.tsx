import { useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useApp } from "@/contextos/AppContexto";
import { BottomNav, type Tab } from "@/componentes/layout/BottomNav";
import { MoreSheet } from "@/componentes/layout/MoreSheet";
import { Ajustes } from "@/paginas/Ajustes";
import { Clientes } from "@/paginas/Clientes";
import { Compras } from "@/paginas/Compras";
import { Costos } from "@/paginas/Costos";
import { Dashboard } from "@/paginas/Dashboard";
import { Importar } from "@/paginas/Importar";
import { Onboarding } from "@/paginas/Onboarding";
import { Pedidos } from "@/paginas/Pedidos";
import { Productos } from "@/paginas/Productos";
import { Proveedores } from "@/paginas/Proveedores";
import { Ventas } from "@/paginas/Ventas";
import { today } from "@/lib/utils";

export default function App() {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [moreOpen, setMoreOpen] = useState(false);

  const pedidosBadge = useMemo(() => {
    const todayS = today();
    return state.pedidos.filter(
      (p) =>
        p.scheduledDate <= todayS &&
        (p.status === "solicitado" ||
          p.status === "preparando" ||
          p.status === "en_reparto"),
    ).length;
  }, [state.pedidos]);

  if (!state.onboarded) return <Onboarding />;

  const goto = (t: Tab) => {
    setTab(t);
    setMoreOpen(false);
  };

  const renderPage = () => {
    switch (tab) {
      case "home":
        return <Dashboard goto={goto} />;
      case "ventas":
        return <Ventas />;
      case "pedidos":
        return <Pedidos />;
      case "productos":
        return <Productos />;
      case "compras":
        return <Compras />;
      case "proveedores":
        return <Proveedores />;
      case "clientes":
        return <Clientes />;
      case "costos":
        return <Costos />;
      case "importar":
        return <Importar />;
      case "ajustes":
        return <Ajustes />;
      default:
        return <Dashboard goto={goto} />;
    }
  };

  return (
    <div
      className="relative mx-auto min-h-[100dvh] max-w-[480px] bg-[#F5F0E8] font-sans shadow-[0_0_60px_-30px_rgba(0,0,0,0.3)]"
      style={{
        paddingLeft: "var(--safe-left)",
        paddingRight: "var(--safe-right)",
      }}
    >
      <main key={tab} className="animate-fade-in">{renderPage()}</main>
      <BottomNav
        active={tab}
        onChange={goto}
        onMore={() => setMoreOpen((s) => !s)}
        pedidosBadge={pedidosBadge}
      />
      {moreOpen && (
        <MoreSheet
          active={tab}
          onPick={goto}
          onClose={() => setMoreOpen(false)}
        />
      )}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1A2840",
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            borderRadius: 12,
            padding: "12px 16px",
            boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)",
            maxWidth: 360,
          },
          success: { iconTheme: { primary: "#7FD4A8", secondary: "#1A2840" } },
          error: { iconTheme: { primary: "#F08080", secondary: "#1A2840" } },
        }}
      />
    </div>
  );
}
