/** Stock copy for new campaigns when org has not saved custom defaults. */
export const STOCK_OUTREACH_SUBJECT =
  "Action Required: Compliance Data Refresh ({{regulation_names}})";

export const STOCK_OUTREACH_MESSAGE = `Dear {{supplier_contact}},

This campaign covers the following regulations:

{{regulation_list}}

This specific request applies to: {{regulation_name}}.

Components in scope for this campaign:

{{component_list}}

This message and upload link apply to: {{component_name}} (when a component applies; otherwise see supplier scope above).

Please upload your technical data sheets and declarations by {{deadline_date}} using the secure portal link below:

{{portal_unique_link}}

Failure to comply may impact your preferred supplier status. Thank you for your continued partnership.

Best regards,
The Global Compliance Team`;

/**
 * Stock message as HTML for the rich editor: list merge fields sit outside &lt;p&gt;
 * so {{regulation_list}} / {{component_list}} can expand to real &lt;ul&gt; lists.
 */
export function stockMessageAsHtml(): string {
  return (
    `<p>Dear {{supplier_contact}},</p>` +
    `<p>This campaign covers the following regulations:</p>` +
    `{{regulation_list}}` +
    `<p>This specific request applies to: {{regulation_name}}.</p>` +
    `<p>Components in scope for this campaign:</p>` +
    `{{component_list}}` +
    `<p>This message and upload link apply to: {{component_name}} (when a component applies; otherwise see supplier scope above).</p>` +
    `<p>Please upload your technical data sheets and declarations by {{deadline_date}} using the secure portal link below:</p>` +
    `<p>{{portal_unique_link}}</p>` +
    `<p>Failure to comply may impact your preferred supplier status. Thank you for your continued partnership.</p>` +
    `<p>Best regards,<br/>The Global Compliance Team</p>`
  );
}
