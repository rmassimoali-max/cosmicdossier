import { useCallback, useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { createUnlockCheckout, getStripeConfig, verifyUnlockPayment } from "@/lib/stripe.functions";
import { setUnlocked } from "@/lib/unlock";
import { getCurrentAccount } from "@/lib/auth.functions";
import { CButton } from "@/components/cosmic/ui";

const stripeCache = new Map<string, Promise<Stripe | null>>();
function getStripe(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
}

/** Renders the Unlock button and, on click, an embedded Stripe Checkout overlay. */
export function StripeUnlockButton() {
  const config = useServerFn(getStripeConfig);
  const createSession = useServerFn(createUnlockCheckout);
  const verify = useServerFn(verifyUnlockPayment);
  const getAccount = useServerFn(getCurrentAccount);

  const [cfg, setCfg] = useState<{
    publishableKey: string;
    configured: boolean;
    testMode: boolean;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [showAccountChoice, setShowAccountChoice] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | null>(null);

  useEffect(() => {
    config()
      .then(setCfg)
      .catch(() => setCfg({ publishableKey: "", configured: false, testMode: false }));
  }, [config]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await createSession();
      sessionId.current = res.sessionId;
      setClientSecret(res.clientSecret);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }, [createSession]);

  const showCheckoutChoice = async () => {
    setCheckingAccount(true);
    setError(null);
    try {
      const account = await getAccount();
      setAccountEmail(account.email);
    } catch {
      // Do not assume the visitor is signed out when the account service fails.
      setError("Could not check your account. Please try again before checkout.");
      setCheckingAccount(false);
      return;
    }
    setShowAccountChoice(true);
    setCheckingAccount(false);
  };

  const onComplete = useCallback(async () => {
    const id = sessionId.current;
    if (!id) return;
    try {
      const res = await verify({ data: { sessionId: id } });
      if (res.paid) {
        setUnlocked(id);
        setOpen(false);
      } else {
        setError(`Payment not completed (status: ${res.status}).`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not confirm the payment.");
    }
  }, [verify]);

  return (
    <>
      <CButton
        onClick={() => void showCheckoutChoice()}
        disabled={busy || checkingAccount || (cfg !== null && !cfg.configured)}
      >
        {busy
          ? "Opening checkout…"
          : checkingAccount
            ? "Checking account…"
            : "Unlock full dossier — $4"}
      </CButton>
      {showAccountChoice && !open && (
        <div className="mt-4 rounded-xl border border-border bg-background p-5">
          <h3 className="text-lg font-semibold text-foreground">Keep your Cosmic Dossier?</h3>
          {accountEmail ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{accountEmail}</span>. You can continue
              to checkout. Your saved assessments remain in your account, but complete dossiers
              and purchase recovery are not available across devices yet.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Create a free account or sign in before checkout, or continue as a guest. Complete
              dossiers and purchase recovery are not available across devices yet.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {!accountEmail ? (
              <a
                href="/sign-in"
                className="rounded-full border border-border px-4 py-2 text-sm text-primary"
              >
                Create account / Sign in
              </a>
            ) : null}
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setShowAccountChoice(false);
                void start();
              }}
            >
              Continue to $4 checkout
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground"
              onClick={() => setShowAccountChoice(false)}
            >
              Not now
            </button>
          </div>
        </div>
      )}
      {cfg && !cfg.configured && (
        <p className="mt-2 text-[0.7rem] text-muted-foreground">
          Payments aren&apos;t configured yet (missing Stripe keys).
        </p>
      )}
      {cfg?.configured && cfg.testMode && (
        <p className="mt-2 text-[0.7rem] text-muted-foreground">
          Test mode — use card 4242 4242 4242 4242, any future date and CVC.
        </p>
      )}
      {error && <p className="mt-2 text-[0.7rem] text-destructive">{error}</p>}

      {open && clientSecret && cfg?.publishableKey && (
        <EmbeddedCheckoutProvider
          stripe={getStripe(cfg.publishableKey)}
          options={{ clientSecret, onComplete }}
        >
          {/* Stripe renders its own centered modal over the page. */}
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </>
  );
}
