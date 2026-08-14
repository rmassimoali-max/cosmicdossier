import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-selftest")({
  server: {
    handlers: {
      GET: async () => {
        const secret = process.env["STRIPE_SECRET_KEY"] ?? "";
        const pub = process.env["STRIPE_PUBLISHABLE_KEY"] ?? "";
        if (!secret) return Response.json({ ok: false, reason: "no secret key" });
        const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            mode: "payment",
            ui_mode: "embedded_page",
            redirect_on_completion: "never",
            "line_items[0][quantity]": "1",
            "line_items[0][price_data][currency]": "usd",
            "line_items[0][price_data][unit_amount]": "900",
            "line_items[0][price_data][product_data][name]": "selftest",
          }).toString(),
        });
        const json = (await res.json()) as Record<string, unknown>;
        return Response.json({
          ok: res.ok,
          status: res.status,
          testMode: secret.startsWith("sk_test_"),
          pubPrefix: pub.slice(0, 7),
          hasClientSecret: Boolean(json["client_secret"]),
          error: (json["error"] as { message?: string } | undefined)?.message ?? null,
        });
      },
    },
  },
});
