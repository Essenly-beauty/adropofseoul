# 03 — Database Schema

**Status:** Logical target model; adapt to the existing repository and database
**Owner:** CTO
**Important:** Do not create every table blindly. Reuse compatible existing models and document the mapping.

---

## 1. Modeling principles

- Use stable internal IDs.
- Keep identity separate from profile data.
- Preserve raw quiz responses.
- Version quiz definitions.
- Treat completed attempts as immutable.
- Create profile snapshots rather than overwriting history.
- Store recommendation reason codes.
- Record consent versions.
- Support anonymous-to-authenticated linking.
- Use authorization and row-level security where supported.
- Store canonical values separately from translated labels.

---

## 2. Core entities

### `users` or existing auth user model

Prefer the auth provider's canonical user table.

Logical fields:

```text
id
email
locale
created_at
updated_at
deleted_at
```

Do not duplicate password or provider identity data.

### `anonymous_identities`

```text
id uuid primary key
token_hash text unique
created_at timestamptz
last_seen_at timestamptz
expires_at timestamptz
linked_user_id nullable
linked_at nullable
metadata jsonb nullable
```

The raw token should not be stored if a hashed representation is sufficient.

### `identity_links`

Use if existing architecture benefits from explicit linking history.

```text
id
anonymous_identity_id
user_id
link_status
linked_at
link_method
idempotency_key
created_at
```

Unique constraints should prevent duplicate attachment.

---

## 3. Quiz definitions

### `quiz_definitions`

```text
id
quiz_key              # skin_profile | hair_profile
version
status                # draft | active | retired
locale_strategy
title_key
description_key
published_at
retired_at
created_at
updated_at
```

Unique: `(quiz_key, version)`

### `quiz_questions`

```text
id
quiz_definition_id
question_key
question_type
section_key
position
is_required
allows_multiple
validation_json
display_logic_json
content_key
help_text_key
created_at
updated_at
```

### `quiz_options`

```text
id
question_id
option_key
position
content_key
value_code
metadata_json
created_at
updated_at
```

Do not use localized display text as the canonical value.

---

## 4. Attempts and responses

### `quiz_attempts`

```text
id
quiz_definition_id
anonymous_identity_id nullable
user_id nullable
status                # in_progress | completed | abandoned | invalidated
started_at
last_saved_at
completed_at nullable
current_step nullable
source_context nullable
idempotency_key nullable
created_at
updated_at
```

Constraint: an attempt must have an anonymous identity, user identity, or both during a controlled link transition.

### `quiz_responses`

```text
id
quiz_attempt_id
question_id
response_json
answered_at
created_at
updated_at
```

Unique: `(quiz_attempt_id, question_id)`

`response_json` must be validated against the question type on the server.

Avoid sending this table's raw values to analytics.

---

## 5. Profile snapshots

### `profile_snapshots`

```text
id
user_id nullable
anonymous_identity_id nullable
quiz_attempt_id
profile_domain        # skin | hair
profile_version
rule_set_version
profile_code
summary_json
traits_json
goals_json
preferences_json
confidence_json nullable
created_at
superseded_at nullable
```

A completed attempt should produce one deterministic snapshot.

### `user_current_profiles`

Optional convenience table if needed:

```text
user_id
profile_domain
profile_snapshot_id
updated_at
```

Unique: `(user_id, profile_domain)`

This pointer may change; snapshots do not.

---

## 6. Recommendation records

### `recommendation_sets`

```text
id
profile_snapshot_id
engine_type           # editorial_rules
engine_version
generated_at
context_json nullable
```

### `recommendation_items`

```text
id
recommendation_set_id
entity_type           # article | product | place | routine | action
entity_id
rank
score nullable
reason_codes text[] or jsonb
reason_detail_json nullable
disclosure_type nullable
created_at
```

The recommendation must remain explainable without reverse-engineering an opaque model.

---

## 7. Content and entity mappings

Reuse existing CMS/content tables where present.

Logical mapping model:

### `profile_content_mappings`

```text
id
profile_domain
trait_code nullable
goal_code nullable
preference_code nullable
content_id
weight
reason_code
status
valid_from nullable
valid_to nullable
created_at
updated_at
```

Equivalent tables may be used for products and places.

---

## 8. Beauty Passport supporting data

### `user_goals`

Optional if goals need independent editing outside quiz snapshots.

```text
id
user_id
domain
goal_code
source
active
created_at
updated_at
```

### `user_preferences`

```text
id
user_id
preference_key
value_json
source
created_at
updated_at
```

Declared data must remain distinguishable from inferred data.

### `saved_entities`

Use if My Seoul Drop save behavior is in the same data model.

```text
id
user_id
entity_type
entity_id
collection_id nullable
source_context nullable
created_at
```

Unique policy should be defined for duplicate saves.

---

## 9. Consent

### `consent_documents`

```text
id
consent_type          # terms | privacy | marketing
version
locale
effective_at
content_reference
created_at
```

### `consent_records`

```text
id
user_id nullable
anonymous_identity_id nullable
consent_document_id
status                # granted | withdrawn
recorded_at
source
metadata_json nullable
```

Do not represent optional marketing consent as acceptance of terms.

---

## 10. Analytics identity bridge

Prefer the analytics provider's supported identify/alias mechanism. If an internal bridge is required:

### `analytics_identity_links`

```text
id
anonymous_identity_id
user_id
provider
linked_at
provider_reference nullable
```

Do not place raw profile responses here.

---

## 11. Suggested indexes

Adapt to actual query patterns:

- active quiz by key/version
- attempts by anonymous identity/status
- attempts by user/status
- responses by attempt
- snapshots by user/domain/date
- current profile by user/domain
- recommendations by snapshot/rank
- mappings by domain/trait/goal/status
- consents by user/type/date
- saves by user/entity type/date

---

## 12. Authorization matrix

| Resource                |        Anonymous owner |   Authenticated owner |   Staff/editor |         Public |
| ----------------------- | ---------------------: | --------------------: | -------------: | -------------: |
| Active quiz definition  |                   Read |                  Read | Manage by role |           Read |
| Own in-progress attempt |             Read/write |            Read/write |  No by default |             No |
| Own completed attempt   |                   Read |                  Read |  No by default |             No |
| Own raw responses       | Read by product policy |                  Read |  No by default |             No |
| Own profile snapshot    |                   Read |                  Read |  No by default |             No |
| Editorial mapping       |            Read output |           Read output | Manage by role | No direct need |
| Public article          |                   Read |                  Read | Manage by role |           Read |
| Consent record          |                Limited | Read/write withdrawal |     Restricted |             No |

Staff access to personal profile data must not be added merely for convenience.

---

## 13. Migration sequence

Suggested only:

1. Quiz definitions/questions/options
2. Anonymous identities
3. Attempts/responses
4. Profile snapshots/current pointers
5. Consent documents/records
6. Recommendation sets/items
7. Editorial mappings
8. Saves/gateway support if in scope

For each migration:

- inspect existing equivalents,
- include safe defaults,
- avoid dropping existing columns,
- backfill only with explicit logic,
- document rollback or recovery.

---

## 14. Data retention and deletion

Final policy requires legal review. Technical design should support:

- expiration of abandoned anonymous attempts,
- unlinking or deletion of anonymous identity,
- account deletion,
- removal or anonymization of profile and behavioral records,
- consent history retention as legally required,
- export of declared profile data.

Add `[LEGAL REVIEW REQUIRED]` where policy is not final.
