<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Mount site-wide navigation once in the root provider; keep its links in server-rendered HTML and its browser listeners in effects so navigation stays crawlable and SSR-safe.
- Extend the shared test definitions with optional choice and scoring adapters; reuse legacy assessment banks and scorers so library and dossier estimates stay identical.
