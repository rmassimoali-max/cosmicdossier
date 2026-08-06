import { useEffect, useState } from "react";
import type { NatalChart } from "./astro";
import type { Estimate } from "./assessments";

export type PersonInput = {
  name: string;
  dob: string;
  birthTime: string;
  birthPlace: string;
  gender?: string | undefined;
  relationshipStatus?: string | undefined;
  mbti?: string | undefined;
  mbtiEstimates?: Estimate[] | undefined;
  enneagramType?: string | undefined;
  enneagramWing?: string | undefined;
  enneagramInstinct?: string | undefined;
  enneagramEstimates?: Estimate[] | undefined;
  attachment?: string | undefined;
  attachmentEstimates?: Estimate[] | undefined;
  bigFive?: Record<string, number> | undefined;
};

export type DossierSection = { title: string; body: string };
export type Dossier = {
  headline: string;
  synthesis: string;
  dominantTraits: string[];
  sections: DossierSection[];
};

export type SessionState = {
  p1: PersonInput;
  p2?: PersonInput | null | undefined;
  charts?: { p1?: NatalChart | undefined; p2?: NatalChart | undefined } | undefined;
  dossier?:
    | {
        p1?: Dossier | undefined;
        p2?: Dossier | undefined;
        synastry?: Dossier | undefined;
      }
    | undefined;
};

export const emptyPerson = (): PersonInput => ({
  name: "",
  dob: "",
  birthTime: "",
  birthPlace: "",
});

const KEY = "cosmic-dossier-v1";
const initial: SessionState = { p1: emptyPerson(), p2: null };

let state: SessionState = initial;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...(JSON.parse(raw) as SessionState) };
  } catch {
    /* ignore */
  }
}

export function getSession(): SessionState {
  hydrate();
  return state;
}

export function setSession(patch: Partial<SessionState> | ((s: SessionState) => SessionState)) {
  hydrate();
  state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

export function resetSession() {
  state = { p1: emptyPerson(), p2: null };
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useSession(): SessionState {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate();
    setReady(true);
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return ready ? state : initial;
}

export function personLabel(p: PersonInput) {
  return p.name.trim() || "Unnamed";
}

export function ageFrom(dob: string) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}
