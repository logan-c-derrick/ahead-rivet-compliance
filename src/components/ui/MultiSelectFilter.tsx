"use client";

import { useEffect, useRef, useState } from "react";
import MaterialIcon from "./MaterialIcon";

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  const label_ =
    selected.size === 0
      ? `All ${label}`
      : selected.size === 1
      ? Array.from(selected)[0]
      : `${selected.size} ${label} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full min-w-[160px] text-left"
      >
        <span className={`flex-1 truncate ${selected.size > 0 ? "text-primary font-semibold" : "text-on-surface-variant"}`}>
          {label_}
        </span>
        {selected.size > 0 && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(new Set()); }}
            className="text-on-surface-variant hover:text-error rounded p-0.5 shrink-0"
            aria-label="Clear filter"
          >
            <MaterialIcon name="close" className="text-sm" />
          </span>
        )}
        <MaterialIcon
          name={open ? "expand_less" : "expand_more"}
          className="text-on-surface-variant text-base shrink-0"
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[180px] bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-on-surface-variant">No options</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-low cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt)}
                  onChange={() => toggle(opt)}
                  className="rounded border-outline-variant text-primary focus:ring-primary/20"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
