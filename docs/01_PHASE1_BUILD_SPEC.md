# 01 — Phase 1 Build Specification

**Product owner:** CPO
**Technical owner:** CTO
**Reviewers:** CEO, CMO, CSO
**Status:** Implementation specification
**Dependency:** Repository audit must be completed first

---

## 1. Phase 1 outcome

At the end of Phase 1, a new or returning user must be able to:

1. Discover Beauty Profile from editorial pages or navigation.
2. Choose Skin Profile or Hair Profile.
3. Complete the quiz without creating an account.
4. Resume progress after refresh within a reasonable retention window.
5. Receive a meaningful, non-diagnostic result.
6. Understand why the result was generated.
7. Create an account after seeing the result.
8. Retain the anonymous quiz result after signup.
9. View current and historical profiles in Beauty Passport.
10. Receive a limited set of explainable editorial recommendations.
11. Navigate into My Seoul Drop or save-ready experiences.
12. Control optional marketing consent.

---

## 2. Functional workstreams

### WS-00 Repository audit

Before implementation, inspect:

- framework and versions,
- app/router structure,
- package manager,
- TypeScript and lint configuration,
- styling system,
- component library,
- CMS,
- database and migration tooling,
- auth,
- server/client state patterns,
- analytics,
- email/CRM,
- testing,
- deployment,
- installed gstack commands or skills,
- existing profile, save, or user tables,
- current A Drop of Seoul routes and design conventions.

#### Deliverable

Create `docs/IMPLEMENTATION_AUDIT.md` containing:

- system map,
- reusable components,
- constraints,
- security or privacy risks,
- proposed implementation mapping,
- changed file estimate,
- milestone recommendation,
- explicit unknowns.

Do not modify production behavior during WS-00.

---

### WS-01 Navigation and entry points

#### Goal

Expose Beauty Profile without making the publication quiz-first.

#### Required behavior

- Add a GNB or account-area CTA labeled in final product language.
- Add contextual article CTA support.
- Add a homepage Beauty Profile module after featured editorial content, not before the editorial identity is established.
- Support direct linking to Skin and Hair Profile.
- Preserve existing editorial navigation and mobile behavior.

#### Acceptance criteria

- A user can reach Beauty Profile in two interactions or fewer from homepage.
- The homepage still reads as an editorial publication.
- Contextual CTAs are optional by article/template.
- All entry points have analytics.
- No login is required.

---

### WS-02 Beauty Profile hub

#### Purpose

Explain the value of profiling and let users choose Skin or Hair.

#### Required sections

1. Introductory headline and explanation
2. Skin Profile card
3. Hair Profile card
4. What the profile can and cannot do
5. Privacy and data-use reassurance
6. Returning-user state when a profile exists
7. Link to Beauty Passport for authenticated users

#### Placeholder content

Use clearly marked content placeholders when final copy is unavailable:

```text
[CONTENT REQUIRED: profile value proposition]
[CONTENT REQUIRED: Skin Profile estimated time]
[CONTENT REQUIRED: Hair Profile estimated time]
[LEGAL REVIEW REQUIRED: non-diagnostic disclaimer]
```

Do not invent medical claims.

#### Acceptance criteria

- Cards clearly distinguish Skin and Hair.
- The page states that the result is guidance, not diagnosis.
- Returning users can update rather than accidentally overwrite history.
- Mobile layout is complete.
- Accessibility names and focus order are valid.

---

### WS-03 Quiz framework

Build a reusable quiz framework before implementing domain-specific questions.

#### Capabilities

- versioned quiz definition,
- question groups and steps,
- single select,
- multi-select,
- scale,
- optional free text only where approved,
- optional question,
- validation,
- progress indicator,
- back/next navigation,
- autosave,
- resume,
- anonymous session support,
- accessibility,
- event tracking,
- final submission,
- server-side validation.

#### State rules

- Server data is authoritative for submitted attempts.
- Client state may be used for responsive UX.
- Do not depend only on local storage.
- Never store sensitive answers in URL parameters.
- Avoid logging raw answers to analytics tools.

#### Acceptance criteria

- Refresh does not discard persisted progress.
- Back navigation preserves answers.
- A malformed client request cannot submit an invalid question ID or option.
- Quiz version is preserved with each attempt.
- A completed attempt is immutable; updates create a new attempt or snapshot.
- Error recovery does not force a full restart.

---

### WS-04 Anonymous identity

#### Goal

Allow useful completion before signup and reliable linking afterward.

#### Required behavior

- Issue an opaque anonymous identifier.
- Store only the minimum required identity state.
- Link quiz attempts to anonymous identity.
- On signup/login, merge only records that belong to the current anonymous identity.
- Prevent replay or cross-account attachment.
- Preserve completed results and in-progress attempts.
- Define expiration and cleanup policy.
- Support logout without exposing another user's data.

