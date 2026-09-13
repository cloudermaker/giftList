# Global status & improvement plan — malistedecadeaux.fr (Sept 2026)

Effort tags: **S** < 1h · **M** half-day · **L** 1 day+. Quick wins marked ⚡.

## Snapshot — what's already good

- Ranks top-3 on "liste de cadeaux en ligne gratuite" queries; landing page is SSG with real crawlable content, clean heading structure, JSON-LD (Organization, WebApplication, FAQPage, HowTo), robots.txt + sitemap present.
- Recent perf work done: backoffice pagination, parallelized SSR queries, lodash removed (branch `feat/backoffice-pagination`).
- Differentiator vs competitors: no account/email needed — group + first name and you're in.

---

## A. Security & abuse — keeping the "open reads" deal

Open viewing stays (product decision). These are about **destruction, impersonation and abuse**, not privacy:

1. ⚡ **Delete `pages/api/migrate-schema.ts`** — runs raw SQL behind the password `migration2026` committed in the public repo. (S)
2. ⚡ **Delete `pages/api/snapshot.ts`** — unauthenticated dump of every group id+name = full site enumeration in one request. (S)
3. **Stop leaking `adminPassword`** — returned by `GET /api/group/{id}`, `/api/userGroup`, `/api/personalGift`, and embedded in the HTML (`__NEXT_DATA__`) of every group page (`pages/group/[...id].tsx:209`). The admin password is what grants write rights. Add `select`/strip in managers. (S/M)
4. **Sign the session cookie** — `currentUser` is client-written base64 JSON; `{"isAdmin":true}` forged in one line grants group deletion, user deletion, all writes. Server-issued HttpOnly signed cookie in `/api/authenticate`. (M)
5. **Auth on destructive routes** — `/api/userGroup` (role promotion, eviction: zero checks), `gift/[...id]` + `user/[...id]` (cookie *presence* only), `personalGift/[...id]` (owner check skippable). (M)
6. **Harden `sendEmail.ts`** — open relay: rate-limit by IP, validate/escape `senderEmail`/`subject`/`message` (HTML injection), server-side size cap, drop the `|| 'v'` password fallback. (S/M)
7. Hash `Group.adminPassword` (bcrypt/argon2), drop `@default("admin")`. (M — after #4)

## B. Backend & data layer

1. **Fix `middleware.ts`** — `/backoffice` is gated on the `currentUser` cookie, so a visitor without a group login can never reach the backoffice login form. Gate on `backoffice_session` instead. (S) ⚡
2. **Schema constraints** — `@@unique` on `Group.name` (currently app-checked only → race duplicates); `onDelete: Cascade` on `Gift.user` (deleted users currently orphan their gifts, and orphans are accumulating); `@@index([userId, order])` on Gift; make `order`, `isSuggestedGift`, `createdAt/updatedAt` non-null. (M)
3. **Fix `upsertGift` global `MAX(order)`** (`lib/db/giftManager.ts:136`) — computed over the whole table, both a bug and a full scan on every gift creation. Scope by `userId`. (S) ⚡
4. **Transactions** — `takeGift`/`releaseGift`, reorder `updateGifts` (currently N UPDATEs), `createGroup+createUser`, `createUser+addUserToGroup`. (M)
5. **Validation + unified errors** — add zod per route; one `{ error }` envelope; correct 400/401/403/405 (today: wrong password = HTTP 200, missing cookie = 500 via un-caught `atob`, `e as string` destroys error logs, `details: String(error)` leaks DB internals). (M/L)
6. **Dead code purge** — `migration/*.js` + `initDb` script (targets pre-Prisma tables, destructive-but-inert), ~10 unused lib exports, `useActiveGroup.ts`, `getGiftWithDetails`, `TGroupAndUser.groupIds`. (S) ⚡
7. **package.json fixes** — remove `node` dep (bloats every install!), `react-helmet`, `uuid`, `pg`, `lodash`, 2 unused fontawesome pkgs; move `@prisma/client`, `@dnd-kit/*`, `nprogress` to dependencies; declare `@dnd-kit/utilities`; drop dead `export` script. (S) ⚡
8. Drop dead `Group.description`/`Group.imageUrl` columns; drop `User.isAdmin` (duplicates `UserGroupMapping.role`, two sources of truth). (M)

## C. Performance (page load)

1. ⚡ **Lazy-load sweetalert2** — statically imported by `axiosWrapper.ts` → ~40 kB gz in the main bundle of every page incl. landing. Dynamic `import()` behind a `lib/ui/alert.ts` facade. (S/M)
2. ⚡ **Dynamic-import `GiftIdeasGenerator`** — 500 lines of static data eagerly loaded on `/` and `/home`, below the fold. (S)
3. **Dynamic-import dnd-kit subtree** on giftList; render a plain list for visitors (`canReorder=false`). (M)
4. **`useCurrentUser` → context provider** in `_app` — currently 3-4 cookie parses + re-renders per page, auth flicker in header/footer, and un-guarded `atob/JSON.parse` that blanks the page on a malformed cookie. (M)
5. **Drop FontAwesome** — imported site-wide (via Layout) for one power-off icon; inline SVG like the 6 existing icons. (S) ⚡
6. Stop the mutation → full refetch round-trips (`giftList` take/update: POST then GET the same gift the POST already returned; `SubGiftList`: 3 requests per click). (M)
7. Hoist `MOCKUPS` array to module scope in `index.tsx` (rebuilt every render + hydration flash). (S) ⚡
8. `NProgress.configure` runs on every render (`_app.tsx:52`) — move to module scope. (S) ⚡

## D. Screens / UX rationalization

1. **One modal system** — today: sweetalert2 (~70 calls), `Modal.tsx` atom (1 consumer), hand-rolled modal in giftList (no body-scroll lock), 4th overlay in OnboardingModal. Make `Modal.tsx` the shell; add `confirmDestructive()`, `promptText()`, `toast()` helpers → deletes ~150 duplicated lines (5 copy-pasted confirm blocks, 5 add/rename prompts). (L)
2. **Button system** — global `button{}` CSS forces red-gradient danger style on everything (Cancel/Close/pagination are all red); 4 ad-hoc variants; raw `<button>`s bypassing `CustomButton` in 5 files. Add `variant` prop, kill the global selector. Then collapse backoffice's 14 duplicated mobile/desktop buttons into one `<ActionButton icon label>`. (M/L)
3. ⚡ **Footer bug** — mobile block `md:hidden`, desktop block `hidden sm:flex` → **no footer at all between 640–768px**; also the whole footer is written twice. Merge into one responsive block. (S)
4. **Keyboard/a11y pass** — main nav, login tabs, member cards, gift rows are clickable `<div>`s (no keyboard, no screen reader); 7 emoji-only buttons in backoffice without labels; checkbox without label in giftList. (M)
5. **Consistency tokens** — brand red exists as 3 different hexes; `#667eea` purple headings not in palette; `AVATAR_COLORS` duplicated 3×; page-title pattern repeated in 6 pages → `<PageTitle>`; Inter font declared in CSS but never loaded (site renders in system font — either load it via `next/font` or remove). (M)
6. **Error/empty states** — `home.tsx` group fetch has no `.catch` (blank page on failure); contact form error wipes the user's message; empty group renders nothing on `/group/[id]`; revoked invite token = bare 404 with no guidance. (M)
7. **State fixes in giftList** — one `normalizeGift()` (same laundering copy-pasted 5×), medal rank + drag reorder computed on the *filtered* list (wrong when filter is on), drag-reorder failures silently ignored, `viewMode` localStorage read in useState initialiser → hydration mismatch, index-keyed lists in takenGiftList mis-associate rows after delete. (M)
8. Dead frontend code: `styles/theme.css` (169 lines, imported nowhere), `icons/gift.tsx`, `clickOutsideHook.tsx`, unused CSS blocks + tailwind tokens, `public/login*.jpg` (~975 kB). (S) ⚡

## E. SEO

Verified live: ranks #2–3 on several head queries; only 4 pages indexed (by design); an old `http://…/login` URL from the previous host still indexed ("site désactivé" page).

1. ⚡ **Remove the OG/Twitter block from `_app.tsx`** — Next dedupes `<meta name=…>` but NOT `<meta property=…>` → every page currently emits duplicate `og:` tags and social scrapers read the generic first one. All per-page OG work is dead today. Let `SEO.tsx` own it. (S)
2. ⚡ **Fix 404-ing OG images** — `og-image-{home,help,contact}.jpg` referenced but only `og-template-*.jpg` exist in `public/`. Rename or repoint. (S)
3. ⚡ **Add `_document.tsx` with `<html lang="fr">`** — missing site-wide. (S)
4. ⚡ **`noIndex` on `/join/[token]`** (+ `Disallow: /join` in robots.txt) — shared invite links are currently indexable; same for `/maintenance`. (S)
5. **Four occasion landing pages** — `/liste-de-noel`, `/liste-de-naissance`, `/liste-anniversaire`, `/liste-de-mariage` (SSG, 600–900 words, own FAQ schema, linked from the existing occasion cards, added to sitemap). This is how every ranking competitor (Milirose, Listy, Youpili, MaJolieListe) captures those queries — we don't appear at all on "liste de naissance". **Biggest organic upside.** (L)
6. **Generate the sitemap** (`next-sitemap`) — hand-maintained file with stale hardcoded lastmod. (S)
7. **Legal pages** — `/help` links to `/terms` and `/privacy` which **don't exist** (user-facing 404s); French consumer site needs `/mentions-legales` + `/confidentialite`; cookie banner claims "no tracking" while Vercel Analytics loads. Also E-E-A-T. (M)
8. Fix PWA manifest (icon paths 404, `.ico` declared as png, apple-touch-icon should be 180×180 PNG). (S)
9. Small fixes: `og:locale` → `fr_FR`, newlines inside meta description attributes, invalid `postalCode: 75000`, footer social links point to facebook.com/twitter.com homepages while JSON-LD `sameAs` claims real profiles. (S) ⚡
10. Redirect/kill the stale indexed `/login` URL from the old host (301 in `next.config.js` redirects()). (S)

## F. Business ideas (from competitor scan)

Competitors: Milirose, Listy, Youpili, MaJolieListe, Lupna, Family Gift, MagicListe, iKadoo.

1. **URL import** — paste a product link → auto-fetch title/image/price (MagicListe's whole pitch; Listy/Youpili/iKadoo have it). Your TODO already mentions showing link previews — this is the full version, and the single feature users will most notice. Needs a small server-side OG-scraper endpoint. (L)
2. **Occasion landing pages double as acquisition** (see E5).
3. **Secret Santa draw** — random assignment within an existing group ("tirage au sort") — natural fit for the group model, Elfster's core feature, strong seasonal query volume. (M/L)
4. **Birthdays & reminders** — birthday field + upcoming-birthdays on home page (already in your README todo); optional email reminder ("la liste de Léa a changé", "anniversaire dans 2 semaines"). You have SMTP already. (M)
5. **Cagnotte / group gift** — "réserver à plusieurs" for expensive gifts (Listy, KadoListe). Even without payments: mark a gift as "shared by N people" with names. (M)
6. **Profile page** — avatar/photo, birthday, sizes/preferences (your TODO). (M)
7. **Monetization without breaking "gratuit, zéro pub"** — affiliate rewriting of gift URLs (Amazon etc.) is what funds Listy/Milirose; discreet and doesn't change UX. Optional "soutenir le site" (Ko-fi/BuyMeACoffee) link. (M)
8. **PWA done properly** (icons + service worker) → "install the app" without app-store cost; competitors' native apps are their retention edge. (M)

### Ideas backlog (migrated from old TODO.md / README todo)

- Show a link preview on gifts that have a URL (subset of F1). Laptop: aligned; mobile: column.
- "?" help tooltips next to group/person name fields.
- Vercel Speed Insights (`@vercel/speed-insights`) for perf tracking.
- Smoother drag-and-drop (current one is slow; items all same size now).
- API proxy for caching / hiding calls (bearer).
- Buttons colour + background review (partly covered by D2/D5).

### Open items from the May 2026 code review (docs/archive/CODE_REVIEW_2026-05.md)

- m-3: confirm `/` → `/home` redirect covers the Logo `href="/home"` change (middleware does redirect `/` → `/home` when logged in — verify logged-out logo click).
- m-4: no guard prevents a user reserving the same UNLIMITED gift twice via double-submit — add a 409 on duplicate `(userId, giftId)` insert. → merged into B-batch.

## G. Documentation

1. **Rewrite README** — currently stock create-next-app + stale todo. Should document: required env vars (`POSTGRES_PRISMA_URL`, `MAILERSEND_SMTP_*`, `BACKOFFICE_*`, `MAINTENANCE_MODE`), scripts (incl. `postinstall`, PowerShell-only `maintenance:*`), DB workflow (`db push`, no migrations/rollback, prod Neon), deploy (Vercel, Node ≥ 22), **auth model** (two cookie mechanisms + the deliberate open-access design so contributors don't "fix" it), invite-token behaviour (lazy, never expires). (S/M)
2. **Add `.env.example`.** (S) ⚡
3. **Archive done/stale docs** — `docs/MODERNIZATION_PLAN.md` (migration completed) and `reports/CODE_REVIEW.md` (May, all but 2 items fixed) → move to `docs/archive/` or delete; the 2 open review items (m-3 logo href, m-4 unlimited double-take guard) → fold into this plan. (S) ⚡
4. **Merge TODO.md + README todo** into one place (this file or GitHub issues), delete the duplicates. (S) ⚡
5. Keep CHANGELOG.md as is (good shape).

---

## Suggested work batches (to split)

| Batch | Content | Effort |
|---|---|---|
| 1. Quick wins sweep ⚡ | A1, A2, B1, B3, B6, B7, C2, C5, C7, C8, D3, D8, E1–E4, E6, E8–E10, G2–G4 | ~1 day total |
| 2. Security core | A3, A4, A5, A6, A7 | 1–2 days |
| 3. Perf & bundle | C1, C3, C4, C6 | 1 day |
| 4. UI rationalization | D1, D2, D5 (modal system, buttons, tokens) | 2 days |
| 5. UX correctness | D4, D6, D7 | 1 day |
| 6. Data layer | B2, B4, B5, B8 | 1–2 days |
| 7. SEO growth | E5 occasion pages (+ E7 legal pages) | 1–2 days |
| 8. Product features | F1 URL import, F3 secret santa, F4 birthdays, F5 cagnotte — pick per season | per feature |
| 9. Docs | G1 README rewrite | ½ day |
