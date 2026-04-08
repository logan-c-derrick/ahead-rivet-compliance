import React from "react";

/**
 * Google Material Symbols (Outlined). Icon names must match
 * https://fonts.google.com/icons — loaded globally from `src/app/layout.tsx`.
 */
export default function MaterialIcon({
  name,
  className,
  title,
  filled,
}: {
  name: string;
  className?: string;
  title?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ""}`}
      title={title}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
          : undefined
      }
    >
      {name}
    </span>
  );
}

