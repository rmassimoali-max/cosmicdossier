import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { registerAccount, signInWithPassword } from "@/lib/auth.functions";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [{ title: "Sign in | Cosmic Dossier" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SignInPage,
});

function SignInPage() {
  const register = useServerFn(registerAccount);
  const signIn = useServerFn(signInWithPassword);
  const [mode, setMode] = useState<"sign-in" | "register">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        const result = await register({ data: { email, password } });
        if (result.signedIn) {
          window.location.assign("/account");
          return;
        }
        setMessage(
          "Account requested. Check your email to confirm your address, then sign in here.",
        );
        setMode("sign-in");
      } else {
        await signIn({ data: { email, password } });
        window.location.assign("/account");
      }
    } catch {
      setError(
        mode === "register"
          ? "Could not create an account. Check your details or try signing in."
          : "Sign-in failed. Check your email and password, and confirm your email if needed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24">
      <div className="panel p-8">
        <h1 className="font-display text-4xl text-gold">
          {mode === "register" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {mode === "register"
            ? "Use an email and password to create a free account. Your assessments remain free."
            : "Sign in to your Cosmic Dossier account with your email and password."}
        </p>
        {message && (
          <p role="status" className="mt-4 text-sm text-foreground">
            {message}
          </p>
        )}
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
          />
          <label htmlFor="auth-password" className="text-sm">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
            {pending ? "Please wait…" : mode === "register" ? "Create free account" : "Sign in"}
          </button>
        </form>
        {mode === "sign-in" && (
          <Link to="/forgot-password" className="mt-4 block text-sm text-primary">
            Forgot password?
          </Link>
        )}
        <button
          type="button"
          className="mt-5 text-sm text-primary"
          onClick={() => {
            setMode(mode === "register" ? "sign-in" : "register");
            setError("");
            setMessage("");
          }}
        >
          {mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        <p className="mt-5 text-xs text-muted-foreground">
          Accounts do not yet save dossiers or restore purchases. Those features are coming next.
        </p>
        <Link to="/tests" className="mt-4 block text-sm text-primary">
          Explore free assessments instead
        </Link>
      </div>
    </main>
  );
}
