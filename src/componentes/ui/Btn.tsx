import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "navy" | "ghost" | "danger" | "light" | "success";
type Size = "sm" | "md" | "lg";

interface BtnProps {
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  className?: string;
  type?: "button" | "submit";
  style?: CSSProperties;
  "aria-label"?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#E16C32] to-[#B04A1A] text-white shadow-[0_2px_0_rgba(0,0,0,0.08),0_8px_16px_-4px_rgba(212,98,42,0.4)] active:shadow-[0_0_0_rgba(0,0,0,0),0_2px_8px_-2px_rgba(212,98,42,0.6)]",
  navy: "bg-gradient-to-b from-[#3D5278] to-[#1A2840] text-white shadow-[0_2px_0_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(44,62,92,0.4)]",
  ghost:
    "bg-transparent text-[#D4622A] border-2 border-[#D4622A] hover:bg-[#D4622A]/8",
  danger:
    "bg-gradient-to-b from-[#D6483A] to-[#A22A1F] text-white shadow-[0_2px_0_rgba(0,0,0,0.08),0_8px_16px_-4px_rgba(192,57,43,0.35)]",
  light: "bg-[#EDE5D4] text-[#2C3E5C] hover:bg-[#D8CEBC]",
  success:
    "bg-gradient-to-b from-[#3F9A66] to-[#1F5C3A] text-white shadow-[0_2px_0_rgba(0,0,0,0.08),0_8px_16px_-4px_rgba(45,122,79,0.35)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[36px] px-3.5 text-xs gap-1.5",
  md: "min-h-[44px] px-4 text-sm gap-2",
  lg: "min-h-[52px] px-6 text-[15px] gap-2",
};

const iconSize: Record<Size, number> = { sm: 14, md: 17, lg: 18 };

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  disabled,
  loading,
  full,
  className,
  type = "button",
  style,
  "aria-label": ariaLabel,
}: BtnProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={style}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn(
        "press relative inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-wide font-[family-name:var(--font-display)] select-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        full && "w-full",
        className,
      )}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        Icon && <Icon size={iconSize[size]} />
      )}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight size={iconSize[size]} />}
    </button>
  );
}
