# Global status & improvement plan — malistedecadeaux.fr (Sept 2026)

Effort tags: **S** < 1h · **M** half-day · **L** 1 day+. ✅ = done (v5.1.0 2026-09-13, v5.2.0 2026-09-14 — both merged & deployed).

## Snapshot — what's already good

- Ranks top-3 on "liste de cadeaux en ligne gratuite" queries; landing page is SSG with real crawlable content, clean heading structure, JSON-LD (Organization, WebApplication, FAQPage, HowTo), robots.txt + sitemap present.
- Differentiator vs competitors: no account/email needed — group + first name and you're in.

## ✅ Done in v5.1.0 (Batch 1 — quick wins)

- **Security**: deleted `migrate-schema.ts` (raw SQL, committed password) and `snapshot.ts` (site enumeration).
- **Perf**: backoffice pagination (10/page, newest first); SSR queries parallelized on group/giftList/takenGiftList; invite-token write skipped when set; gift-ideas widget lazy-loaded on `/` + `/home`; landing mockups hoisted (no hydration flash); NProgress config out of render; `upsertGift` `MAX(order)` scoped per user; FontAwesome dropped (inline SVG); lodash dropped.
- **Deps**: 73 packages removed (`node`, `pg`, `uuid`, `react-select`, `react-helmet`, FontAwesome…); runtime deps moved out of devDependencies; `@dnd-kit/utilities` declared.
- **Dead code**: legacy migration scripts, 10 unused lib exports, `theme.css`, unused components/hooks/CSS/tailwind tokens, ~975 kB unused images, `groupIds` leftover.
- **SEO**: duplicate `og:` tags removed from `_app` (per-page previews work now); og-images fixed; `<html lang="fr">`; noindex + Disallow on `/join`; generated sitemap (`next-sitemap`); real PWA icons + fixed manifest; 301 on stale `/login`; `og:locale fr_FR`; footer social links fixed; postalCode fixed.
- **Fixes**: footer visible at all widths (markup deduped); `/backoffice` login reachable without group cookie.
- **Docs**: `.env.example`; README todo → roadmap link; migration-era docs archived; TODO.md folded in here; changelog 5.1.0.

## ✅ Done in v5.2.0 (P1–P4 + tests)

- **P1 Security**: signed session cookie (HMAC, `SESSION_SECRET` set in Vercel), verified auth on all destructive routes, `adminPassword` no longer leaked anywhere, contact form hardened (rate limit, escaping, validation). Password hashing skipped by choice (stays clear in DB).
- **P2 Legal**: `/mentions-legales` + `/confidentialite`, dead `/terms`+`/privacy` links fixed, honest cookie banner.
- **P3 Perf**: sweetalert2 lazy (landing ~300→114 kB), `useCurrentUser` context (one cookie parse), no refetch on simple take/release. Deferred: dnd-kit code-split (needs P6 giftList refactor).
- **P4 SEO growth**: 4 occasion landing pages (Noël, naissance, anniversaire, mariage), linked + in sitemap.
- **Tests**: 26 Playwright e2e tests (smoke, auth, gifts, MULTIPLE/UNLIMITED, secrecy invariant, invite, backoffice, security regressions, tablet viewport) + GitHub Actions CI on every PR. Found & fixed 2 real bugs (backoffice blank page after login, subGiftsCount reset on refetch). Test DB = Neon with `pgbouncer=true` (required — without it, CI flaked with lost reads).
- **Monitoring**: Vercel Speed Insights installed; Google Search Console verified (DNS TXT @ OVH), sitemap submitted, occasion pages indexing requested.

---

## Remaining work — priority order

### ✅ P1 — Security core (done in v5.2.0 — password hashing skipped by choice: stays clear in DB)

