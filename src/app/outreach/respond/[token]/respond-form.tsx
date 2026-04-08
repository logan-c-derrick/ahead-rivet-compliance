"use client";

import { useCallback, useState } from "react";
import {
  submitOutreachResponse,
  type PublicOutreachComponentItem,
  type PublicOutreachContext,
  type SubmitOutreachResult,
} from "./actions";

function partRowLabel(c: PublicOutreachComponentItem): string {
  const bits = [c.manufacturer, c.itemName, c.manufacturerSku].filter(Boolean);
  return bits.length > 0 ? bits.join(" · ") : c.itemName;
}

function defaultSelectionsForFiles(
  fileCount: number,
  components: PublicOutreachContext["components"]
): string[][] {
  if (fileCount <= 0) return [];
  if (components.length === 1) {
    const id = components[0].componentId;
    return Array.from({ length: fileCount }, () => [id]);
  }
  return Array.from({ length: fileCount }, () => []);
}

export default function RespondForm({
  token,
  context,
}: {
  token: string;
  context: PublicOutreachContext;
}) {
  const [fileRows, setFileRows] = useState<File[]>([]);
  const [selections, setSelections] = useState<string[][]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverState, setServerState] = useState<SubmitOutreachResult | null>(null);
  const [pending, setPending] = useState(false);

  const hasComponentScope = context.components.length > 0;

  const onFilesPicked = useCallback(
    (list: FileList | null) => {
      const arr = list && list.length > 0 ? Array.from(list) : [];
      setFileRows(arr);
      setSelections(defaultSelectionsForFiles(arr.length, context.components));
      setClientError(null);
      setServerState(null);
    },
    [context.components]
  );

  const toggleComponent = useCallback((fileIdx: number, componentId: string, checked: boolean) => {
    setSelections((prev) => {
      const next = prev.map((row) => [...row]);
      const set = new Set(next[fileIdx] ?? []);
      if (checked) set.add(componentId);
      else set.delete(componentId);
      next[fileIdx] = [...set];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setClientError(null);
      setServerState(null);

      if (fileRows.length === 0) {
        setClientError("Please choose at least one file.");
        return;
      }

      if (hasComponentScope) {
        for (let i = 0; i < fileRows.length; i++) {
          if ((selections[i]?.length ?? 0) === 0) {
            setClientError(
              `Select at least one part for "${fileRows[i].name}". Every file must apply to at least one part.`
            );
            return;
          }
        }
      }

      const fd = new FormData();
      for (const f of fileRows) {
        fd.append("files", f);
      }
      for (let i = 0; i < fileRows.length; i++) {
        for (const cid of selections[i] ?? []) {
          fd.append(`component_id_${i}`, cid);
        }
      }

      setPending(true);
      const result = await submitOutreachResponse(token, fd);
      setPending(false);
      setServerState(result);
    },
    [fileRows, hasComponentScope, selections, token]
  );

  const showThankYou = serverState?.success || context.alreadySubmitted;

  const errorMessage =
    clientError || (serverState && !serverState.success ? serverState.error : null);

  if (showThankYou) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12 px-6">
        <div className="w-14 h-14 rounded-full bg-tertiary-fixed-dim/30 flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-headline font-bold text-primary">Thank you</h1>
        <p className="text-on-surface-variant text-sm">
          {context.alreadySubmitted && !serverState?.success
            ? "This link has already been used. If you need to send another file, ask your contact for a new request."
            : `Your files were received. ${context.organizationName} will review your submission.`}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          {context.organizationName}
        </p>
        {context.isFollowUpScoped ? (
          <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-800/60 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            <strong>Follow-up upload.</strong> This link applies only to the parts listed below.
            For each file, choose which parts it supports.
          </div>
        ) : null}
        <h1 className="text-2xl font-headline font-bold text-primary mb-4">
          Supplier document upload
        </h1>
        <p className="text-sm text-on-surface-variant mb-1">
          <span className="font-semibold text-on-surface">Supplier:</span> {context.supplierName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage ? (
          <div className="rounded-xl border border-error/40 bg-error-container/20 p-3 text-sm text-error">
            {errorMessage}
          </div>
        ) : null}

        {context.regulations.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-primary mb-2">Regulations in this request</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-on-surface">
              {context.regulations.map((r) => (
                <li key={`${r.name}-${r.code ?? ""}`}>
                  <span className="font-medium">{r.name}</span>
                  {r.code ? (
                    <span className="text-on-surface-variant font-mono text-xs ml-1">({r.code})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="files" className="block text-sm font-medium mb-1">
            Upload declaration / SDS (PDF, CSV, or ZIP — multiple files allowed)
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            required
            onChange={(e) => onFilesPicked(e.target.files)}
            className="w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary"
          />
          <p className="text-xs text-on-surface-variant mt-2">
            After choosing files, map each one to the parts it applies to below.
          </p>
        </div>

        {fileRows.length > 0 && hasComponentScope ? (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Map files to parts</h2>
            <p className="text-xs text-on-surface-variant">
              Each file must cover at least one part. You can assign different files to different
              parts in a single submission.
            </p>
            <ul className="space-y-4">
              {fileRows.map((file, fileIdx) => (
                <li
                  key={`${fileIdx}-${file.name}-${file.size}`}
                  className="rounded-xl border border-outline-variant/25 bg-surface-container-low/30 p-4 space-y-3"
                >
                  <p className="text-sm font-semibold text-on-surface truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Applies to
                  </p>
                  <ul className="space-y-2">
                    {context.components.map((c) => {
                      const checked = (selections[fileIdx] ?? []).includes(c.componentId);
                      return (
                        <li key={c.componentId}>
                          <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-outline-variant/15 bg-surface-container-low/40 p-2.5 hover:bg-surface-container-low/70 transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                toggleComponent(fileIdx, c.componentId, e.target.checked)
                              }
                              className="mt-1 h-4 w-4 rounded border-outline-variant text-primary"
                            />
                            <div className="space-y-0.5 text-sm text-on-surface min-w-0 flex-1">
                              <span className="block font-medium">{partRowLabel(c)}</span>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {context.dueDate && (
          <p className="text-xs text-on-surface-variant">
            Requested completion: {context.dueDate}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || fileRows.length === 0}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Submit documents"}
        </button>
      </form>
    </div>
  );
}
