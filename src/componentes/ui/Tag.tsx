interface TagProps {
  label: string;
  color?: string;
  className?: string;
}

export function Tag({ label, color = "#D4622A", className }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide tabular-nums font-[family-name:var(--font-display)] ${className ?? ""}`}
      style={{ background: color + "1F", color }}
    >
      {label}
    </span>
  );
}
