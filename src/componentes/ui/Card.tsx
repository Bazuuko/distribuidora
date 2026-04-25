import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  accent?: string;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function Card({
  children,
  accent,
  onClick,
  className,
  style,
}: CardProps) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#D8CEBC] bg-[#FDFBF7]",
        "shadow-[var(--shadow-card)]",
        interactive &&
          "press cursor-pointer transition-shadow hover:shadow-[var(--shadow-card-hover)]",
        className,
      )}
      style={style}
    >
      {accent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: accent }}
        />
      )}
      <div
        className="px-4 py-3.5"
        style={accent ? { paddingLeft: 20 } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
