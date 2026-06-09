"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { RichMessageEditor } from "@/components/outreach/rich-message-editor";
import {
  STOCK_OUTREACH_MESSAGE,
  STOCK_OUTREACH_SUBJECT,
  stockMessageAsHtml,
} from "@/lib/outreach-stock-templates";
import { saveOutreachEmailDefaults } from "../template-actions";

export default function TemplateSettingsForm({
  initialSubject,
  initialMessageHtml,
}: {
  initialSubject: string;
  initialMessageHtml: string;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [messageHtml, setMessageHtml] = useState(initialMessageHtml);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const result = await saveOutreachEmailDefaults({
        subjectTemplate: subject,
        messageTemplate: messageHtml,
      });
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      setOk(true);
    });
  }

  function handleResetStock() {
    setSubject(STOCK_OUTREACH_SUBJECT);
    setMessageHtml(stockMessageAsHtml());
    setErr(null);
    setOk(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <nav className="flex items-center gap-2 text-slate-500 text-sm mb-2 font-body">
          <Link href="/outreach" className="hover:text-primary">
            Outreach
          </Link>
          <MaterialIcon name="chevron_right" className="text-xs" />
          <span className="text-primary font-medium">Email templates</span>
        </nav>
        <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
          Default outreach templates
        </h1>
        <p className="text-slate-500 mt-2 font-body max-w-2xl">
          These values pre-fill the <strong>New campaign</strong> form. Use formatting in the
          message; emails are sent as HTML. Put{" "}
          <code className="text-xs">{"{{regulation_list}}"}</code> and{" "}
          <code className="text-xs">{"{{component_list}}"}</code> on their own lines: they expand to
          real HTML bullet lists (no extra • characters). Avoid wrapping those placeholders in the
          editor&apos;s bullet or bold tools, or you may get nested formatting.
        </p>
      </header>

      {err && (
        <div className="rounded-xl border border-error/40 bg-error-container/20 p-4 text-sm text-error font-body">
          {err}
        </div>
      )}
      {ok && (
        <div className="rounded-xl border border-green-600/30 bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-900 dark:text-green-100 font-body">
          Saved. New campaigns will use these defaults.
        </div>
      )}

      <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
            Default subject
          </label>
          <input
            className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm font-bold text-slate-700 font-body"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
            Default message
          </label>
          <RichMessageEditor
            name="message_template_preview"
            value={messageHtml}
            onChange={(html) => {
              setMessageHtml(html);
              setOk(false);
            }}
          />
          <p className="text-[11px] text-slate-500 font-body">
            Stock plain-text template is available via &quot;Reset to stock&quot; below (converted to
            formatted paragraphs).
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-95 transition-opacity font-body disabled:opacity-50"
          >
            <MaterialIcon name="save" className="text-lg" />
            {pending ? "Saving…" : "Save defaults"}
          </button>
          <button
            type="button"
            onClick={handleResetStock}
            disabled={pending}
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-surface-container-high transition-colors font-body disabled:opacity-50"
          >
            Reset to stock
          </button>
          <Link
            href="/outreach/new"
            className="inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:underline font-body"
          >
            New campaign
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-6">
        <h2 className="text-sm font-bold text-primary mb-2 font-headline">Plain-text stock (reference)</h2>
        <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
          {STOCK_OUTREACH_SUBJECT}
          {"\n\n"}
          {STOCK_OUTREACH_MESSAGE}
        </pre>
      </section>
    </div>
  );
}
