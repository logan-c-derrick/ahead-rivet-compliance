# ComplianceHub roadmap

## Near term (in progress / shipped)

- Token-based supplier upload remains the primary flow.
- Email notifications: documents received, review outcomes (verified / not verified per part and regulation), follow-up upload links.
- Internal action **Send follow-up upload link**: new response token with `allowed_component_ids` scoped to uncovered or not-yet-verified parts.

## Medium term

- Optional **supplier workspace** (e.g. magic-link login) so suppliers can see status and upload without juggling only email links.

## Longer term

- Avoid forcing a **full account** on first touch; add optional identity or account bootstrap when it clearly helps the workflow.