1. **Stop leaking `adminPassword`** — returned by `GET /api/group/{id}`, `/api/userGroup`, `/api/personalGift`, and embedded in `__NEXT_DATA__` of every group page (`pages/group/[...id].tsx`). It's the credential granting write rights. (S/M)
2. **Sign the session cookie** — `currentUser` is client-written base64 JSON; forged `{"isAdmin":true}` grants group/user deletion and all writes. Server-issued HttpOnly signed cookie in `/api/authenticate`. (M)
3. **Auth on destructive routes** — `/api/userGroup` (role promotion/eviction: zero checks), `gift/[...id]` + `user/[...id]` (cookie presence only), `personalGift/[...id]` (skippable owner check), `take.ts` double-take guard for UNLIMITED (409 on duplicate). (M)
4. **Harden `sendEmail.ts`** — rate-limit by IP, validate/escape inputs (HTML injection), server-side size cap, drop `|| 'v'` fallback. (S/M)
5. Hash `Group.adminPassword` (bcrypt), drop `@default("admin")`. (M — after #2)

### ✅ P2 — Legal pages (done in v5.2.0)

6. **`/mentions-legales` + `/confidentialite`** — `/help` still links to `/terms` and `/privacy` which 404; French consumer site needs them (GDPR/E-E-A-T); cookie banner claims "no tracking" while Vercel Analytics loads — reword or make it accurate. (M)

### P3 — Perf (done in v5.2.0 except #9: dnd-kit code-split deferred — needs a giftList refactor, see P6)

7. **Lazy-load sweetalert2** behind a `lib/ui/alert.ts` facade — ~40 kB gz in every page's bundle via `axiosWrapper.ts`. (S/M)
8. **`useCurrentUser` → context provider** in `_app` — kills 3-4 cookie parses/renders per page, auth flicker, and the un-guarded `atob/JSON.parse` that blanks the page on a bad cookie. (M)
9. Dynamic-import dnd-kit subtree on giftList; plain list for visitors. (M)
10. Stop mutation → full-refetch round-trips (giftList take/update; SubGiftList 3 requests per click). (M)

### ✅ P4 — Occasion landing pages (done in v5.2.0)

11. **Four occasion landing pages** — `/liste-de-noel`, `/liste-de-naissance`, `/liste-anniversaire`, `/liste-de-mariage` (SSG, 600–900 words, FAQ schema, linked from the occasion cards, in sitemap). Competitors win those queries with exactly this; we're absent on "liste de naissance". Best done **before the Christmas season**. (L)

### Housekeeping (quick, anytime)

- Remove the CI diagnostic `console.log`s in `e2e/gifts.spec.ts` after a quiet week of green runs.
- Rotate the Neon test-DB and Vercel prod-DB passwords (both were pasted in chats/tools), update secrets after.
- Watch Search Console: sitemap status → "Success, 10 URLs"; occasion pages indexed; stale `/login` dropping out.

### P5 — Data layer robustness — 1–2 days ← NEXT

12. Schema constraints: `@@unique` on `Group.name`; `onDelete: Cascade` on `Gift.user` (orphans accumulate today); `@@index([userId, order])`; non-null `order`/`isSuggestedGift`/timestamps. (M)
13. Validation layer (zod) + unified `{ error }` envelope + correct status codes (today: wrong password = HTTP 200, missing cookie = 500, `details` leaks DB internals). (M/L)
14. `$transaction` on multi-write ops (takeGift/releaseGift, reorder, createGroup+createUser, createUser+addUserToGroup). (M)
15. Drop dead `Group.description`/`imageUrl` columns and `User.isAdmin` (duplicates `UserGroupMapping.role`). (M)

### P6 — UI rationalization — 2–3 days

16. One modal system (`Modal.tsx` shell + `confirmDestructive()`/`promptText()`/`toast()` helpers) — removes ~150 duplicated lines across 5 pages. (L)
17. Button system: `variant` prop on `CustomButton`, kill the global red `button{}` CSS, collapse backoffice's 14 duplicated buttons into `<ActionButton icon label>`. (M/L)
18. Consistency tokens: one brand red (3 hexes today), palette-ize `#667eea` headings, shared `AVATAR_COLORS`, `<PageTitle>` component; load Inter via `next/font` or drop it from the CSS. (M)

### P7 — UX correctness & a11y — 1–2 days

19. Error/empty states: `home.tsx` fetch without `.catch` (blank page), contact form error wipes the message, empty group renders nothing, revoked invite token = bare 404. (M)
20. Keyboard/a11y: nav, login tabs, member cards, gift rows are clickable `<div>`s; 7 unlabelled emoji buttons in backoffice; unlabelled checkbox. (M)
21. giftList state fixes: `normalizeGift()` helper (5 copies), medal rank/reorder computed on filtered list, silent drag-save failures, `viewMode` hydration mismatch, index-keyed lists in takenGiftList. (M)
22. Review leftover m-3: verify logged-out logo click (`href=/home`) redirects sanely. (S)

### P8 — Docs — ½ day

23. README rewrite: env vars, scripts, DB workflow (`db push`, no rollback), deploy, the two-cookie auth model + deliberate open-access design, invite-token behaviour. (S/M)

### P9 — Product features (pick per season/motivation)

24. **URL import** — paste a product link → auto title/image/price (server-side OG scraper). Biggest product differentiator. (L)
25. **Secret Santa draw** within a group — strong seasonal fit, do before December. (M/L)
26. **Birthdays & reminders** — birthday field, upcoming birthdays on home, optional email reminders. (M)
27. Cagnotte / shared gift ("réservé à plusieurs"). (M)
28. Profile page (avatar, birthday, sizes). (M)
29. Monetization: affiliate link rewriting (keeps "gratuit, zéro pub"), optional donation link. (M)
30. PWA service worker → installable app. (M)
31. **Public ideas board** — `/idees` : anyone (logged or not) can submit an idea and vote for others. Table sorted by likes desc; filter by like count; "done" ideas carry a done date and are hidden by default; linked from home page and login page. Guards: 1 vote/idea/browser (localStorage) + IP rate limit, length caps, backoffice moderation (delete, mark done). New `Idea` table (title, description, likes, createdAt, doneAt?) — pair with P5's `db push`. Page noindex. (L ~1 day incl. e2e)

### Ideas backlog (migrated from old TODO.md / README todo)

- Show a link preview on gifts that have a URL (subset of #24). Laptop: aligned; mobile: column.
- "?" help tooltips next to group/person name fields.
- Vercel Speed Insights (`@vercel/speed-insights`) for perf tracking.
- Smoother drag-and-drop (current one is slow; items all same size now).
- API proxy for caching / hiding calls (bearer).
- Buttons colour + background review (partly covered by #17/#18).
