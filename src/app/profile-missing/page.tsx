import { getUser } from "@/lib/auth";
import SignOutButton from "@/app/dashboard/signout-button";
import Link from "next/link";

export default async function ProfileMissingPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-surface">
      <div className="max-w-2xl w-full space-y-6">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-headline text-primary">Profile Setup Required</h1>
            {user && <SignOutButton />}
          </div>
          
          <div className="space-y-3 text-sm text-on-surface font-body">
            <p>
              Your account exists in the system, but your profile has not been set up yet.
            </p>
            <p>
              To use Rivet, you need to be associated with an organization.
            </p>
          </div>

          <div className="rounded-lg bg-surface-container-low p-4 space-y-2 text-sm font-body">
            <p className="font-semibold text-primary">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Click <strong>Set Up Profile</strong> below</li>
              <li>Select an existing organization or create a new one</li>
              <li>Submit the form to finish onboarding</li>
            </ol>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <Link
              href="/profile-missing/setup"
              className="inline-block px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 text-sm font-semibold font-body"
            >
              Set Up Profile
            </Link>
            <Link
              href="/login"
              className="inline-block px-4 py-2 border border-outline-variant/40 rounded-lg hover:bg-surface-container-low text-sm font-body text-primary"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
