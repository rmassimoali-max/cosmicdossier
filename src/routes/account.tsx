import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getCurrentAccount,
  requestAccountEmailChange,
  requestPasswordReset,
  signOutAccount,
  updateAccountDisplayName,
} from "@/lib/auth.functions";

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
  const saveName = useServerFn(updateAccountDisplayName);
  const changeEmail = useServerFn(requestAccountEmailChange);
  const resetPassword = useServerFn(requestPasswordReset);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState("");

  useEffect(() => {
    let active = true;
    void getAccount()
      .then((account) => {
        if (active) {
          setEmail(account.email);
          setDisplayName(account.displayName ?? "");
        }
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
              Saved assessments belong to this account. Complete dossiers and purchase recovery
              across devices are not available yet.
            </p>
            <section className="mt-8 border-t border-border pt-6" aria-label="Profile settings">
              <h2 className="font-display text-2xl text-gold">Profile</h2>
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  setNotice("");
                  void saveName({ data: { displayName } })
                    .then(() => setNotice("Display name updated."))
                    .catch(() => setError("Could not save your display name."))
                    .finally(() => setBusy(false));
                }}
              >
                <label
                  htmlFor="account-display-name"
                  className="block text-sm text-muted-foreground"
                >
                  Display name
                </label>
                <input
                  id="account-display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={60}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm"
                  placeholder="How should we address you?"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full border border-primary px-5 py-2 text-sm text-primary disabled:opacity-50"
                >
                  Save display name
                </button>
              </form>
            </section>
            <section className="mt-8 border-t border-border pt-6" aria-label="Email and security">
              <h2 className="font-display text-2xl text-gold">Email &amp; security</h2>
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  setNotice("");
                  void changeEmail({ data: { email: newEmail } })
                    .then(() => {
                      setNotice(
                        "Email change requested. Check your inbox for confirmation instructions.",
                      );
                      setNewEmail("");
                    })
                    .catch((reason: unknown) =>
                      setError(
                        reason instanceof Error
                          ? reason.message
                          : "Could not request an email change.",
                      ),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                <label htmlFor="account-new-email" className="block text-sm text-muted-foreground">
                  New email address
                </label>
                <input
                  id="account-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  maxLength={254}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm"
                  placeholder="new@example.com"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full border border-primary px-5 py-2 text-sm text-primary disabled:opacity-50"
                >
                  Request email change
                </button>
              </form>
              <p className="mt-5 text-sm text-muted-foreground">
                Need a new password? Request a secure reset link at your current email.
              </p>
              <button
                type="button"
                disabled={busy}
                className="mt-3 rounded-full border border-border px-5 py-2 text-sm text-primary disabled:opacity-50"
                onClick={() => {
                  setBusy(true);
                  setError("");
                  setNotice("");
                  void resetPassword({ data: { email } })
                    .then(() =>
                      setNotice(
                        "If email delivery is available, a password reset link is on its way.",
                      ),
                    )
                    .catch(() => setError("Could not request a password reset right now."))
                    .finally(() => setBusy(false));
                }}
              >
                Send password reset link
              </button>
            </section>
            <section className="mt-8 border-t border-border pt-6" aria-label="Account deletion">
              <h2 className="font-display text-2xl text-gold">Delete account</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Deleting your account would permanently remove your sign-in identity and saved
                assessments. Reports stored only in this browser are separate, and payment
                transaction records may need to be retained for accounting or legal obligations.
              </p>
              <button
                type="button"
                className="mt-4 rounded-full border border-destructive px-5 py-2 text-sm text-destructive"
                aria-expanded={deletionOpen}
                aria-controls="account-deletion-confirmation"
                onClick={() => {
                  setDeletionOpen((open) => !open);
                  setDeletionConfirmation("");
                }}
              >
                {deletionOpen ? "Cancel deletion" : "Review account deletion"}
              </button>
              {deletionOpen ? (
                <div id="account-deletion-confirmation" className="mt-5 space-y-3 rounded-lg border border-destructive/50 p-4">
                  <h3 className="font-display text-xl text-destructive">Permanent deletion</h3>
                  <p className="text-sm text-muted-foreground">
                    This cannot be undone. Before deletion can be enabled, we must finish secure
                    identity verification, saved-data cleanup, and payment-record safeguards.
                  </p>
                  <label htmlFor="account-delete-confirm" className="block text-sm">
                    Type DELETE to acknowledge the consequences.
                  </label>
                  <input
                    id="account-delete-confirm"
                    value={deletionConfirmation}
                    onChange={(event) => setDeletionConfirmation(event.target.value)}
                    autoComplete="off"
                    className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm"
                  />
                  <button
                    type="button"
                    disabled
                    title="Deletion is not enabled until security and payment checks are complete"
                    className="rounded-full border border-destructive px-5 py-2 text-sm text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Permanently delete account (not yet enabled)
                  </button>
                  {deletionConfirmation === "DELETE" ? (
                    <p role="status" className="text-xs text-muted-foreground">
                      Confirmation acknowledged. Actual deletion remains disabled in this preview.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
            {notice ? (
              <p role="status" className="mt-5 text-sm text-primary">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="mt-5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Link to="/dashboard" className="mt-5 inline-block text-sm text-primary">
              Open my dashboard
            </Link>
            <Link to="/input" className="mt-3 block text-sm text-primary">
              Continue building my dossier
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
