import { useCallback, useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import {
  createUnlockCheckout,
  getStripeConfig,
  verifyUnlockPayment,
} from "@/lib/stripe.functions";
import { setUnlocked } from "@/lib/unlock";
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

  const [cfg, setCfg] = useState<{
    publishableKey: string;
    configured: boolean;
    testMode: boolean;
  } | null>(null);
  const [open, setOpen] = useState(false);
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

  const onComplete = useCallback(async () => {
    const id = sessionId.current;
    if (!id) return;
    try {
      const res = await verify({ data: { sessionId: id } });
      if (res.paid) {
        setUnlocked(true);
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
      <CButton onClick={start} disabled={busy || (cfg !== null && !cfg.configured)}>
        {busy ? "Opening checkout…" : "Unlock full dossier — $4"}
      </CButton>
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
