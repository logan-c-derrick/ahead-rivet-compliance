"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";

type AlertPreferences = {
  regulatory_breaches: { email: boolean; push: boolean };
  data_integrity_syncs: { email: boolean; push: boolean };
  annual_report_reminders: { email: boolean; push: boolean };
};

type RegulatoryFilters = {
  rohs_eu: boolean;
  reach: boolean;
  weee_directive: boolean;
  prop65: boolean;
};

type IntegrationSettings = {
  token_status: "active" | "revoked";
  last_saved_at: string | null;
  last_revoked_at: string | null;
};

export type OrganizationSettings = {
  alert_preferences: AlertPreferences;
  regulatory_filters: RegulatoryFilters;
  integration_settings: IntegrationSettings;
};

const DEFAULT_SETTINGS: OrganizationSettings = {
  alert_preferences: {
    regulatory_breaches: { email: true, push: true },
    data_integrity_syncs: { email: false, push: true },
    annual_report_reminders: { email: true, push: false },
  },
  regulatory_filters: {
    rohs_eu: true,
    reach: true,
    weee_directive: false,
    prop65: false,
  },
  integration_settings: {
    token_status: "active",
    last_saved_at: null,
    last_revoked_at: null,
  },
};

async function loadSettingsForOrg(organizationId: string): Promise<OrganizationSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_settings")
    .select("alert_preferences, regulatory_filters, integration_settings")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return DEFAULT_SETTINGS;

  return {
    alert_preferences: data.alert_preferences ?? DEFAULT_SETTINGS.alert_preferences,
    regulatory_filters: data.regulatory_filters ?? DEFAULT_SETTINGS.regulatory_filters,
    integration_settings: data.integration_settings ?? DEFAULT_SETTINGS.integration_settings,
  };
}

async function upsertSettings(
  organizationId: string,
  settings: Partial<OrganizationSettings>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await loadSettingsForOrg(organizationId);
  const next: OrganizationSettings = {
    alert_preferences: settings.alert_preferences ?? current.alert_preferences,
    regulatory_filters: settings.regulatory_filters ?? current.regulatory_filters,
    integration_settings: settings.integration_settings ?? current.integration_settings,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("organization_settings").upsert(
    {
      organization_id: organizationId,
      alert_preferences: next.alert_preferences,
      regulatory_filters: next.regulatory_filters,
      integration_settings: next.integration_settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function redirectWithOutcome(action: string, result: { ok: true } | { ok: false; error: string }) {
  if (result.ok) {
    redirect(`/settings?saved=${encodeURIComponent(action)}`);
  }
  redirect(`/settings?error=${encodeURIComponent(result.error)}`);
}

function toBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function saveAlertPreferences(formData: FormData): Promise<void> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(getPermissionErrorMessage(error) ?? "Unable to save alert preferences.")}`);
  }
  const alertPreferences: AlertPreferences = {
    regulatory_breaches: {
      email: toBool(formData, "regulatory_breaches_email"),
      push: toBool(formData, "regulatory_breaches_push"),
    },
    data_integrity_syncs: {
      email: toBool(formData, "data_integrity_syncs_email"),
      push: toBool(formData, "data_integrity_syncs_push"),
    },
    annual_report_reminders: {
      email: toBool(formData, "annual_report_reminders_email"),
      push: toBool(formData, "annual_report_reminders_push"),
    },
  };

  const result = await upsertSettings(profile.organization_id, { alert_preferences: alertPreferences });
  revalidatePath("/settings");
  redirectWithOutcome("alerts", result);
}

export async function saveRegulatoryFilters(formData: FormData): Promise<void> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(getPermissionErrorMessage(error) ?? "Unable to save regulatory defaults.")}`);
  }
  const regulatoryFilters: RegulatoryFilters = {
    rohs_eu: toBool(formData, "rohs_eu"),
    reach: toBool(formData, "reach"),
    weee_directive: toBool(formData, "weee_directive"),
    prop65: toBool(formData, "prop65"),
  };

  const result = await upsertSettings(profile.organization_id, { regulatory_filters: regulatoryFilters });
  revalidatePath("/settings");
  redirectWithOutcome("regulatory", result);
}

export async function saveIntegrationMap(): Promise<void> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(getPermissionErrorMessage(error) ?? "Unable to save integration map.")}`);
  }
  const current = await loadSettingsForOrg(profile.organization_id);
  const result = await upsertSettings(profile.organization_id, {
    integration_settings: {
      ...current.integration_settings,
      token_status: "active",
      last_saved_at: new Date().toISOString(),
    },
  });
  revalidatePath("/settings");
  redirectWithOutcome("integration_save", result);
}

export async function revokeAllIntegrationKeys(): Promise<void> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(getPermissionErrorMessage(error) ?? "Unable to revoke integration keys.")}`);
  }
  const current = await loadSettingsForOrg(profile.organization_id);
  const result = await upsertSettings(profile.organization_id, {
    integration_settings: {
      ...current.integration_settings,
      token_status: "revoked",
      last_revoked_at: new Date().toISOString(),
    },
  });
  revalidatePath("/settings");
  redirectWithOutcome("integration_revoke", result);
}

export async function resetSettingsToDefaults(): Promise<void> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(getPermissionErrorMessage(error) ?? "Unable to reset settings.")}`);
  }
  const result = await upsertSettings(profile.organization_id, DEFAULT_SETTINGS);
  revalidatePath("/settings");
  redirectWithOutcome("reset", result);
}

export async function commitAllSettings(): Promise<void> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(getPermissionErrorMessage(error) ?? "Unable to commit settings.")}`);
  }
  const current = await loadSettingsForOrg(profile.organization_id);
  const result = await upsertSettings(profile.organization_id, {
    ...current,
    integration_settings: {
      ...current.integration_settings,
      last_saved_at: new Date().toISOString(),
    },
  });
  revalidatePath("/settings");
  redirectWithOutcome("commit", result);
}

export async function getSettingsForCurrentOrg(): Promise<OrganizationSettings> {
  const profile = await requireProfile();
  return loadSettingsForOrg(profile.organization_id);
}
