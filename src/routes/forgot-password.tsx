import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/auth.functions";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password | Cosmic Dossier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const request = useServerFn(requestPasswordReset);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      await request({ data: { email } });
    } catch {
      /* Keep response neutral. */
    }
    setSent(true);
    setPending(false);
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24">
      <div className="panel p-8">
        <h1 className="font-display text-4xl text-gold">Reset your password</h1>
        {sent ? (
          <p role="status" className="mt-4 text-muted-foreground">
            If an account exists for that address, we'll send a password reset link. Check your
            inbox and spam folder.
          </p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-6 flex flex-col gap-4">
            <label htmlFor="recovery-email">Email address</label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
            <button
              disabled={pending}
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <Link to="/sign-in" className="mt-6 inline-block text-sm text-primary">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
