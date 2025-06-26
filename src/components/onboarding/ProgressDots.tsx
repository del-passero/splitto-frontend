import React from "react";

interface ProgressDotsProps {
  count: number;
  activeIndex: number;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ count, activeIndex }) => (
  <div className="flex items-center justify-center gap-2 mt-4 mb-2">
    {Array.from({ length: count }).map((_, idx) => (
      <span
        key={idx}
        className="inline-block rounded-full transition-all duration-150"
        style={{
          background:
            idx === activeIndex
              ? "var(--tg-theme-link-color, #229ed9)"
              : "var(--tg-theme-hint-color, #888888)",
          width: idx === activeIndex ? 12 : 8,
          height: idx === activeIndex ? 12 : 8,
          opacity: idx === activeIndex ? 1 : 0.5,
        }}
      />
    ))}
  </div>
);

export default ProgressDots;
