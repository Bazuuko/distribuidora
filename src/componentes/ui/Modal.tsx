import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  full?: boolean;
}

export function Modal({ title, onClose, children, wide, full }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="glass no-print fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full bg-[#FDFBF7] overflow-y-auto shadow-[var(--shadow-popover)] animate-slide-up",
          full
            ? "max-h-screen min-h-screen rounded-none"
            : "max-h-[92dvh] rounded-t-3xl",
          wide ? "max-w-[680px]" : "max-w-[480px]",
        )}
        style={{
          paddingBottom: `calc(2rem + var(--safe-bottom))`,
        }}
      >
        {!full && (
          <div className="sticky top-0 z-10 flex justify-center bg-[#FDFBF7] pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[#D8CEBC]" />
          </div>
        )}
        <div className="sticky top-3 z-10 flex items-center justify-between border-b border-[#EDE5D4] bg-[#FDFBF7]/95 px-5 py-3 backdrop-blur">
          <div
            id="modal-title"
            className="font-[family-name:var(--font-display)] text-[18px] font-bold uppercase tracking-wide text-[#2C3E5C]"
          >
            {title}
          </div>
          <button
            onClick={onClose}
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE5D4] transition hover:bg-[#D8CEBC]"
            aria-label="Cerrar"
          >
            <X size={18} className="text-[#4A5568]" />
          </button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
