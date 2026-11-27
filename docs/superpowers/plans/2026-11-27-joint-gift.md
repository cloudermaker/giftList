# Joint gift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a list owner share one gift with a partner from the same group: it shows in a "Cadeaux communs" section on both pages, either partner can edit or delete it, and one reservation covers both.

**Architecture:** One `Gift` row gains an optional `coOwnerId`. The main list is unchanged (gifts with no co-owner); a second query feeds a separate joint section sorted by creation date. Every check that today compares `gift.userId` with the session user goes through a single `isGiftOwner` helper.

**Tech Stack:** Next.js 15 (pages router), Prisma 5 + PostgreSQL, zod, Playwright e2e (the only test suite).

**Spec:** `docs/superpowers/specs/2026-11-27-joint-gift-design.md`

## Global Constraints

- Work on branch `feat/joint-gift` cut from `main` (already created).
- Exactly one partner per gift; partner must be a member of the session's group and differ from the owner.
- No acceptance step, no notification.
- Neither partner may ever receive reservation data (`takenUserId`, `takenByList`) for a joint gift.
- Joint section: sorted by `createdAt` ascending, no drag and drop, no medals.
- UI copy (French): section title `Cadeaux communs`; each row subtitle `<owner> & <partner>`; taken-gifts recipient `<A> & <B>`; form field label `Cadeau commun avec :` with empty option `Personne`.
- The agent never applies SQL to a database. The user runs `migration/add_gift_co_owner.sql` themselves (rollback: `migration/rollback_gift_co_owner.sql`); e2e tests need it applied first.
- Comments: one short line, only where useful. Commits: short subject.

## Review Focus

