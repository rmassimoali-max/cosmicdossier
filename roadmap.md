# Roadmap — Cosmic Dossier test library expansion

- [x] Test data modules (src/lib/tests/): shared types + Big Five (Mini-IPIP 20), Attachment (ECR-R style 18, anxiety/avoidance axes), Dark Triad (Dirty Dozen 12), HSP (short form)
- [x] /tests hub page grouped by category
- [x] /tests/$slug route: intro → questionnaire → results phases, shareable result URLs, "Add to my Cosmic Dossier" CTA
- [x] 4 supporting articles (big-five, attachment, dark-triad, HSP) in src/lib/testArticles.ts
- [x] SiteNav: add Tests link
- [x] Session: optional hsp field on PersonInput
- [x] Build check + mobile viewport verification

Remaining from the uploaded spec (not yet started): Emotional Intelligence, Love Styles, Resilience, ADHD Trait Screen, AQ short form, HEXACO short (items 5–10).

## MBTI and Enneagram additions
- [ ] Reuse existing question banks and scoring within the test framework; support forced choices and safe shared results.
- [ ] Add both definitions, profile/article/archetype links, and matching Person 1 dossier saving.
- [ ] Add requested guide CTAs and six full-sentence test descriptions.
- [ ] Verify scoring, sharing, saving, existing tests, and phone/desktop layouts.
