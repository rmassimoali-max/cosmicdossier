import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { deleteSavedAssessment, listSavedAssessments } from "@/lib/saved-assessments.functions";
import { setSession } from "@/lib/session";
import { testBySlug } from "@/lib/tests";

export const Route = createFileRoute("/saved-assessments")({
  head: () => ({
    meta: [
      { title: "Saved Assessments | Cosmic Dossier" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: SavedAssessmentsPage,
});

type SavedAssessment = Awaited<ReturnType<typeof listSavedAssessments>>[number];

function SavedAssessmentsPage() {
  const navigate = useNavigate();
  const load = useServerFn(listSavedAssessments);
  const remove = useServerFn(deleteSavedAssessment);
  const [items, setItems] = useState<SavedAssessment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void load()
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [load]);

  const restore = (item: SavedAssessment) => {
    const test = testBySlug(item.assessment_slug);
    if (!test?.dossierPatch || item.result_version !== 1) {
      setError("This saved result is not compatible with the current dossier.");
      return;
    }
    // Re-derive from the scores, rather than trusting a stored arbitrary patch.
    const patch = test.dossierPatch(item.scores);
    setSession((session) => ({
      ...session,
      p1: {
        ...session.p1,
        ...patch,
        assessmentResults: {
          ...session.p1.assessmentResults,
          ...patch.assessmentResults,
        },
        assessmentSources: {
          ...session.p1.assessmentSources,
          [item.assessment_slug]: item.source_label ?? test.name,
        },
      },
      dossier: undefined,
    }));
    void navigate({ to: "/input" });
  };

  const deleteItem = async (item: SavedAssessment) => {
    if (!window.confirm(`Delete saved result "${item.display_label ?? item.assessment_slug}"? This cannot be undone.`)) {
      return;
    }
    setError("");
    setBusyId(item.id);
    try {
      const result = await remove({ data: { id: item.id } });
      if (!result.deleted) throw new Error("Result was not deleted.");
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch {
      setError("Couldn't delete this result. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-24">
      <Link to="/dashboard" className="text-sm text-primary hover:text-gold">
        ← My Dashboard
      </Link>
      <h1 className="mt-5 font-display text-4xl text-gold">Saved Assessments</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your account's saved results, available across devices. Restoring adds an assessment to
        Person 1 in your current local dossier; it doesn't overwrite your other assessments.
      </p>
      {error ? <p role="alert" className="mt-5 text-sm text-destructive">{error}</p> : null}
      {status === "loading" ? (
        <p role="status" className="mt-8 text-muted-foreground">Loading saved results…</p>
      ) : status === "error" ? (
        <div className="panel mt-8 p-6">
          <p role="alert">Couldn't load your saved assessments. Please sign in and try again.</p>
          <Link to="/sign-in" className="mt-4 inline-block text-primary">Sign in</Link>
        </div>
      ) : items.length === 0 ? (
        <div className="panel mt-8 p-6">
          <p>No saved assessments yet.</p>
          <Link to="/tests" className="mt-4 inline-block text-primary">
            Browse free assessments →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="panel p-6">
              <h2 className="font-display text-2xl text-foreground">
                {item.display_label ?? testBySlug(item.assessment_slug)?.name ?? item.assessment_slug}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Saved {new Date(item.created_at).toLocaleDateString()}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => restore(item)}
                  className="rounded-full border border-primary px-5 py-2 text-sm text-primary disabled:opacity-50"
                >
                  Restore to dossier
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void deleteItem(item)}
                  className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground disabled:opacity-50"
                >
                  {busyId === item.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
