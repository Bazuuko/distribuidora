import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color?: string;
  trend?: number;
}

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  color = "#D4622A",
  trend,
}: StatProps) {
  return (
    <div className="relative flex-1 min-w-[130px] overflow-hidden rounded-2xl border border-[#D8CEBC] bg-gradient-to-br from-white to-[#FDFBF7] p-3.5 shadow-[var(--shadow-card)]">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10"
        style={{ background: color }}
      />
      <div className="relative">
        <div className="mb-2.5 flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A95A3] font-[family-name:var(--font-display)]">
            {label}
          </span>
          <div
            className="flex items-center justify-center rounded-lg p-1.5"
            style={{ background: color + "1F" }}
          >
            <Icon size={16} color={color} strokeWidth={2.4} />
          </div>
        </div>
        <div className="text-[22px] font-bold text-[#1A2030] font-[family-name:var(--font-display)] leading-tight tabular-nums">
          {value}
        </div>
        {sub && <div className="mt-0.5 text-xs text-[#8A95A3]">{sub}</div>}
        {trend !== undefined && (
          <div className="mt-1.5 flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp size={13} color="#2D7A4F" strokeWidth={2.5} />
            ) : (
              <TrendingDown size={13} color="#C0392B" strokeWidth={2.5} />
            )}
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: trend >= 0 ? "#2D7A4F" : "#C0392B" }}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
