import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getCurrentAccount } from "@/lib/auth.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard | Cosmic Dossier" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Your private Cosmic Dossier account dashboard." },
    ],
  }),
  component: DashboardPage,
});

const destinations = [
  {
    title: "My Assessments",
    description: "Explore the test library and continue discovering your personality.",
    to: "/tests",
    action: "Browse assessments",
  },
  {
    title: "My Dossiers",
    description: "Create or update a dossier. Cloud-saved reports are coming in a later release.",
    to: "/input",
    action: "Build a dossier",
  },
  {
    title: "Relationship Insights",
    description: "Compare two profiles using the existing synastry experience.",
    to: "/input",
    action: "Explore synastry",
  },
  {
    title: "Purchases & Unlocks",
    description: "Account-linked purchase history is coming soon. Existing receipts still work as before.",
    to: "/account",
    action: "Account settings",
  },
] as const;

function DashboardPage() {
  const getAccount = useServerFn(getCurrentAccount);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "signed-in" | "signed-out" | "error">(
    "loading",
  );

  useEffect(() => {
    let active = true;
    void getAccount()
      .then((account) => {
        if (!active) return;
        setEmail(account.email);
        setStatus(account.email ? "signed-in" : "signed-out");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [getAccount]);

  if (status !== "signed-in") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-24">
        <section className="panel p-8">
          <p className="tracking-cosmic text-xs text-primary">Your private universe</p>
          <h1 className="mt-3 font-display text-4xl text-gold">My Dashboard</h1>
          {status === "loading" ? (
            <p role="status" className="mt-5 text-muted-foreground">
              Checking your account…
            </p>
          ) : status === "error" ? (
            <div className="mt-5">
              <p role="alert" className="text-muted-foreground">
                We couldn't verify your session. Please try again.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-full border border-border px-5 py-3 text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-5 text-muted-foreground">
                Sign in to open your personal dashboard.
              </p>
              <Link to="/sign-in" className="mt-5 inline-block text-sm text-primary">
                Sign in to continue
              </Link>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-24">
      <header className="panel p-7 sm:p-10">
        <p className="tracking-cosmic text-xs text-primary">Cosmic Dossier / Private Account</p>
        <h1 className="mt-3 font-display text-4xl text-gold sm:text-5xl">My Dashboard</h1>
        <p className="mt-3 text-muted-foreground">Your universe, organized.</p>
        <p className="mt-6 text-sm text-foreground/90">
          Signed in as <span className="break-all text-primary">{email}</span>
        </p>
        <Link to="/account" className="mt-3 inline-block text-sm text-primary">
          Manage account
        </Link>
      </header>

      <section aria-labelledby="dashboard-explore" className="mt-8">
        <h2 id="dashboard-explore" className="font-display text-3xl text-gold">
          Continue your exploration
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current assessments and reports remain on this device for now. Cloud saving is
          coming in a future release.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {destinations.map((item) => (
            <article key={item.title} className="panel flex flex-col p-6">
              <h3 className="font-display text-2xl text-foreground">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <Link to={item.to} className="mt-5 inline-block text-sm text-primary">
                {item.action} →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
