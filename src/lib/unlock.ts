import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyUnlockPayment } from "./stripe.functions";

const RECEIPT_KEY = "cosmic-dossier:stripe-session";

/** A Stripe Checkout session ID is a bearer receipt, not an account credential. */
export function setUnlocked(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECEIPT_KEY, sessionId);
  } catch {
    /* Storage may be disabled. */
  }
  window.dispatchEvent(new Event("cosmic-unlock"));
}

/** Checks Stripe on each page load instead of trusting a browser-controlled boolean. */
export function useUnlocked(): boolean {
  const verify = useServerFn(verifyUnlockPayment);
  const [unlocked, setUnlockedState] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (import.meta.env.DEV) {
        if (active) setUnlockedState(true);
        return;
      }
      let sessionId: string | null = null;
      try {
        sessionId = window.localStorage.getItem(RECEIPT_KEY);
      } catch {
        /* Storage may be disabled. */
      }
      if (!sessionId) {
        if (active) setUnlockedState(false);
        return;
      }
      try {
        const result = await verify({ data: { sessionId } });
        if (active) setUnlockedState(result.paid);
      } catch {
        if (active) setUnlockedState(false);
      }
    };
    void check();
    const onChange = () => void check();
    window.addEventListener("cosmic-unlock", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      active = false;
      window.removeEventListener("cosmic-unlock", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [verify]);

  return unlocked;
}
