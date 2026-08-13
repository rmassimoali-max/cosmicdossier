import { useEffect, useState } from "react";

const KEY = "cosmic-dossier:unlocked";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setUnlocked(value: boolean) {
  try {
    if (value) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("cosmic-unlock"));
}

/** Full-report access. Hydration-safe: always false on the server pass. */
export function useUnlocked(): boolean {
  const [unlocked, set] = useState(false);
  useEffect(() => {
    set(read());
    const onChange = () => set(read());
    window.addEventListener("cosmic-unlock", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("cosmic-unlock", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return unlocked;
}