#### Security notes

The exact mechanism depends on the existing auth stack. Prefer secure, HTTP-only, same-site cookies for server-trusted identity. Local storage can supplement UI state but must not be the only proof of ownership.

#### Acceptance criteria

- Anonymous quiz completion works.
- Signup after result retains the result.
- The same attempt is not duplicated during linking.
- Two browsers do not merge accidentally.
- A user cannot attach another anonymous ID by editing a client field.
- Linking is transactional or safely retryable.

---

### WS-05 Skin Profile quiz

#### Product rule

Question copy and taxonomy require product approval. Engineering should create a versioned configuration structure with seed placeholders rather than invent authoritative dermatological logic.

#### Suggested question domains

- primary goals,
- self-observed skin tendencies,
- sensitivity or reactivity,
- hydration and oiliness patterns,
- current routine complexity,
- environment or climate,
- preferences and exclusions,
- optional current concerns.

These are planning categories, not approved medical questions.

#### Result structure

A Skin Profile result may include:

- profile title,
- concise summary,
- observed traits based on answers,
- goals,
- guidance,
- what may change the result,
- relevant reading,
- recommended next steps,
- limitations,
- recommendation reasons.

#### Acceptance criteria

- Every displayed trait maps to declared answers or explicit rules.
- No disease diagnosis.
- No definitive treatment instruction.
- Result can be regenerated deterministically for the same quiz version and answers.
- Rule version is stored.
- Result is visible before signup.

---

### WS-06 Hair Profile quiz

Use the same framework with a separate versioned definition.

#### Suggested question domains

- scalp and hair goals,
- strand characteristics,
- treatment and color history,
- styling and heat habits,
- wash pattern,
- breakage and dryness observations,
- environment,
- product preferences and exclusions.

These are planning categories, not approved medical questions.

#### Result structure

- profile title,
- hair/scalp observation summary,
- goals,
- routine considerations,
- relevant editorial reading,
- limitations,
- recommendation reasons.

#### Acceptance criteria

Same as Skin Profile, adapted to hair and scalp. Do not describe scalp conditions as diagnosed disease.

---

### WS-07 Results experience

#### Required page sections

1. Result identity
2. Summary
3. "Why this result" explanation
4. Declared goals and traits
5. Guidance and limitations
6. Recommended articles
7. Optional products/places only if data exists and rationale is clear
8. Signup/save prompt
9. Retake or update action
10. My Seoul Drop gateway where relevant

#### Signup prompt

The prompt should offer continuity:

- Save this profile
- Track changes over time
- Build your Beauty Passport
- Save relevant Seoul discoveries

Do not use loss aversion that implies the result will disappear immediately.

#### Indexing

Personalized result pages must not be publicly indexable. Do not place personal answers in metadata.

#### Acceptance criteria

- Result is useful without signup.
- Recommendation rationale is visible.
- Any affiliate or sponsorship relationship is disclosed.
- Result route cannot expose another user's result.
- Screenshot/share functionality, if added later, must exclude private details by default.

---

### WS-08 Signup and consent

#### Required fields

- email or existing auth-provider identity,
- required account and privacy consent,
- optional marketing consent.

#### Progressive profiling

Do not require these at initial signup unless technically necessary:

- country,
- age band,
- language,
- interests,
- Seoul travel intent.

Collect them later with a clear value exchange.

#### Acceptance criteria

- Optional marketing consent is separate and unchecked.
- Consent document version and timestamp are recorded.
- Failed signup does not destroy the anonymous result.
- Successful signup links the result exactly once.
- Existing-account login is supported from the same flow.
- Duplicate-email behavior is clear and safe.

---

### WS-09 Beauty Passport

#### Purpose

Give users a persistent and comprehensible record.

#### Required sections

- current Skin Profile summary,
- current Hair Profile summary,
- goals,
- preferences,
- last updated date,
- profile history,
- saved editorial recommendations,
- link into My Seoul Drop,
- settings and consent entry point.

#### History behavior

- Never silently overwrite a completed profile.
- New completed quiz creates a new snapshot.
- Current profile points to the most recent approved snapshot.
- Users can inspect meaningful changes.
- Raw answer display is optional and may follow later.

#### Empty states

Support:

- no profile,
- only Skin,
- only Hair,
- anonymous result not yet linked,
- old quiz version requiring update.

#### Acceptance criteria

- Private routes require authenticated authorization.
- Profile history is ordered and stable.
- A user can start/update missing sections.
- Empty states provide a meaningful next action.
- Passport does not resemble an admin dashboard or medical chart.

