import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { completeMagicLink } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Completing sign-in | Cosmic Dossier" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const complete = useServerFn(completeMagicLink);
  const [status, setStatus] = useState("Verifying your sign-in link…");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    window.history.replaceState(null, "", "/auth/callback");
    if (!tokenHash || (type !== "magiclink" && type !== "email" && type !== "signup")) {
      setStatus("This link is incomplete or expired. Please request a new one.");
      return;
    }
    void complete({ data: { tokenHash, type } })
      .then(() => {
        setSuccess(true);
        setStatus("You're signed in. Welcome back!");
      })
      .catch(() => setStatus("This sign-in link could not be verified. Please request a new one."));
  }, [complete]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24">
      <div className="panel p-8">
        <h1 className="font-display text-3xl text-gold">Cosmic Dossier sign-in</h1>
        <p role="status" className="mt-4 text-muted-foreground">
          {status}
        </p>
        <Link to={success ? "/account" : "/sign-in"} className="mt-6 inline-block text-primary">
          {success ? "Go to my account" : "Back to sign-in"}
        </Link>
      </div>
    </main>
  );
}
