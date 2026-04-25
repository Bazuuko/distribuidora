import { cn } from "@/lib/utils";

export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  badge?: number;
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  pill?: boolean;
}

export function Tabs<K extends string>({
  tabs,
  active,
  onChange,
  pill,
}: TabsProps<K>) {
  return (
    <div
      className={cn(
        "scrollbar-none flex gap-2 overflow-x-auto border-b border-[#EDE5D4] bg-[#FDFBF7] px-4 py-3",
        pill && "border-none px-0 bg-transparent",
      )}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            aria-pressed={isActive}
            className={cn(
              "press flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors font-[family-name:var(--font-display)]",
              isActive
                ? "bg-gradient-to-b from-[#E16C32] to-[#B04A1A] text-white shadow-[0_2px_8px_-2px_rgba(212,98,42,0.5)]"
                : "border border-[#D8CEBC] bg-white text-[#4A5568] hover:border-[#D4622A]/50 hover:text-[#2C3E5C]",
            )}
          >
            {t.label}
            {typeof t.badge === "number" && t.badge > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-white text-[#D4622A]"
                    : "bg-[#D4622A] text-white",
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
