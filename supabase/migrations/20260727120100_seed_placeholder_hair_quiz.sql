-- Seed a PLACEHOLDER active hair quiz definition (Essenly Phase 1, M2b-2).
--
-- version 0 = placeholder marker. This is NOT the approved hair taxonomy — the
-- real copy and clinical logic require product + medical review (M3). It mirrors
-- PLACEHOLDER_HAIR_QUIZ in lib/profile/quiz-definition.ts so the persistence
-- path has a real active definition to render, validate, and complete against.
--
-- Canonical discipline (docs/03): value_code is the machine value we store in
-- quiz_responses; content_key is display text. Several option_key <> value_code.
--
-- PUBLISH NOTE: status='active' means quiz_definitions_public_read exposes this
-- definition to the anonymous key (independent of the default-OFF hair_profile
-- UI flag). That is acceptable for non-sensitive placeholder copy; the user-
-- facing quiz stays gated by the flag. To keep it fully dark, change 'active'
-- to 'draft' below and load it with the service-role client instead.
--
-- Idempotent for version 0 (safe to re-run while v0 is the only hair quiz).
-- WARNING: the retire step below demotes ANY active hair version other than 0.
-- Once the approved quiz ships as version 1 (M3), do NOT re-apply this seed — it
-- would retire v1 and re-activate the v0 placeholder in production. The M3
-- migration owns the v0→v1 handoff. Apply via the Supabase dashboard SQL editor,
-- then optionally `supabase migration repair --status applied 20260727120100`.
-- Do NOT blind `db push` (see supabase/migrations/README.md).

do $$
declare
  v_def uuid;
  v_q uuid;
begin
  -- Enforce a single active version per domain (the schema only uniques
  -- (quiz_key, version)): retire any other active hair version first.
  update quiz_definitions
    set status = 'retired', retired_at = now()
    where quiz_key = 'hair' and status = 'active' and version <> 0;

  insert into quiz_definitions
    (quiz_key, version, status, locale_strategy, title_key, description_key, published_at)
  values
    ('hair', 0, 'active', 'single', 'Hair Profile (preview)',
     'A short preview of how the Hair Profile works. This is a placeholder, not medical advice.',
     now())
  on conflict (quiz_key, version) do update
    set status = excluded.status,
        title_key = excluded.title_key,
        description_key = excluded.description_key,
        published_at = excluded.published_at,
        retired_at = null
  returning id into v_def;

  -- intro (info, not answerable)
  insert into quiz_questions
    (quiz_definition_id, question_key, question_type, section_key, position, is_required, allows_multiple, content_key)
  values
    (v_def, 'intro', 'info', null, 0, false, false,
     'This quick preview shows how the Hair Profile works. Your answers stay private, and you''ll see a result before any signup.')
  on conflict (quiz_definition_id, question_key) do update
    set question_type = excluded.question_type, section_key = excluded.section_key,
        position = excluded.position, is_required = excluded.is_required,
        allows_multiple = excluded.allows_multiple, content_key = excluded.content_key;

  -- wash_frequency (single_select)
  insert into quiz_questions
    (quiz_definition_id, question_key, question_type, section_key, position, is_required, allows_multiple, content_key)
  values
    (v_def, 'wash_frequency', 'single_select', 'routine', 1, true, false,
     'How often do you wash your hair?')
  on conflict (quiz_definition_id, question_key) do update
    set question_type = excluded.question_type, section_key = excluded.section_key,
        position = excluded.position, is_required = excluded.is_required,
        allows_multiple = excluded.allows_multiple, content_key = excluded.content_key
  returning id into v_q;
  insert into quiz_options (question_id, option_key, position, content_key, value_code) values
    (v_q, 'daily', 0, 'Every day', 'daily'),
    (v_q, 'alt', 1, 'Every other day', 'every_other_day'),
    (v_q, 'few', 2, 'A few times a week', 'few_times_week'),
    (v_q, 'weekly', 3, 'Weekly or less', 'weekly_or_less')
  on conflict (question_id, option_key) do update
    set position = excluded.position, content_key = excluded.content_key, value_code = excluded.value_code;

  -- concerns (multi_select)
  insert into quiz_questions
    (quiz_definition_id, question_key, question_type, section_key, position, is_required, allows_multiple, content_key)
  values
    (v_def, 'concerns', 'multi_select', 'concerns', 2, true, true,
     'Which of these sound like your hair? (choose any)')
  on conflict (quiz_definition_id, question_key) do update
    set question_type = excluded.question_type, section_key = excluded.section_key,
        position = excluded.position, is_required = excluded.is_required,
        allows_multiple = excluded.allows_multiple, content_key = excluded.content_key
  returning id into v_q;
  insert into quiz_options (question_id, option_key, position, content_key, value_code) values
    (v_q, 'oily_scalp', 0, 'Oily scalp', 'oily_scalp'),
    (v_q, 'dry_ends', 1, 'Dry ends', 'dry_ends'),
    (v_q, 'frizz', 2, 'Frizz', 'frizz'),
    (v_q, 'flat', 3, 'Falls flat / lacks volume', 'lacks_volume'),
    (v_q, 'damage', 4, 'Breakage or damage', 'damage')
  on conflict (question_id, option_key) do update
    set position = excluded.position, content_key = excluded.content_key, value_code = excluded.value_code;

  -- heat (scale 0–5)
  insert into quiz_questions
    (quiz_definition_id, question_key, question_type, section_key, position, is_required, allows_multiple, content_key, help_text_key, validation_json)
  values
    (v_def, 'heat', 'scale', 'styling', 3, true, false,
     'How often do you use heat tools? (0 = never, 5 = daily)',
     'A rough sense is fine.', '{"min":0,"max":5}'::jsonb)
  on conflict (quiz_definition_id, question_key) do update
    set question_type = excluded.question_type, section_key = excluded.section_key,
        position = excluded.position, is_required = excluded.is_required,
        allows_multiple = excluded.allows_multiple, content_key = excluded.content_key,
        help_text_key = excluded.help_text_key, validation_json = excluded.validation_json;

  -- goal (single_select)
  insert into quiz_questions
    (quiz_definition_id, question_key, question_type, section_key, position, is_required, allows_multiple, content_key)
  values
    (v_def, 'goal', 'single_select', 'goal', 4, true, false,
     'What would you most like to improve?')
  on conflict (quiz_definition_id, question_key) do update
    set question_type = excluded.question_type, section_key = excluded.section_key,
        position = excluded.position, is_required = excluded.is_required,
        allows_multiple = excluded.allows_multiple, content_key = excluded.content_key
  returning id into v_q;
  insert into quiz_options (question_id, option_key, position, content_key, value_code) values
    (v_q, 'shine', 0, 'Shine / glass-hair finish', 'shine'),
    (v_q, 'volume', 1, 'More volume', 'volume'),
    (v_q, 'repair', 2, 'Repair damage', 'repair'),
    (v_q, 'scalp', 3, 'A healthier scalp', 'scalp')
  on conflict (question_id, option_key) do update
    set position = excluded.position, content_key = excluded.content_key, value_code = excluded.value_code;
end $$;
