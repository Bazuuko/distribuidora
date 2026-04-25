import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, sub, action }: SectionHeaderProps) {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-[#1A2840] via-[#2C3E5C] to-[#3D5278] px-5 pb-5 pt-6"
      style={{ paddingTop: `calc(1.5rem + var(--safe-top))` }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-[140px] w-[140px] rounded-full border border-[#D4622A]/15 bg-[#D4622A]/5" />
      <div className="pointer-events-none absolute -right-2 top-12 h-[80px] w-[80px] rounded-full border border-[#D4622A]/10" />
      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          {sub && (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4622A]/90 font-[family-name:var(--font-display)]">
              {sub}
            </div>
          )}
          <h1 className="text-[26px] font-bold uppercase leading-none tracking-tight text-white font-[family-name:var(--font-display)]">
            {title}
          </h1>
        </div>
        {action}
      </div>
    </div>
  );
}
