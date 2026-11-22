import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getCurrentAccount, signOutAccount } from "@/lib/auth.functions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account | Cosmic Dossier" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const getAccount = useServerFn(getCurrentAccount);
  const signOut = useServerFn(signOutAccount);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getAccount()
      .then((account) => {
        if (active) setEmail(account.email);
      })
      .catch(() => {
        if (active) setEmail(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getAccount]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-24">
      <div className="panel p-8">
        <h1 className="font-display text-4xl text-gold">My account</h1>
        {loading ? (
          <p role="status" className="mt-4">
            Checking your account…
          </p>
        ) : email ? (
          <>
            <p className="mt-4 text-muted-foreground">Signed in as {email}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Saved dossiers and purchase recovery are coming next. Signing in does not unlock a
              paid report.
            </p>
            <Link to="/report" className="mt-5 inline-block text-sm text-primary">
              Return to my dossier and checkout
            </Link>
            <button
              type="button"
              className="mt-6 rounded-full border border-border px-5 py-3 text-sm"
              onClick={() => {
                void signOut().then(() => setEmail(null));
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">
            You're not signed in.{" "}
            <Link to="/sign-in" className="text-primary">
              Sign in by email
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