- Partner opens the owner's page: the joint gift shows no reservation state (no "taken" badge, no take button) — Task 2 test `co-owner sees no reservation on owner's page`.
- Joint gift does not also appear in either partner's main list — Task 1 test asserts the main list has no duplicate.
- `coOwnerId` set to self or to a user outside the group: 400 — Task 3 test `invalid co-owner rejected`.
- Partner adds a sub-gift to a joint MULTIPLE gift: allowed (today `subgifts.ts` only allows `parent.userId`) — Task 3 test `partner can add sub-gift`.
- Owner deleted while sharing: the gift survives for the partner, at the end of their main list — Task 4 test.

---

### Task 1: Schema, queries, and API create

**Files:**
- Modify: `prisma/schema.prisma` (model `Gift`, model `User`)
- Create: `lib/giftOwnership.ts`
- Modify: `lib/db/giftManager.ts` (`GiftWithTakenUserId`, `buildDefaultGift`, `getGiftsFromUserId`, new `getJointGiftsFromUserId`, `editableGiftFields`, new `assertValidCoOwner`)
- Modify: `lib/api/validation.ts` (`giftShape`)
- Modify: `pages/api/gift/index.ts` (POST create)
- Modify: `pages/giftList/[...id].tsx` (SSR prop `jointGifts` and a minimal read-only "Cadeaux communs" section, so the test can see it; full UI in Task 5)
- Test: `e2e/jointGift.spec.ts`

**Interfaces:**
- Produces:
  - Prisma: `Gift.coOwnerId: string | null` with relation `coOwner User?` (name `"coOwner"`, `onDelete: SetNull`) and `User.coOwnedGifts Gift[]`; `@@index([coOwnerId])`. Matches `migration/add_gift_co_owner.sql`.
  - `lib/giftOwnership.ts`: `isGiftOwner(gift: { userId: string | null; coOwnerId: string | null }, userId: string | undefined): boolean` (client-safe, no Prisma import).
  - `GiftWithTakenUserId` gains `ownerName?: string; coOwnerName?: string | null`.
  - `getGiftsFromUserId(userId)`: adds `coOwnerId: null` to the existing filter.
  - `getJointGiftsFromUserId(userId: string): Promise<GiftWithTakenUserId[]>`: top-level gifts with `coOwnerId` not null and (`userId = X` or `coOwnerId = X`), `createdAt asc`, with `takenBy`, subgift count, `ownerName`, `coOwnerName` filled like `getGiftsFromUserId`.
  - `class InvalidCoOwnerError extends Error`; `assertValidCoOwner(ownerId: string, coOwnerId: string | null | undefined, groupId: string): Promise<void>` — throws when `coOwnerId === ownerId` or `!isGroupMember(coOwnerId, groupId)`; no-op for null/undefined.

- [ ] **Step 1: Write the failing test** in `e2e/jointGift.spec.ts`, reusing the two-context setup of `e2e/giftTypes.spec.ts` (Alice creates the group, Bob is added and logs in; `aliceUserId`, `bobUserId` from `readSession`).

```ts
test('joint gift created by Alice shows in both Cadeaux communs sections only', async () => {
    const res = await pageA.request.post('/api/gift', {
        data: { gift: { name: 'Weekend à Rome', userId: aliceUserId, coOwnerId: bobUserId }, userGiftId: aliceUserId }
    });
    expect(res.ok()).toBeTruthy();
    await gotoUntilVisible(pageA, `/giftList/${aliceUserId}`, 'Weekend à Rome');
    await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Weekend à Rome');
    await expect(pageA.getByText('Weekend à Rome')).toHaveCount(1);
    await expect(pageB.getByText('Alice & Bob')).toBeVisible();
});
```

- [ ] **Step 2: Run it to see it fail** — `npx playwright test e2e/jointGift.spec.ts` → FAIL (needs the migration applied by the user first, then fails on the missing section).

- [ ] **Step 3: Ask the user to apply `migration/add_gift_co_owner.sql`** (file already written) and wait for their go. Run `npx prisma generate` (no DB access).

- [ ] **Step 4: Implement** `schema.prisma` fields, `isGiftOwner`, `assertValidCoOwner`, `InvalidCoOwnerError`, the two queries (`include: { user: { select: { name } }, coOwner: { select: { name } } }`), `buildDefaultGift` sets `coOwnerId: null`. `editableGiftFields` passes the partner when `coOwnerId !== undefined`, as `coOwner: { connect }` / `{ disconnect: true }` (Prisma rejects a raw `coOwnerId` next to `user: { connect }`). `giftShape` gains `coOwnerId: id.nullish()`. In `pages/api/gift/index.ts` POST `body.gift`, call `assertValidCoOwner(gift.userId, gift.coOwnerId, session.groupId)` and map `InvalidCoOwnerError` to 400. SSR returns `jointGifts` (serialised dates like `giftList`); the page renders a plain `Cadeaux communs` section with name and `<ownerName> & <coOwnerName>`.

- [ ] **Step 5: Run the test** — same command → PASS. Also `npm run lint` clean.

- [ ] **Step 6: Commit** — `git add` the files above and `migration/*.sql`; `git commit -m "feat: joint gift section and co-owner model"`

### Task 2: Reservation and secrecy

**Files:**
- Modify: `lib/db/userTakenGiftManager.ts` (`takeGift`)
- Modify: `pages/giftList/[...id].tsx` (`getServerSideProps` secrecy for both lists, joint section take button)
- Modify: `lib/db/giftManager.ts` (`getTakenGiftsFromUserId` includes `coOwner`)
- Modify: `pages/takenGiftList/[...id].tsx` (`recipient.name`)
- Test: `e2e/jointGift.spec.ts` (needs a third member, Chloé, logged in as `pageC`)

**Interfaces:**
- Consumes: `isGiftOwner` (Task 1).
- Produces: `takeGift` throws `'Cannot take your own gift'` when `isGiftOwner(gift, userId)`.

- [ ] **Step 1: Write the failing tests**

```ts
test('Chloé takes it from Alice page; it shows taken on Bob page', async () => {
    // pageC on /giftList/aliceUserId clicks "Je le prends" on 'Weekend à Rome'
    // pageC on /giftList/bobUserId: same gift shows as taken by her ("Je le libère" visible)
});
test('co-owner cannot take the joint gift', async () => {
    const res = await pageB.request.post(`/api/gift/${giftId}/take`);
    expect(res.status()).toBe(403);
});
test("co-owner sees no reservation on owner's page", async () => {
    // pageB on /giftList/aliceUserId: row 'Weekend à Rome' has no "Je le prends", no taken badge
});
test('taken list shows both recipients', async () => {
    // pageC on /takenGiftList/chloeUserId: text 'Alice & Bob' visible
});
```

- [ ] **Step 2: Run** → FAIL (403 test gets 200; Bob sees taken state).

- [ ] **Step 3: Implement.** `takeGift` uses `isGiftOwner`. In `getServerSideProps`, hide reservations per gift when `isGiftOwner(gift, session?.userId)` for `giftList` and `jointGifts` (replaces the list-wide `isOwner`; the main list keeps behaving the same since its gifts have `coOwnerId` null). In the joint section, show the take button only when the viewer is not an owner. `getTakenGiftsFromUserId` includes `coOwner`; the group filter keeps matching through `gift.user`. Taken row `recipient.name` = `coOwner ? \`${user.name} & ${coOwner.name}\` : user.name`.

- [ ] **Step 4: Run** → PASS; rerun `e2e/giftTypes.spec.ts` and `e2e/gifts.spec.ts` → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat: one reservation for joint gifts, hidden from both partners"`

### Task 3: Co-owner rights and validation

**Files:**
- Modify: `pages/api/gift/[...id].ts` (`canWriteGift`, PATCH/PUT validation)
- Modify: `pages/api/gift/[id]/subgifts.ts` (owner check)
- Test: `e2e/jointGift.spec.ts`

**Interfaces:**
- Consumes: `isGiftOwner`, `assertValidCoOwner`, `InvalidCoOwnerError` (Task 1).

- [ ] **Step 1: Write the failing tests**

```ts
test('partner can edit, then unlink', async () => {
    // PATCH as Bob { gift: { name: 'Weekend à Rome 🍝' } } → 200
    // PATCH as Bob { gift: { coOwnerId: null } } → 200; gone from Bob page, back in Alice main list
});
test('partner can delete it for both', async () => {
    // second joint gift; DELETE /api/gift/{id} as Bob → 200; gone from both pages
});
test('invalid co-owner rejected', async () => {
    // POST as Alice with coOwnerId = aliceUserId → 400
    // POST as Alice with coOwnerId = a user id from another group → 400
    // PATCH as Alice with the same invalid values → 400
});
test('partner can add sub-gift', async () => {
    // joint MULTIPLE gift; POST /api/gift/{id}/subgifts as Bob → 201
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement.** `canWriteGift` and the sub-gift check use `isGiftOwner`. PATCH/PUT: when the body carries a non-null `coOwnerId`, call `assertValidCoOwner(gift.userId, body.gift.coOwnerId, session.groupId)` and map `InvalidCoOwnerError` to 400.

- [ ] **Step 4: Run** → PASS; rerun all e2e (`npm run test:e2e`) → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat: co-owner can edit, unlink and delete joint gifts"`

### Task 4: Profile deletion and merge

**Files:**
- Modify: `lib/db/userManager.ts` (`deleteUser`, `leaveGroup`, `mergeUsers`)
- Modify: `lib/db/giftManager.ts` (new helper)
- Test: `e2e/jointGift.spec.ts`

**Interfaces:**
- Produces: `handOverJointGifts(tx: Prisma.TransactionClient, userId: string): Promise<void>` — for gifts with `userId = X AND coOwnerId IS NOT NULL`: set `userId = coOwnerId`, `coOwnerId = NULL`, `order` = partner's current max main-list `order` + 1 (incrementing per gift), and the same `userId` on their sub-gifts.

- [ ] **Step 1: Write the failing test**

```ts
test('owner deleted: joint gift stays on partner main list', async () => {
    // Dan (member) creates a joint gift with Bob; Alice (admin) deletes Dan via DELETE /api/user/{danId}
    // Bob's main list shows the gift; Bob can PATCH it → 200
});
```

- [ ] **Step 2: Run** → FAIL (gift cascade-deleted).

- [ ] **Step 3: Implement.** `deleteUser` runs `handOverJointGifts` then the delete in one `$transaction`; `leaveGroup` calls it before `tx.user.deleteMany` in the no-groups-left branch. `mergeUsers`: move `coOwnerId: dropId → keepId`, then clear `coOwnerId` where `userId = coOwnerId` (self-shared after merge). Partner deletion needs no code (`SetNull`).

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat: keep joint gifts when an owner leaves"`

### Task 5: Gift form and joint section UI

**Files:**
- Modify: `components/atoms/GiftForm.tsx`
- Modify: `pages/giftList/[...id].tsx` (form state, `saveGift`, joint section reusing the row and modal of the main list, SSR `groupMembers` prop)
- Test: `e2e/jointGift.spec.ts`

**Interfaces:**
- Consumes: `ownerName`, `coOwnerName`, `getJointGiftsFromUserId` (Task 1); `getUsersFromGroupId` (`lib/db/userManager.ts`).
- Produces: `GiftForm` props `partners: { id: string; name: string }[]`, `formCoOwnerId: string | null`, `setFormCoOwnerId: (v: string | null) => void`. The select is hidden when `partners` is empty.

- [ ] **Step 1: Write the failing test**

```ts
test('Alice creates a joint gift from the form', async () => {
    // pageA on own page → "Ajouter un cadeau" → name 'Saut en parachute'
    // select label 'Cadeau commun avec :' → option 'Bob' → "Créer"
    // Alice and Bob pages: section 'Cadeaux communs' contains 'Saut en parachute' and 'Alice & Bob'
    // main list of both pages does not contain it
});
```

- [ ] **Step 2: Run** → FAIL (no select).

- [ ] **Step 3: Implement.** SSR passes `groupMembers` (session group members except the page owner, `{ id, name }`) only when the viewer owns the page or is admin. `GiftForm` renders the select (options: `Personne` + members). `saveGift` sends `coOwnerId`; after save the gift moves between the main list and the joint section in local state. Opening an existing joint gift pre-selects the partner; when the viewer is the co-owner, the select shows the owner and only offers `Personne` (unlink). The joint section reuses the main list's row and modal but is not sortable (no drag handle, no medal) and sorted by `createdAt`; it is hidden when empty.

- [ ] **Step 4: Run** → PASS; `npm run test:e2e` all PASS; `npm run lint` clean.

- [ ] **Step 5: Check in the browser** (preview server): create, section on both pages, dark mode readable, mobile width.

- [ ] **Step 6: Commit** — `git commit -m "feat: pick a partner for a joint gift"`

### Task 6: Changelog and version

- [ ] **Step 1:** Run the `version-update` skill: minor bump, one user-facing line, e.g. `- feat: cadeaux communs, un cadeau partagé avec un autre membre`.
- [ ] **Step 2: Commit** — `git commit -m "chore: changelog for joint gifts"`
