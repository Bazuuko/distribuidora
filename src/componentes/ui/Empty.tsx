import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyProps {
  icon: LucideIcon;
  title: string;
  sub?: string;
  cta?: ReactNode;
}

export function Empty({ icon: Icon, title, sub, cta }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-[#D4622A]/10 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4622A]/20 bg-gradient-to-br from-[#FDFBF7] to-[#EDE5D4]">
          <Icon size={28} color="#D4622A" strokeWidth={2} />
        </div>
      </div>
      <div className="mb-1.5 text-lg font-bold uppercase text-[#2C3E5C] font-[family-name:var(--font-display)] tracking-wide">
        {title}
      </div>
      {sub && (
        <div className="mb-4 max-w-xs text-[13px] leading-relaxed text-[#8A95A3]">
          {sub}
        </div>
      )}
      {cta}
    </div>
  );
}
