import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STRIPE_API = "https://api.stripe.com/v1";

function form(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

async function stripeCall(path: string, secret: string, body?: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body ? { body: form(body) } : {}),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = json["error"] as { message?: string } | undefined;
    throw new Error(err?.message ?? `Stripe request failed (${res.status})`);
  }
  return json;
}

function secretKey() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    throw new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY (use your sk_test_… key for test mode).",
    );
  }
  return key;
}

/** Publishable key + test-mode flag for the browser. */
export const getStripeConfig = createServerFn({ method: "GET" }).handler(async () => {
  const publishableKey = process.env["STRIPE_PUBLISHABLE_KEY"] ?? "";
  const secret = process.env["STRIPE_SECRET_KEY"] ?? "";
  return {
    publishableKey,
    configured: Boolean(publishableKey && secret),
    testMode: secret.startsWith("sk_test_") || publishableKey.startsWith("pk_test_"),
  };
});

/** Creates an embedded Checkout session for the one-time full-dossier unlock. */
export const createUnlockCheckout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await stripeCall("/checkout/sessions", secretKey(), {
    mode: "payment",
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "400",
    "line_items[0][price_data][product_data][name]": "Cosmic Dossier — full report unlock",
    "line_items[0][price_data][product_data][description]":
      "Full cross-sectional synthesis, complete natal chart detail, synastry and PDF export.",
    "metadata[product]": "cosmic-dossier-unlock",
  });
  return {
    clientSecret: String(session["client_secret"] ?? ""),
    sessionId: String(session["id"] ?? ""),
  };
});

/** Server-side confirmation that a session was actually paid. */
export const verifyUnlockPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const session = await stripeCall(
      `/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
      secretKey(),
    );
    const status = String(session["payment_status"] ?? "");
    return { paid: status === "paid" || status === "no_payment_required", status };
  });
