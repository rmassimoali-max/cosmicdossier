import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/auth/confirmed")({
  head: () => ({ meta: [{ title: "Email confirmed | Cosmic Dossier" }, { name: "robots", content: "noindex, nofollow, noarchive" }] }),
  component: Confirmed,
});
function Confirmed() {
  const [error, setError] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    setError(params.has("error"));
    window.history.replaceState(null, "", "/auth/confirmed");
  }, []);
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24"><div className="panel p-8">
    <h1 className="font-display text-4xl text-gold">Email confirmation</h1>
    <p role="status" className="mt-4 text-muted-foreground">{error ? "This confirmation link could not be completed. Try signing in or request another confirmation email." : "Your confirmation link has been processed. Sign in with your email and password to continue."}</p>
    <Link to="/sign-in" className="mt-6 inline-block text-primary">Go to sign in</Link>
  </div></main>;
}
