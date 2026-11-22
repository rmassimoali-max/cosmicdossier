import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  acceptRecoverySession,
  changeRecoveredPassword,
  verifyRecoveryToken,
} from "@/lib/auth.functions";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | Cosmic Dossier" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: ResetPassword,
});
function ResetPassword() {
  const accept = useServerFn(acceptRecoverySession);
  const verify = useServerFn(verifyRecoveryToken);
  const change = useServerFn(changeRecoveredPassword);
  const [status, setStatus] = useState<"checking" | "ready" | "error" | "done">("checking");
  const recoveryAttempted = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [linkError, setLinkError] = useState(
    "This recovery link is invalid or expired. Please request a new one.",
  );
  useEffect(() => {
    // A recovery token is single-use. React may run effects twice in development.
    if (recoveryAttempted.current) return;
    recoveryAttempted.current = true;
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const tokenHash = query.get("token_hash") ?? fragment.get("token_hash");
    const type = query.get("type") ?? fragment.get("type");
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const providerError =
      fragment.get("error_code") ??
      query.get("error_code") ??
      fragment.get("error") ??
      query.get("error");
    const authorizationCode = query.get("code");
    const directToken = query.has("token") || fragment.has("token");
    window.history.replaceState(null, "", "/reset-password");
    if (providerError) {
      setLinkError(
        providerError === "otp_expired"
          ? "This recovery link has expired or was already used. Please request a new one."
          : "Supabase could not complete this recovery link. Please request a new one.",
      );
      setStatus("error");
    } else if (tokenHash && type === "recovery") {
      void verify({ data: { tokenHash } })
        .then(() => setStatus("ready"))
        .catch(() => {
          setLinkError("Recovery token verification failed. Please request a fresh link.");
          setStatus("error");
        });
    } else if (accessToken && refreshToken && type === "recovery") {
      void accept({ data: { accessToken, refreshToken } })
        .then((result) => {
          if (result.success) {
            setStatus("ready");
            return;
          }
          setLinkError(
            result.reason === "provider_validation_failed"
              ? "Supabase rejected the recovery session during validation. Please request a fresh link."
              : "Supabase returned an unexpected recovery user response. Please request a fresh link.",
          );
          setStatus("error");
        })
        .catch(() => {
          setLinkError(
            "The recovery validation request failed before completion. Please request a fresh link.",
          );
          setStatus("error");
        });
    } else {
      if (authorizationCode)
        setLinkError(
          "This recovery link uses an unsupported sign-in code. Please request a new link.",
        );
      else if (directToken)
        setLinkError(
          "The recovery link contained a token in an unsupported format. Please request a new one.",
        );
      else if (!tokenHash && !accessToken)
        setLinkError("No recovery credentials were found in this link. Please request a new one.");
      setStatus("error");
    }
  }, [accept, verify]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || password !== confirm) {
      setError("Passwords must match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await change({ data: { password } });
      setStatus("done");
      setPassword("");
      setConfirm("");
    } catch {
      setError("Password update failed. Request a new reset link and try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24">
      <div className="panel p-8">
        <h1 className="font-display text-4xl text-gold">Choose a new password</h1>
        {status === "checking" && (
          <p role="status" className="mt-4">
            Checking your recovery link…
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="mt-4">
            {linkError}
          </p>
        )}
        {status === "done" && (
          <p role="status" className="mt-4">
            Password updated. Sign in with your new password.
          </p>
        )}
        {status === "ready" && (
          <form onSubmit={(event) => void submit(event)} className="mt-6 flex flex-col gap-4">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
            >
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
        <Link
          to={status === "error" ? "/forgot-password" : "/sign-in"}
          className="mt-6 inline-block text-primary"
        >
          {status === "error" ? "Request another link" : "Back to sign in"}
        </Link>
      </div>
    </main>
  );
}
