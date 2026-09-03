# DatingAppZim — MVP

A marriage-intent-focused matchmaking platform for Zimbabwe (Harare/Bulawayo
first). Deliberately **not** a swipe app: no infinite browse grid, no casual
mode — a small daily/weekly batch of curated introductions, safety tooling
built in from day one, and a mobile-first PWA that works on a low-end phone
over 3G.

## Product scope (what's built)

1. Phone number + OTP signup (no email-first flow)
2. A 7-question onboarding questionnaire (name, gender, seeking, city, age
   range, date of birth, core values), completable in well under 60 seconds —
   deliberately **no photo or hobbies step**, to keep signup as short as
   possible. Seeing your first daily batch is **never gated** on either of
   those — but responding to a match (Interested or Pass) requires at least
   one photo and one hobby, so a "complete your profile to respond" banner on
   Matches nudges you to Settings for both right after you land there, rather
   than front-loading them into signup. Hobbies are free text, up to 5 — a
   curated list is offered as quick-tap suggestions, but typing your own is
   the primary path, since a specific hobby is a better conversation opener
   than a generic one. Settings also lets you edit your display name from its
   own section there.
3. Rule-based (no ML) daily match batches, scored on city, mutual age
   compatibility, shared core values, shared hobbies, and verification status
4. Profile view: up to 6 photos (server-compressed to <100KB each), bio,
   structured "About" answers, verification badge
5. Chat that only unlocks after **mutual** interest — text + one image per
   message, phone numbers never exposed in-app
6. Safety check-ins: pick a safety contact (no account needed) who gets a
   text and, if you don't check in on time, a follow-up alert
7. Report/block on every profile and chat thread, routing to a minimal
   internal admin queue
8. A single Premium tier — more daily introductions, seeing everyone who's
   interested in you (Free sees your 5 most recent), and attaching a short
   note to an Interested so they see it before they respond — paid via
   EcoCash through Paynow, behind a provider-agnostic payment interface with
   a mock provider for local dev

**Scope decision made during this build:** matching is heterosexual-only for
the MVP (a man seeking a woman / a woman seeking a man). This was decided
explicitly rather than assumed, given Zimbabwe's legal and social climate
and this product's safety-first positioning — see the "Gender/matching
scope" section below for the reasoning and how to revisit it later.

Totem/clan matching, church/denomination matching, an "introduce to family"
flow, and ML-based matching are **explicitly out of scope** — see
[`docs/future-features.md`](docs/future-features.md) for why and where each
would hook in.

## Repo structure — monorepo, and why

```
apps/
  api/      NestJS backend
  web/      Next.js (App Router) PWA frontend
packages/
  shared/   TypeScript enums, questionnaire config, plan/pricing config,
            matching-score weights, and API DTOs shared by both apps
docs/
  future-features.md
docker-compose.yml   Postgres 16 + Redis 7 for local dev
```

A single repo with npm workspaces was chosen over separate frontend/backend
repos because: the two apps need to agree on a lot of shared shape (gender
enums, the questionnaire definition, plan pricing, DTOs) and doing that via
`packages/shared` — built once, consumed by both — is far simpler than
publishing and versioning a package across repos at this stage; a solo/small
team benefits from one PR touching both sides of a feature and one CI
pipeline; and there's no deployment reason yet to split them (they don't
scale independently in any way that matters at MVP traffic). Revisit this
if/when the frontend and backend get separate teams or genuinely different
release cadences.

## Tech stack

- **Frontend:** Next.js 14 (App Router) PWA, Tailwind CSS, no heavy UI
  library — kept deliberately light for low-bandwidth constraints
- **Backend:** NestJS 10, Prisma ORM
- **Database:** PostgreSQL 16 (primary data), Redis 7 (OTP codes, refresh
  token registry, mock-payment polling state)
- **Media storage:** Cloudflare R2 (S3-compatible) in production; a
  filesystem-backed mock in local dev — see `apps/api/src/storage`
- **Payments:** EcoCash via Paynow's Express Checkout, behind a
  `PaymentProvider` interface with a mock implementation for local dev — see
  `apps/api/src/subscriptions/payments`
- **Auth:** Phone number + OTP only. JWT access (15 min) + refresh (30 day,
  rotated, Redis-revocable) tokens in httpOnly cookies

