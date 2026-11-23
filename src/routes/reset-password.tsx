import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
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
type RecoveryResult = { status: "ready" | "error"; message?: string };
const RECOVERY_RESULT_KEY = "cd_recovery_last_result";

function rememberRecoveryResult(result: RecoveryResult): RecoveryResult {
  // Store only a safe outcome, never a token, password, or URL.
  if (result.status === "error") {
    window.sessionStorage.setItem(RECOVERY_RESULT_KEY, JSON.stringify(result));
  } else {
    window.sessionStorage.removeItem(RECOVERY_RESULT_KEY);
  }
  return result;
}

function classifyRecoveryRequestError(error: unknown): string {
  if (error instanceof TypeError) {
    return "The recovery server request could not connect. Please try again later.";
  }
  if (error instanceof Error && error.name === "ZodError") {
    return "The recovery server rejected the request format. Please request a fresh link.";
  }
  // Only display a fixed diagnostic category. Never surface exception messages:
  // transport errors can include sensitive request details.
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "The recovery request was interrupted. Please request a fresh link.";
    }
    return "The recovery server returned an application error. Please request a fresh link.";
  }
  return "The recovery server returned an unexpected error. Please request a fresh link.";
}

// The in-flight attempt belongs to this browser window, not a server module.
// A remount can reuse it without persisting credentials in browser storage.
type RecoveryWindow = Window & { __cdRecoveryAttempt?: Promise<RecoveryResult> };

async function initializeRecovery(
  accept: (options: { data: { accessToken: string; refreshToken: string } }) => Promise<{
    success: boolean;
    reason?: "provider_validation_failed" | "invalid_user_response" | "session_cookie_failed";
  }>,
  verify: (options: { data: { tokenHash: string } }) => Promise<unknown>,
): Promise<RecoveryResult> {
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
  // Credentials are captured by this single shared attempt before removing them from the URL.
  window.history.replaceState(window.history.state, "", "/reset-password");
  const finish = rememberRecoveryResult;
  if (providerError) {
    return finish({
      status: "error",
      message:
        providerError === "otp_expired"
          ? "This recovery link has expired or was already used. Please request a new one."
          : "Supabase could not complete this recovery link. Please request a new one.",
    });
  }
  if (tokenHash && type === "recovery") {
    try {
      await verify({ data: { tokenHash } });
      return finish({ status: "ready" });
    } catch {
      return finish({
        status: "error",
        message: "Recovery token verification failed. Please request a fresh link.",
      });
    }
  }
  if (accessToken && refreshToken && type === "recovery") {
    try {
      const result = await accept({ data: { accessToken, refreshToken } });
      if (result.success) return finish({ status: "ready" });
      return finish({
        status: "error",
        message:
          result.reason === "provider_validation_failed"
            ? "Supabase rejected the recovery session during validation. Please request a fresh link."
            : result.reason === "session_cookie_failed"
              ? "The server could not establish recovery cookies. Please request a fresh link."
              : "Supabase returned an unexpected recovery user response. Please request a fresh link.",
      });
    } catch (error) {
      return finish({
        status: "error",
        message: classifyRecoveryRequestError(error),
      });
    }
  }
  return finish({
    status: "error",
    message: authorizationCode
      ? "This recovery link uses an unsupported sign-in code. Please request a new link."
      : directToken
        ? "The recovery link contained a token in an unsupported format. Please request a new one."
        : "No recovery credentials were found in this link. Please request a new one.",
  });
}

function ResetPassword() {
  const accept = useServerFn(acceptRecoverySession);
  const verify = useServerFn(verifyRecoveryToken);
  const change = useServerFn(changeRecoveredPassword);
  const [status, setStatus] = useState<"checking" | "ready" | "error" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [linkError, setLinkError] = useState(
    "This recovery link is invalid or expired. Please request a new one.",
  );
  useEffect(() => {
    // Reuse an in-flight or settled attempt if React remounts this route.
    // A fresh redirect with credentials starts a new attempt.
    const recoveryWindow = window as RecoveryWindow;
    const hasNewRedirect = Boolean(window.location.search || window.location.hash);
    if (hasNewRedirect) {
      window.sessionStorage.removeItem(RECOVERY_RESULT_KEY);
      recoveryWindow.__cdRecoveryAttempt = initializeRecovery(accept, verify);
    } else if (!recoveryWindow.__cdRecoveryAttempt) {
      const prior = window.sessionStorage.getItem(RECOVERY_RESULT_KEY);
      let previousResult: RecoveryResult | undefined;
      if (prior) {
        try {
          const parsed: unknown = JSON.parse(prior);
          if (
            parsed &&
            typeof parsed === "object" &&
            "status" in parsed &&
            parsed.status === "error" &&
            "message" in parsed &&
            typeof parsed.message === "string"
          ) {
            previousResult = { status: "error", message: parsed.message };
          }
        } catch {
          window.sessionStorage.removeItem(RECOVERY_RESULT_KEY);
        }
      }
      recoveryWindow.__cdRecoveryAttempt = previousResult
        ? Promise.resolve(previousResult)
        : initializeRecovery(accept, verify);
    }
    let active = true;
    void recoveryWindow.__cdRecoveryAttempt?.then((result) => {
      if (!active) return;
      if (result.message) setLinkError(result.message);
      setStatus(result.status);
    });
    return () => {
      active = false;
    };
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
