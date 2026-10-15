// The BahayFind mark: a house on a rounded square. "onDark" swaps the colours
// so it stands out on a navy background.
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 text-[1.375rem] font-extrabold tracking-tight ${onDark ? "text-white" : ""}`}>
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
        {/* On a navy panel the colours are fixed. On the page they follow the
            theme (navy square in light mode, amber square in dark mode). */}
        <rect width="32" height="32" rx="9" className={onDark ? "fill-[#f2b134]" : "fill-logo-bg"} />
        <path d="M7 16 16 8l9 8v9H7z" className={onDark ? "fill-[#0f2d52]" : "fill-logo-fg"} />
        <rect x="13" y="18" width="6" height="7" className={onDark ? "fill-[#f2b134]" : "fill-logo-bg"} />
      </svg>
      BahayFind
    </span>
  );
}
