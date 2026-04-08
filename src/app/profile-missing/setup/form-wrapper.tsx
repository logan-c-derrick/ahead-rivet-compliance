"use client";

import { useFormState } from "react-dom";
import { createProfile } from "./actions";

export default function ProfileSetupFormWrapper({ 
  organizations,
  defaultName 
}: { 
  organizations: Array<{ id: string; name: string }>;
  defaultName?: string;
}) {
  const [state, formAction] = useFormState(createProfile, { error: undefined });

  return (
    <>
      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            defaultValue={defaultName || ""}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label htmlFor="organization_id" className="block text-sm font-medium mb-1">
            Organization
          </label>
          <select
            id="organization_id"
            name="organization_id"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select an organization...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Or create a new organization below
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Create New Organization</h3>
          <div>
            <label htmlFor="new_organization_name" className="block text-sm font-medium mb-1">
              Organization Name
            </label>
            <input
              type="text"
              id="new_organization_name"
              name="new_organization_name"
              placeholder="Enter organization name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank to use selected organization above
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Create Profile
          </button>
        </div>
      </form>
    </>
  );
}