---

### WS-10 Editorial personalization

#### Phase 1 behavior

Use rules and curated mappings to show relevant editorial content based on:

- profile type,
- declared goals,
- selected concerns,
- explicit interests,
- locale where available.

#### Rules

- Recommendations remain useful if behavioral tracking is disabled.
- Do not use hidden sensitive segmentation.
- Store reason codes.
- Provide fallback editorial selections.
- Avoid filter bubbles by allowing broader discovery.

#### Acceptance criteria

- Each recommendation includes at least one reason code.
- Missing mappings do not break pages.
- Editorial ranking can be configured without code changes where feasible.
- Sponsored status does not masquerade as relevance.

---

### WS-11 My Seoul Drop gateway

Phase 1 may not include the full application.

#### Required minimum

- Stable entry route or external/app link.
- Save-ready button interfaces behind feature flags.
- Product/place/article identifiers that can later be saved.
- Clear distinction between editorial reading and personalized saves.
- No dead-end CTA.

#### Possible states

1. My Seoul Drop exists in the same repository.
2. It exists in another repository/domain.
3. It is not yet live.

The repository audit must determine which state applies. If not live, use a feature flag and a graceful waitlist or "coming next" state approved by product.

---

### WS-12 Newsletter relationship

#### Requirements

- Newsletter signup should be available independently of account creation.
- Account and marketing consent must not be conflated.
- Context/source of signup should be stored.
- Avoid making every result page primarily an email capture page.
- Use a clear editorial value proposition.

#### Acceptance criteria

- Signup source is tracked.
- Duplicate subscriptions are handled safely.
- Consent is recorded.
- Failure does not block core product use.

---

### WS-13 Analytics

Implement the taxonomy in `06_ANALYTICS_EVENTS.md`.

#### Rules

- Do not send raw quiz answers to third-party analytics.
- Use stable event names and schema.
- Track funnel state without exposing sensitive profile content.
- Support anonymous-to-authenticated identity transition according to provider best practices.
- Consent requirements must be respected.

---

## 3. Nonfunctional requirements

### Accessibility

Target WCAG 2.2 AA practices:

- keyboard completion,
- visible focus,
- semantic labels,
- proper error messages,
- sufficient contrast,
- no color-only meaning,
- reduced motion support,
- screen-reader announcements for quiz progress and errors.

### Performance

- Preserve editorial page performance.
- Avoid loading full quiz/recommendation code on unrelated articles.
- Use image optimization and existing repository patterns.
- Avoid client-only rendering where it harms SEO or first load.
- Set measurable budgets after audit.

### Security and privacy

- Authorization on every private data read/write.
- Server-side input validation.
- No predictable public identifiers for private results.
- CSRF and session protections according to the existing stack.
- Principle of least privilege for database access.
- No sensitive data in logs, URLs, error reporting, or analytics.
- Rate limits on mutation endpoints where appropriate.

### Reliability

- Idempotent completion and identity-link operations.
- Transactional profile creation where supported.
- Migration rollback or recovery plan.
- Safe handling of partial signup or provider failure.
- Feature flags for incomplete modules.

### Localization

- Do not hardcode locale assumptions throughout components.
- Store canonical internal values separately from translated labels.
- Support future English/Korean expansion.
- Confirm Phase 1 launch locale during audit.

---

## 4. Feature flags

Recommended logical flags; adapt to current tooling:

```text
beauty_profile_enabled
skin_profile_enabled
hair_profile_enabled
beauty_passport_enabled
profile_recommendations_enabled
my_seoul_drop_gateway_enabled
newsletter_profile_cta_enabled
profile_history_enabled
```

Flags must have safe defaults and must not expose broken navigation.

---

## 5. Definition of done

A workstream is complete only when:

- implementation matches this specification,
- types and validation exist,
- migrations are included,
- tests pass,
- accessibility is checked,
- analytics events are implemented,
- error and empty states exist,
- documentation is updated,
- no unrelated redesign or refactor is introduced,
- the agent reports limitations honestly.

---

## 6. Launch checklist

- [ ] Anonymous Skin Profile end-to-end
- [ ] Anonymous Hair Profile end-to-end
- [ ] Result before signup
- [ ] Signup/linking retry tested
- [ ] Existing account login tested
- [ ] Passport authorization tested
- [ ] Profile history tested
- [ ] No personal result indexing
- [ ] Consent versions recorded
- [ ] Raw answers excluded from analytics
- [ ] Mobile and keyboard QA
- [ ] Error monitoring enabled
- [ ] Feature-flag rollback path
- [ ] Editorial pages unaffected
- [ ] Legal and medical copy reviewed
- [ ] Analytics funnel verified
