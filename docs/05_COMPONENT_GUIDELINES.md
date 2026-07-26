# 05 — Component and UX Guidelines

**Owner:** CPO / Design
**Technical owner:** Frontend engineering
**Rule:** Reuse the existing design system first.

---

## 1. Component strategy

Before adding components:

1. Inventory current primitives.
2. Reuse accessible existing components.
3. Extend variants where coherent.
4. Create a new primitive only when no compatible abstraction exists.
5. Avoid a second parallel design system.

Recommended logical component groups:

```text
Editorial
Profile
Quiz
Passport
Recommendation
Consent
Navigation
Feedback
```

---

## 2. Core components

### `BeautyProfileEntryCard`

Props or equivalent:

```text
domain: skin | hair
title
description
estimatedTime
status: not_started | in_progress | completed | update_available
href
analyticsContext
```

### `QuizShell`

Responsibilities:

- page title and context,
- progress,
- question slot,
- navigation,
- autosave status,
- errors,
- exit confirmation where needed.

### `QuestionRenderer`

Must render based on versioned question type, not hardcoded per route.

Supported initial controls:

- radio group,
- checkbox group,
- scale,
- optional text,
- informational step.

### `ProfileResultSummary`

Displays:

- profile title,
- summary,
- traits,
- goals,
- rationale,
- limitations.

### `RecommendationCard`

Displays:

- entity type,
- title,
- image if available,
- reason,
- disclosure,
- action.

### `PassportProfileCard`

Displays:

- current profile,
- updated date,
- key goals/traits,
- update CTA,
- history link.

### `ConsentFields`

Must keep:

- required terms/privacy,
- optional marketing,
- linked policy versions.

---

## 3. Quiz interaction rules

- One primary task per step.
- Avoid excessive scrolling on mobile.
- Keep answer targets comfortably tappable.
- Preserve selections on back.
- Disable next only when required validation fails, with explanation.
- Never hide an answer after selecting it.
- Announce errors and progress to assistive technology.
- Show autosave without creating anxiety.
- Avoid fake precision.

### Progress

Use human-friendly progress such as:

- "Step 3 of 8"
- a progress bar with accessible label.

Do not calculate misleading percentages when branch logic changes total steps unless handled accurately.

---

## 4. Copy rules

Tone:

- intelligent,
- warm,
- clear,
- nonjudgmental,
- non-diagnostic.

Prefer:

- "Based on what you shared..."
- "This may be relevant because..."
- "Your answers suggest..."
- "Consider discussing persistent concerns with a qualified professional."

Avoid:

- "You have [condition]."
- "This will fix..."
- "Perfect for everyone with..."
- fear-based conversion,
- exaggerated Korean-beauty superiority.

Final quiz and medical-adjacent copy requires product/editorial review.

---

## 5. Result hierarchy

Recommended order:

1. Profile identity
2. What this means
3. Why we reached this result
4. Your stated goals
5. Practical guidance
6. Recommended reading
7. Save to Passport
8. My Seoul Drop next step
9. Limitations and update/retake

Do not lead with products or affiliate CTAs.

---

## 6. Visual placeholders

Where assets are missing, use explicit placeholders rather than random stock imagery.

```text
[IMAGE REQUIRED: editorial portrait or abstract skin texture; avoid medical imagery]
[IMAGE REQUIRED: healthy hair movement/detail; avoid before/after claims]
[ICON REQUIRED: Skin Profile]
[ICON REQUIRED: Hair Profile]
[ILLUSTRATION REQUIRED: Beauty Passport concept]
```

Placeholders must preserve intended aspect ratio and responsive behavior.

---

## 7. Accessibility requirements

- Native semantic elements first.
- Fieldset/legend for grouped questions.
- Labels linked to controls.
- Keyboard and screen-reader operation.
- Focus moves predictably after step change.
- Error summary links to invalid controls where applicable.
- Images have meaningful alt text or empty alt when decorative.
- Motion is reduced under user preference.
- Dialogs trap and restore focus.
- Toasts are not the only place important errors appear.

---

## 8. Responsive behavior

Design and test at minimum:

- narrow mobile,
- standard mobile,
- tablet,
- desktop,
- large desktop.

Do not merely shrink desktop cards. Reconsider hierarchy and spacing on mobile.

Quiz content should remain readable without horizontal scroll.

---

## 9. Loading and error states

Every async surface needs:

- initial loading or skeleton,
- save-in-progress,
- save success,
- recoverable error,
- unrecoverable/expired state,
- retry.

Avoid indefinite spinners.

---

## 10. Commercial UI rules

Affiliate, sponsored, and own-brand relationships must be visibly labeled.

Do not use:

- fake urgency,
- hidden disclosures,
- commission-driven "best" badges,
- overwhelming product grids on result pages,
- adropof visual favoritism presented as neutral editorial ranking.

---

## 11. Design review checklist

- [ ] Reads as editorial, not ecommerce
- [ ] Value appears before signup
- [ ] Skin and Hair are distinct
- [ ] Rationale is visible
- [ ] Mobile flow is complete
- [ ] Accessibility verified
- [ ] Empty/error/loading states included
- [ ] Disclosure present
- [ ] No diagnostic language
- [ ] Existing design system respected
