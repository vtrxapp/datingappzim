# Documented future features (explicitly out of MVP scope)

These were called out in the product brief as real future directions, not
implemented here. Each entry says why it's deferred and roughly where it
would hook into the current codebase.

## Totem/clan compatibility filtering

A culturally significant matching signal in Zimbabwe, but it needs careful
product design (which totems, how compatibility is defined, how sensitively
it's surfaced) that wasn't specified. Hook point: add a `totem` field to
`Profile` + a new `QuestionDefinition` in `packages/shared/src/questionnaire.ts`,
then fold it into `MATCHING_CONFIG` / `scoreCandidate` in
`apps/api/src/matching/matching-scoring.util.ts` as an additional weighted
factor (or a hard filter, depending on the product decision).

## Church/denomination partner matching

Same shape as totem matching: a `denomination` questionnaire question plus
a scoring/filter rule. Deferred because it changes the onboarding
questionnaire's length and framing (the MVP intentionally caps it at ~7
questions for a sub-90-second flow) and needs a decision on how prescriptive
vs. optional it should be.

## "Introduce to family" flow

A distinct, higher-trust feature that likely needs its own data model (who
counts as "family," multi-party consent, scheduling) and safety
considerations beyond the current safety-check-in feature. Deferred as a
post-launch feature once there's real usage data on how couples reach that
stage. Would likely live alongside `apps/api/src/safety` as a new module
rather than extending it, since the trust/consent model is different from a
single check-in contact.

## ML-based matching

The MVP's matching is intentionally rule-based
(`apps/api/src/matching/matching-scoring.util.ts`), no model training, no
ranking service. This is a deliberate choice: there isn't enough real
interaction data yet to train or evaluate a model against. A
transparent, debuggable scoring function is easier to tune during early
growth. Once there's a meaningful volume of `Match` outcomes (interested /
passed / mutual / message counts), that data is already structured to train
a ranking model later. The `MatchingService.generateIntroductions` method
is the single seam where a model's output could replace `scoreCandidate`
without changing any controller, DTO, or frontend code.

## Native iOS/Android apps

The MVP is a Next.js PWA by design (installable, no app-store review cycle,
one codebase). A native wrapper (Capacitor/React Native) is a reasonable
next step once there's product-market fit, not before.

## Payments beyond a single Premium tier

Plan/pricing config (`packages/shared/src/plans.ts`) already supports adding
more `SubscriptionPlanId` values. `PaymentProvider` already supports
adding OneMoney/PesePay/card implementations alongside `PaynowPaymentProvider`.
Multiple tiers, add-ons, or one-off purchases (e.g., a boost) are
deliberately not built yet. The brief asked for a single Premium tier for
MVP.
