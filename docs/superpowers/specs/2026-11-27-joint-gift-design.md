# Joint gift (cadeau commun) — design

## Why
A couple wants one joint gift (for example, a weekend away). Today it has to sit on one partner's list, or on both and risk being bought twice.

## What
- When creating or editing a gift, the owner can pick **one** partner from the same group.
- Joint gifts show in their own **"Cadeaux communs" section** under the main list, on both partners' pages. Each shows "<owner> & <partner>".
- Reserving it from either page reserves it once, everywhere. Neither partner sees who took it (same secrecy as today).
- Both partners are **equal co-owners**: either one can edit, delete, or unlink it.
- **No acceptance step**: it appears in the partner's section straight away, and the partner can remove it.
- Works for every gift type (SIMPLE, MULTIPLE, UNLIMITED). Sub-gifts follow their parent.
- The section is sorted by creation date: no drag and drop, no top-3 medals. Personal gifts keep their order and medals.

## Non-goals
- More than two owners (family-wide gifts).
- Invitations, notifications, or pending states.
- Ordering or ranking joint gifts.

## Anti-goals
- A joint gift bought twice.
- Either partner learning who reserved it.
- A partner's action changing the order of the other's main list.

## Approaches
- **A. `coOwnerId` on `Gift` (chosen).** One gift, one reservation. Smallest change; capped at two owners, which fits the couple case.
- B. `GiftOwner` join table. Supports N owners, but migrates every gift and rewrites every gift query, for flexibility not needed.
- C. Two linked copies kept in sync. Dropped: a missed sync means a double purchase.
- Ordering: a per-partner `coOwnerOrder` column was dropped in favour of a separate section sorted by creation date (simpler, no order interference).

## Design
- **Schema**: `Gift.coOwnerId String?` (relation to `User`, `onDelete: SetNull`), index on `[coOwnerId]`.
- **Lists**: `getGiftsFromUserId` returns only gifts with `userId = X` and no `coOwnerId` (main list, unchanged ordering). A new `getJointGiftsFromUserId` returns top-level gifts where `coOwnerId` is set and `userId = X OR coOwnerId = X`, sorted by creation date.
- **Rights**: edit, delete, add sub-gifts and unlink are allowed when the session user is `userId` or `coOwnerId`.
- **Reservation**: `takeGift` refuses when the taker is the owner or the co-owner. Reservations are hidden per gift from both.
- **Deleting**: either partner deletes it for both. Unlinking clears `coOwnerId`; the gift stays with `userId` (back on their main list; if the co-owner unlinks, it leaves their page).
- **Partner leaves or deletes their profile**: `SetNull` turns it into a normal gift of the other partner. If the owner (`userId`) is deleted, the gift would be cascade-deleted; instead hand it to `coOwnerId` (appended at the end of their main list).
- **Partner picker**: in `GiftForm`, a select of the other members of the current group, optional.
- **Taken-gifts page**: recipient shows "<A> & <B>".
- **Changelog**: one user-facing line.

## Left to the builder
- Exact section styling and picker placement in `GiftForm`.
- Prisma client regeneration.
- e2e coverage: create joint gift, visible in both sections, take from one page shows taken on the other, partner can edit and unlink, owner cannot take their partner's joint gift.

## Delivery constraint
The user applies the SQL migration to the database themselves (`migration/add_gift_co_owner.sql`, rollback in `migration/rollback_gift_co_owner.sql`). Nothing is applied by the agent.
