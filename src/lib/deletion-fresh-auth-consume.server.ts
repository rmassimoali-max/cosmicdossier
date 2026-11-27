import {
  meetsFreshAuthPolicy,
  type FreshAuthPolicyInput,
} from "./deletion-fresh-auth-policy.server";

// The adapter must atomically take an unexpired flow for the trusted browser binding.
// It must never return the same flow twice, including across server instances.
export type FreshAuthFlowStore = {
  take: (flowId: string, browserBinding: string) => Promise<FreshAuthPolicyInput["flow"] | null>;
};

// Internal boundary only: verified evidence must originate from provider verification.
// A failed policy check burns the flow. Storage errors propagate and never grant approval.
export async function consumeFreshAuthFlow(input: {
  store: FreshAuthFlowStore;
  flowId: string;
  verified: FreshAuthPolicyInput["verified"];
  now: () => number;
}): Promise<boolean> {
  if (!input.flowId || !input.verified.browserBinding) return false;
  const flow = await input.store.take(input.flowId, input.verified.browserBinding);
  if (!flow) return false;
  return meetsFreshAuthPolicy({ flow, verified: input.verified, now: input.now() });
}
