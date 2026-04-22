import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-sm rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-headline text-primary">Rivet</h1>
          <p className="text-sm text-on-surface-variant font-body">Sign in to continue</p>
        </div>
        <Suspense fallback={<p className="text-sm text-on-surface-variant">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
