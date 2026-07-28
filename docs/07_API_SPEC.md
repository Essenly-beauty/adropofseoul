# 07 — API and Server Contract Specification

**Status:** Logical contracts. Implement as REST, RPC, server actions, GraphQL, or framework-native handlers according to the repository.
**Owner:** CTO

---

## 1. Principles

- Server validates every mutation.
- Private resources require authorization.
- Anonymous ownership must be proven server-side.
- Mutations that may retry should be idempotent.
- Do not expose internal rule details unnecessarily.
- Do not put raw answers in URLs.
- Return stable machine-readable error codes.
- Use existing repository conventions.

---

## 2. Logical operations

### Get active quiz definition

```text
getActiveQuizDefinition(domain, locale)
```

Returns:

```json
{
  "quizKey": "skin_profile",
  "version": 1,
  "title": "...",
  "sections": [],
  "questions": []
}
```

Do not return draft definitions publicly.

### Start quiz attempt

```text
startQuizAttempt(domain, sourceContext, idempotencyKey)
```

Returns:

```json
{
  "attemptId": "opaque-id",
  "quizVersion": 1,
  "status": "in_progress",
  "resumeTokenOrSessionState": "implementation-specific"
}
```

### Get owned attempt

```text
getQuizAttempt(attemptId)
```

Requires authenticated or anonymous ownership proof.

### Save response

```text
saveQuizResponse(attemptId, questionKey, response, idempotencyKey)
```

Server checks:

- attempt ownership,
- attempt status,
- question belongs to quiz version,
- response shape,
- option validity,
- branch rules where applicable.

### Save progress

```text
updateQuizProgress(attemptId, currentStep)
```

Do not trust arbitrary out-of-range step values.

### Complete attempt

```text
completeQuizAttempt(attemptId, idempotencyKey)
```

Transactionally:

1. validate required responses,
2. lock or guard completion,
3. calculate deterministic result,
4. create profile snapshot,
5. create recommendation set if enabled,
6. mark attempt complete,
7. return result reference.

Repeated calls return the same completed result.

### Get result

```text
getProfileResult(resultId)
```

Requires ownership.

Response includes:

- profile summary,
- traits,
- goals,
- rationale,
- limitations,
- recommendations,
- save/account state.

### Link anonymous identity

```text
linkAnonymousProfileToUser(linkContext, idempotencyKey)
```

Server derives anonymous identity from trusted session, not arbitrary client-provided ownership.

Returns linked attempts/snapshots summary.

### Get Beauty Passport

```text
getBeautyPassport()
```

Authenticated only.

Returns current Skin/Hair profiles, history summaries, recommendations, and feature availability.

### Get profile history

```text
getProfileHistory(domain, cursor)
```

Authenticated and paginated where needed.

### Get recommendations

```text
getProfileRecommendations(profileSnapshotId, context)
```

Authorization required for personalized source profile.

### Record consent

```text
recordConsent(consentType, documentVersion, status, source)
```

Marketing consent remains optional.

---

## 3. Error codes

Suggested controlled codes:

```text
AUTH_REQUIRED
FORBIDDEN
ATTEMPT_NOT_FOUND
ATTEMPT_EXPIRED
ATTEMPT_ALREADY_COMPLETED
QUIZ_VERSION_RETIRED
INVALID_QUESTION
INVALID_RESPONSE
MISSING_REQUIRED_RESPONSE
IDENTITY_LINK_CONFLICT
IDENTITY_LINK_RETRYABLE
FEATURE_DISABLED
RATE_LIMITED
VALIDATION_FAILED
INTERNAL_ERROR
```

User-facing copy should be mapped separately.

---

## 4. Idempotency

Required for:

- starting attempts where double click is possible,
- completing attempts,
- identity linking,
- consent recording when retried,
- newsletter subscription,
- entity save.

Store or derive idempotency according to existing infrastructure.

---

## 5. Validation

Use a shared schema approach where compatible with the stack.

Validate:

- canonical enum values,
- IDs and ownership,
- quiz version,
- response type,
- maximum array length,
- free-text length,
- locale,
- source context allowlist.

Do not rely only on TypeScript compile-time types.

---

## 6. Caching

Safe to cache:

- active public quiz definition,
- public editorial mappings,
- public content metadata.

Do not publicly cache:

- attempts,
- responses,
- result payloads,
- Passport,
- consent state.

Set framework-specific cache behavior explicitly.

---

## 7. Rate limiting

Consider limits for:

- attempt creation,
- save response abuse,
- completion,
- auth/signup,
- identity linking,
- newsletter,
- save endpoints.

Limits should not cause ordinary quiz completion failures.

---

## 8. Observability

Log:

- operation name,
- request correlation ID,
- controlled error code,
- duration,
- quiz/rule version,
- success/failure.

Do not log:

- raw answers,
- free text,
- email in ordinary logs,
- session token,
- personal result summary.

Metrics:

- completion latency,
- save failure,
- link failure,
- result generation failure,
- authorization denial,
- provider failures.
