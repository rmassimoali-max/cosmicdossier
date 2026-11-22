import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { requestMagicLink } from "@/lib/auth.functions";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [{ title: "Sign in | Cosmic Dossier" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SignInPage,
});

function SignInPage() {
  const sendLink = useServerFn(requestMagicLink);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await sendLink({ data: { email } });
      setSent(true);
    } catch {
      setError("Unable to send a sign-in link right now. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24">
      <div className="panel p-8">
        <h1 className="font-display text-4xl text-gold">Your Cosmic Dossier account</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Sign in with a secure email link. No password required. Assessments remain free without an
          account.
        </p>
        {sent ? (
          <p role="status" className="mt-6 text-foreground">
            Check your inbox for a sign-in link. It may take a few minutes. You can close this tab.
          </p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-6 flex flex-col gap-4">
            <label htmlFor="auth-email" className="text-sm">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-3 text-foreground"
              placeholder="you@example.com"
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
              {pending ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}
        <Link to="/tests" className="mt-6 inline-block text-sm text-primary">
          Explore free assessments instead
        </Link>
      </div>
    </main>
  );
}
