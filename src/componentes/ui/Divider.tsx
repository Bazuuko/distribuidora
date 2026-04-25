interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <div className="my-2 flex items-center gap-2.5">
      <div className="h-px flex-1 bg-[#D8CEBC]" />
      {label && (
        <>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8A95A3]">
            {label}
          </span>
          <div className="h-px flex-1 bg-[#D8CEBC]" />
        </>
      )}
    </div>
  );
}
