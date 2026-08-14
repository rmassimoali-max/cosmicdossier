import { createFileRoute } from "@tanstack/react-router";
import { UnlockCard } from "@/components/cosmic/Paywall";

export const Route = createFileRoute("/paywall-test")({
  component: () => (
    <div className="p-6">
      <UnlockCard />
    </div>
  ),
});
