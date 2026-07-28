# 06 — Analytics Event Taxonomy

**Owner:** CMO / Product Analytics
**Technical owner:** Engineering
**Privacy rule:** Never send raw quiz responses or sensitive free text to third-party analytics.

---

## 1. Funnel

```text
Editorial visit
→ Profile CTA viewed
→ Profile CTA clicked
→ Profile selected
→ Quiz started
→ Quiz progressed
→ Quiz completed
→ Result viewed
→ Signup started
→ Signup completed
→ Anonymous result linked
→ Passport viewed
→ Recommendation clicked
→ My Seoul Drop entered
→ Return visit
```

---

## 2. Naming convention

Use lowercase snake case unless the installed analytics convention requires otherwise.

Stable event names are preferred over dynamically generated names.

Common properties:

```text
event_version
anonymous_id or provider anonymous identity
user_id only after permitted identify
session_id
page_path
locale
source_context
profile_domain
quiz_version
experiment_id nullable
timestamp
```

Do not include email in ordinary event payloads.

---

## 3. Events

### Discovery

#### `beauty_profile_cta_viewed`

Properties:

```text
placement
page_type
content_id nullable
profile_domain nullable
```

#### `beauty_profile_cta_clicked`

Same properties plus destination.

#### `beauty_profile_hub_viewed`

Properties:

```text
entry_source
has_skin_profile
has_hair_profile
auth_state
```

### Quiz

#### `profile_quiz_started`

```text
profile_domain
quiz_version
entry_source
auth_state
```

#### `profile_quiz_step_viewed`

```text
profile_domain
quiz_version
step_key
step_index
```

Do not include question response.

#### `profile_quiz_step_completed`

```text
profile_domain
quiz_version
step_key
step_index
validation_error_count
```

#### `profile_quiz_resumed`

```text
profile_domain
quiz_version
resume_age_bucket
auth_state
```

#### `profile_quiz_abandoned`

Where technically measurable without unreliable assumptions:

```text
profile_domain
quiz_version
last_step_key
completion_bucket
```

#### `profile_quiz_completed`

```text
profile_domain
quiz_version
duration_bucket
auth_state
```

### Results

#### `profile_result_viewed`

```text
profile_domain
quiz_version
profile_code
rule_set_version
auth_state
```

`profile_code` must be a non-sensitive controlled taxonomy.

#### `profile_result_reason_expanded`

```text
profile_domain
reason_section
```

#### `profile_save_cta_clicked`

```text
profile_domain
placement
auth_state
```

### Authentication and consent

#### `profile_signup_started`

```text
profile_domain
source
auth_method
```

#### `profile_signup_completed`

```text
profile_domain
source
auth_method
marketing_consent_status
```

Do not send consent document contents.

#### `anonymous_profile_link_completed`

```text
profile_domain
link_method
attempt_count_bucket
```

#### `anonymous_profile_link_failed`

```text
profile_domain
error_code
retryable
```

Error code must not contain personal data.

### Passport

#### `beauty_passport_viewed`

```text
has_skin_profile
has_hair_profile
profile_history_count_bucket
entry_source
```

#### `profile_update_started`

```text
profile_domain
previous_quiz_version
```

#### `profile_history_viewed`

```text
profile_domain
snapshot_count_bucket
```

### Recommendations

#### `profile_recommendation_viewed`

```text
profile_domain
entity_type
entity_id
reason_code
rank
disclosure_type
```

#### `profile_recommendation_clicked`

Same plus destination type.

### My Seoul Drop

#### `my_seoul_drop_gateway_clicked`

```text
source_surface
entity_type nullable
entity_id nullable
auth_state
```

#### `entity_save_clicked`

```text
entity_type
entity_id
source_surface
auth_state
```

### Newsletter

#### `newsletter_signup_started`

```text
source_surface
profile_domain nullable
```

#### `newsletter_signup_completed`

```text
source_surface
profile_domain nullable
consent_version
```

---

## 4. Identity behavior

- Track anonymous sessions before signup.
- On signup, use provider-supported identify/alias.
- Do not merge unrelated devices based only on email typed into a form.
- Keep internal identity linking separate from analytics identity where possible.
- Respect consent mode and regional requirements.

---

## 5. KPIs

Phase 1 primary:

- Profile CTA click-through
- Quiz start rate
- Quiz completion rate
- Result-to-signup rate
- Successful link rate
- Passport first-view rate
- 7/30-day profile user return rate
- Recommendation click-through
- My Seoul Drop gateway rate

Quality guardrails:

- quiz error rate,
- identity link failure rate,
- result page bounce,
- support/privacy complaints,
- editorial page performance regression,
- consent opt-in integrity.

Do not optimize signup rate by hiding results.

---

## 6. Dashboard segmentation

Useful:

- profile domain,
- entry source,
- locale,
- device class,
- new vs returning,
- authenticated vs anonymous,
- quiz version,
- content category.

Avoid sensitive or very small segments that could identify users.

---

## 7. QA

Verify in staging:

- event fires once where expected,
- no raw answer values,
- no email or full URL tokens,
- anonymous identity transitions correctly,
- feature-off state does not emit misleading completion events,
- retries do not inflate completed conversions,
- SPA route changes are tracked correctly.
