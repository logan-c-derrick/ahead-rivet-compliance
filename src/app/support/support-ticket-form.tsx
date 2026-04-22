"use client";

import { FormEvent, useState, useTransition } from "react";
import { createSupportTicket } from "./actions";

export function SupportTicketForm() {
  const [inquiryType, setInquiryType] = useState("Technical Issue");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      const result = await createSupportTicket({
        inquiryType,
        subject,
        description,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOk(true);
      setSubject("");
      setDescription("");
      setInquiryType("Technical Issue");
    });
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {error ? (
        <div className="rounded-lg border border-error/40 bg-error-container/20 p-3 text-xs text-error font-body">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-lg border border-tertiary-fixed-dim/40 bg-tertiary-fixed/20 p-3 text-xs text-tertiary-container font-body">
          Ticket submitted. You can track it in &quot;My Recent Tickets&quot; below.
        </div>
      ) : null}
      <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-body">
          Inquiry Type
        </label>
        <select
          className="w-full bg-surface-container-lowest border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-primary font-body"
          value={inquiryType}
          onChange={(e) => setInquiryType(e.target.value)}
          disabled={pending}
        >
          <option>Technical Issue</option>
          <option>Regulatory Consultation</option>
          <option>Audit Preparation</option>
          <option>Account & Billing</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-body">
          Subject
        </label>
        <input
          className="w-full bg-surface-container-lowest border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-primary font-body"
          placeholder="Brief summary of your request"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={pending}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-body">
          Description
        </label>
        <textarea
          className="w-full bg-surface-container-lowest border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-primary font-body"
          placeholder="How can we help you today?"
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all"
      >
        {pending ? "Submitting..." : "Open Support Ticket"}
      </button>
      <p className="text-[11px] text-on-surface-variant font-body">Tickets are saved securely in-app for tracking and follow-up.</p>
    </form>
  );
}
