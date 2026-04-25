import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldOption {
  v: string;
  l: string;
}

interface BaseFieldProps {
  label?: string;
  hint?: string;
  req?: boolean;
  small?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number" | "date" | "tel" | "email";
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (v: string) => void;
  options: FieldOption[];
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (v: string) => void;
  textarea: true;
  rows?: number;
  placeholder?: string;
}

type FieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

const baseInputCls =
  "w-full px-4 py-3 rounded-xl border-[1.5px] border-[#D8CEBC] bg-[#FDFBF7] text-[#1A2030] transition-colors focus:border-[#D4622A] focus:bg-white";

export function Field(props: FieldProps) {
  const { label, hint, req, small, className } = props;
  const labelEl = label && (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#4A5568] font-[family-name:var(--font-display)]">
      {label}
      {req && <span className="text-[#D4622A]"> *</span>}
    </label>
  );

  let control: ReactNode = null;
  if ("options" in props) {
    control = (
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={cn(baseInputCls, "appearance-none pr-10 cursor-pointer")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A95A3' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
        }}
      >
        {props.options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    );
  } else if ("textarea" in props) {
    control = (
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows || 3}
        className={cn(baseInputCls, "resize-none")}
      />
    );
  } else {
    control = (
      <input
        type={props.type || "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        step={props.step}
        min={props.min}
        max={props.max}
        inputMode={props.type === "number" ? "decimal" : undefined}
        autoComplete={
          props.type === "tel"
            ? "tel"
            : props.type === "email"
              ? "email"
              : undefined
        }
        className={baseInputCls}
      />
    );
  }

  return (
    <div className={cn(small ? "mb-3" : "mb-4", className)}>
      {labelEl}
      {control}
      {hint && (
        <p className="mt-1.5 text-[11px] leading-snug text-[#8A95A3]">
          {hint}
        </p>
      )}
    </div>
  );
}
