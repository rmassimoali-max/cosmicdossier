import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentAccount, signOutAccount } from "@/lib/auth.functions";
import { useEffect, useId, useRef, useState } from "react";
import { CButton } from "@/components/cosmic/ui";
import { ARCHETYPES } from "@/lib/archetypes";
import { SYSTEMS } from "@/lib/systems";

type NavLink = {
  label: string;
  to: string;
  params?: { slug: string };
  prominent?: boolean;
};
type NavSection = NavLink | { label: string; links: NavLink[] };

// All menu content: add new sections here, for example a /tests hub later.
const SECTIONS: NavSection[] = [
  { label: "Start My Report", to: "/input", prominent: true },
  { label: "Home", to: "/" },
  { label: "Test Library", to: "/tests" },
  { label: "My Dashboard", to: "/dashboard" },
  { label: "My Account", to: "/account" },
  { label: "MBTI Types", to: "/mbti" },
  { label: "Zodiac Signs", to: "/zodiac" },
  { label: "Attachment Theory", to: "/attachment" },
  { label: "Personality Disorders", to: "/personality-disorders" },
  { label: "The Dossier Files", to: "/articles" },
  {
    label: "Archetypes",
    links: ARCHETYPES.map(({ name, slug }) => ({
      label: name,
      to: "/archetype/$slug",
      params: { slug },
    })),
  },
  {
    label: "The Systems",
    links: SYSTEMS.map(({ name, slug }) => ({
      label: name,
      to: "/systems/$slug",
      params: { slug },
    })),
  },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<"loading" | "ready" | "error">("loading");
  const getAccount = useServerFn(getCurrentAccount);
  const signOut = useServerFn(signOutAccount);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const location = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    let active = true;
    void getAccount()
      .then((account) => {
        if (!active) return;
        setAccountEmail(account.email);
        setAccountStatus("ready");
      })
      .catch(() => {
        if (active) setAccountStatus("error");
      });
    return () => {
      active = false;
    };
  }, [location, getAccount]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Menu"]')?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => {
    // Stripe owns its overlay and z-index. Hide our floating controls entirely
    // while its checkout iframe is mounted, without modifying payment code.
    const checkCheckout = () => {
      const active = Boolean(
        document.querySelector(
          'iframe[src*="checkout.stripe.com"], iframe[src*="embedded-checkout"]',
        ),
      );
      setCheckoutActive(active);
      if (active) setOpen(false);
    };
    checkCheckout();
    const observer = new MutationObserver(checkCheckout);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
    return () => observer.disconnect();
  }, []);

  const renderLink = (item: NavLink) => (
    <Link
      key={item.label}
      to={item.to}
      {...(item.params ? { params: item.params } : {})}
      onClick={() => setOpen(false)}
      className={
        item.prominent
          ? "mb-3 flex min-h-11 items-center justify-center rounded-full px-4 py-2 font-display text-lg text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
          : "flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      }
      style={item.prominent ? { background: "var(--gradient-gold)" } : undefined}
    >
      {item.label}
    </Link>
  );

  return (
    <div ref={rootRef} hidden={checkoutActive} data-html2canvas-ignore="true">
      <CButton
        variant="outline"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="fixed top-3 left-3 z-40 h-11 w-11 rounded-full border border-border bg-background/70 p-0 text-foreground backdrop-blur hover:border-primary/60 motion-reduce:transition-none"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </CButton>
      <div className="fixed top-3 right-3 z-40 max-w-[calc(100vw-5rem)] text-right">
        {accountStatus === "loading" ? (
          <span className="inline-flex min-h-11 items-center rounded-full border border-border bg-background/80 px-4 text-xs text-muted-foreground backdrop-blur">
            Checking account…
          </span>
        ) : accountStatus === "error" ? (
          <Link
            to="/account"
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-background/80 px-4 text-xs text-primary backdrop-blur"
          >
            Check account
          </Link>
        ) : !accountEmail ? (
          <Link
            to="/sign-in"
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-background/80 px-4 text-sm text-primary backdrop-blur"
          >
            Sign in
          </Link>
        ) : (
          <>
            <button
              type="button"
              aria-expanded={accountOpen}
              aria-controls="cosmic-account-menu"
              onClick={() => setAccountOpen((current) => !current)}
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-left text-xs text-foreground backdrop-blur hover:border-primary/60"
            >
              <span className="min-w-0">
                <span className="block text-[10px] text-primary">Your cosmic space</span>
                <span className="block truncate">{accountEmail}</span>
              </span>
              <span aria-hidden="true">⌄</span>
            </button>
            {accountOpen ? (
              <nav
                id="cosmic-account-menu"
                aria-label="Account"
                className="panel mt-2 ml-auto flex w-56 flex-col p-3 text-left"
              >
                <Link to="/dashboard" className="rounded px-3 py-2 text-sm hover:text-primary">
                  My Dashboard
                </Link>
                <Link
                  to="/saved-assessments"
                  className="rounded px-3 py-2 text-sm hover:text-primary"
                >
                  Saved Assessments
                </Link>
                <Link to="/account" className="rounded px-3 py-2 text-sm hover:text-primary">
                  Account Settings
                </Link>
                <button
                  type="button"
                  className="rounded px-3 py-2 text-left text-sm text-muted-foreground hover:text-primary"
                  onClick={() => {
                    void signOut()
                      .then(() => {
                        setAccountEmail(null);
                        setAccountOpen(false);
                      })
                      .catch(() => setAccountStatus("error"));
                  }}
                >
                  Sign out
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
      <nav
        id={panelId}
        aria-label="Site"
        hidden={!open}
        className="panel fixed top-16 left-3 z-40 max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-x-hidden overflow-y-auto overscroll-contain p-4"
      >
        {SECTIONS.map((section) => {
          if (!("links" in section)) return renderLink(section);
          const groupOpen = Boolean(expanded[section.label]);
          const groupId = `${panelId}-${section.label.replaceAll(" ", "-")}`;
          return (
            <div key={section.label}>
              <CButton
                variant="ghost"
                aria-expanded={groupOpen}
                aria-controls={groupId}
                onClick={() =>
                  setExpanded((current) => ({
                    ...current,
                    [section.label]: !current[section.label],
                  }))
                }
                className="min-h-11 w-full justify-between rounded-md px-3 py-2 font-sans text-sm text-foreground motion-reduce:transition-none"
              >
                {section.label}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d={groupOpen ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
                </svg>
              </CButton>
              <div id={groupId} hidden={!groupOpen} className="ml-3 border-l border-border pl-2">
                {section.links.map(renderLink)}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
