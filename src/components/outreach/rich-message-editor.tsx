"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

const QuillInner = dynamic(() => import("./rich-message-quill-inner"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-slate-500 py-8 font-body">Loading editor…</p>
  ),
});

const PLACEHOLDERS: [string, string][] = [
  ["Contact", "{{supplier_contact}}"],
  ["Component (one)", "{{component_name}}"],
  ["Components (csv)", "{{component_names}}"],
  ["Components (list)", "{{component_list}}"],
  ["Regulation (one)", "{{regulation_name}}"],
  ["Regulations (csv)", "{{regulation_names}}"],
  ["Regulations (list)", "{{regulation_list}}"],
  ["Due date", "{{deadline_date}}"],
  ["Portal link", "{{portal_unique_link}}"],
];

type Props = {
  name: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  id?: string;
};

export function RichMessageEditor({ name, value, onChange, disabled, id }: Props) {
  const insertPlaceholder = useCallback(
    (token: string) => {
      const block = `<p>${token}</p>`;
      onChange(value.trim() ? `${value}${block}` : block);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} readOnly aria-hidden />
      <QuillInner value={value} onChange={onChange} disabled={disabled} id={id} />
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-body mr-1">
          Insert
        </span>
        {PLACEHOLDERS.map(([label, token]) => (
          <button
            key={token}
            type="button"
            disabled={disabled}
            onClick={() => insertPlaceholder(token)}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors font-body disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