## Getting started locally

Prerequisites: Node 20+, npm, and either Docker or a local Postgres 16 +
Redis 7.

```bash
npm install

# Postgres + Redis — pick one:
docker compose up -d
# ...or point DATABASE_URL / REDIS_URL at services you already have running.

cp .env.example apps/api/.env
npm run db:migrate --workspace apps/api   # prisma migrate dev

npm run dev:api    # http://localhost:4000/api
npm run dev:web    # http://localhost:3000
```

With `SMS_PROVIDER=mock` and `PAYMENT_PROVIDER=mock` (the defaults), OTP
codes are printed to the API's console log instead of being texted, and a
Premium upgrade "pays" itself a few seconds after you initiate it — so the
whole product can be exercised with zero external accounts.

Admin access for local testing: set `ADMIN_BOOTSTRAP_PHONE` in
`apps/api/.env` to the phone number you'll sign up with; that account is
granted the `ADMIN` role on first verify, unlocking `/admin` in the frontend
(reports queue + verification queue).

Any profile created before photo upload existed (or just created directly
in the database for testing) can be given a placeholder avatar with:
`cd apps/api && set -a && source .env && set +a && npx ts-node scripts/seed-avatars.ts`
— see that file's header comment for what it actually generates.

## Architecture notes and decisions

**Auth.** OTP codes are HMAC-hashed and stored in Redis with a TTL (not
Postgres — they're inherently ephemeral), with attempt limits and a resend
cooldown. Sessions are JWT access/refresh pairs in httpOnly, sameSite=lax
cookies (not localStorage, to keep tokens out of reach of any XSS); refresh
tokens are tracked in Redis by JTI so logout/rotation can actually revoke
them, not just let them expire.

**Data model.** All primary keys are UUIDs. `users.deletedAt` implements
soft-delete — account deactivation (self-service or via an admin "actioned"
report) never erases message/match/report history, only hides the account
and blocks login. Beyond the 8 tables named in the brief
(`users`, `profiles`, `questionnaire_responses`, `matches`, `messages`,
`reports`, `safety_checkins`, `subscriptions`), three more were added
because the features described can't work without them:
`profile_photos` (up to 6 per profile, ordered), `blocks` (block is a direct
user action, distinct from a `report`'s admin-review path), and
`payment_transactions` (a subscription's payment history — a subscription
can have multiple payment attempts, e.g. a failed EcoCash prompt followed by
a retry).

**Matching.** `apps/api/src/matching/matching-scoring.util.ts` is pure,
unit-tested, and has no ML in it: it scores mutual-preference-eligible
candidates on same-city match, age proximity, shared questionnaire "core
values", shared hobbies (a lighter-weight signal than core values, since
hobbies are optional), and verification status. Hobbies are free text (see
below), so the overlap check compares case/whitespace-insensitively rather
than requiring an exact match — deliberately no fuzzier than that ("Soccer"
won't match "Football"), consistent with no ML in the MVP. Same-city is heavily weighted but is
**not** a hard filter — with a small early user base, hard-filtering by
city could easily return zero candidates, so scoring naturally prefers
same-city matches and falls back to other cities only when that's all
there is. A `Match` row is created lazily (on first daily batch request per
user per day) rather than via a cron job, which keeps the logic simple and
always-correct; `userOneId`/`userTwoId` are stored in a canonical
(lexicographically sorted) order so a pair can never produce two Match rows
regardless of who was matched against whom.

**Responding to matches requires a completed-enough profile.**
`ProfilesService.assertReadyToExpressInterest` (called from
`MatchingService.expressInterest`, so it's enforced server-side regardless
of what the client does) requires at least one photo and one hobby before
either "Interested" or "Pass" is accepted — a deliberate product decision to
get people to finish their profile once they can see it has real value
(actual matches in front of them), rather than front-loading it into
onboarding — which is why neither is asked during onboarding at all.
`GET /profiles/me/readiness` lets the frontend show this proactively
instead of waiting for a rejected request (the "complete your profile to
respond" banner on Matches); the Settings page's photo uploader and
Hobbies editor are how someone satisfies it afterwards.

**Hobbies are free text, not a fixed enum.** `QuestionDefinition.allowCustomValues`
(`packages/shared/src/questionnaire.ts`) marks HOBBIES as accepting any
1-40 character string, not just its `HOBBY_OPTIONS` list — those options
are offered as tap-to-add suggestions, but typing your own is the primary
path (`apps/web/src/components/HobbiesInput.tsx`, shared by onboarding and
Settings). This was a deliberate product call: a generic pick from a list
is a weaker conversation opener than something specific someone typed
themselves. `QuestionnaireService.validateAnswer`'s `MULTI_SELECT` branch
checks shape/length instead of list membership whenever a question sets
this flag.

**Storage.** Photo/ID uploads are always re-compressed server-side via
`sharp` (resize to a max 1080px edge, then step JPEG quality down until
under 100KB) before being handed to whichever `StorageProvider` is
configured — this is what makes "profile view loads under 1MB" true
regardless of what a user uploads.

**Payments.** `PaymentProvider` is a two-method interface
(`initiate` / `checkStatus`) so OneMoney/PesePay/cards can be added later
without touching `SubscriptionsService`. **Important caveat:**
`developers.paynow.co.zw` was not reachable from the sandboxed environment
this was built in (network egress to that domain was blocked), so
`PaynowPaymentProvider`'s field names and hash algorithm are implemented
from Paynow's long-documented, widely-mirrored integration pattern (the one
their own SDKs follow) rather than a live re-check of current docs. Verify
against the real docs and a sandbox integration ID/key before taking a real
payment — the header comment on that file flags this too. The
`resulturl` webhook handler also does not yet verify Paynow's response
signature (see the comment in `SubscriptionsService.handleWebhook`); the
poll-based `checkPaymentStatus` path (which the frontend actually uses) is
the one to trust today.

**Gender/matching scope.** Modeled as `Gender { MALE, FEMALE }` and a single
`seekingGender` value (not an array) on `Profile` — matching only man↔woman.
This was a deliberate product decision, not a default: Zimbabwe's current
legal and social climate around LGBTQ+ people creates real safety exposure
for users that this MVP's safety tooling (report/block, a safety-contact
check-in) is not designed to mitigate, and the local competitors this
product is positioned against (Nemoyo, ZimCupid) both target the mainstream
heterosexual marriage market. If this is revisited, the change is
contained: extend `Gender` in `packages/shared/src/enums.ts`, change
`seekingGender` to an array, and update the hard-filter in
`MatchingService.generateIntroductions` — no other module assumes binary
gender.

**PWA.** `@ducanh2912/next-pwa` generates the service worker and caches
static assets; it's disabled in dev (`next dev`) and only active in a
production build. Icons in `apps/web/public` are placeholders pending real
branding.

## What's genuinely not production-ready yet

- Paynow hash/webhook verification needs to be checked against live docs
  and a real sandbox account (see above).
- SMS/WhatsApp delivery is mocked to the API console
  (`apps/api/src/notifications`) — swap in a real gateway behind the same
  `MessagingProvider` interface.
- R2 credentials/bucket and a public CDN domain need to be provisioned;
  `STORAGE_PROVIDER=local` is dev-only.
- ID verification documents are stored through the same pipeline as regular
  photos, gated only by "an admin can see the URL" — before handling real
  government ID images at any scale this needs a real access-control and
  retention review (signed URLs, encryption at rest, a deletion policy) and
  likely a data-protection/legal review.
- The admin role is granted via `ADMIN_BOOTSTRAP_PHONE`, not a real
  role-management UI — fine for one or two internal reviewers at MVP scale,
  not a general solution.
- Automated test coverage is currently limited to the matching-scoring unit
  tests (`apps/api/src/matching/matching-scoring.util.spec.ts`); the full
  golden path (signup → OTP → onboarding → matching → mutual interest →
  chat → premium upgrade) was verified manually against a running instance
  (curl for the API, Playwright for the UI) while building this, not via a
  checked-in e2e suite.

## Tuning pricing and quotas

Plan pricing, daily-introduction quotas, how many admirers Free can see
(`maxVisibleAdmirers`), and whether a plan can attach a note to Interested
(`canSendInterestNote`) all live in `packages/shared/src/plans.ts` — a
config change, not a code change, and shared by both the backend
(enforcement) and frontend (display) since it's in `packages/shared`.
