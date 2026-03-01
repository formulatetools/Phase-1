# New Worksheet Audit Checklist

Run through this checklist whenever a new curated worksheet is added to the platform (via migration, admin panel, or library submission).

## 1. Repeatable (Multi-Entry Diary Mode)

**Question:** Is this worksheet designed to be filled in multiple times across days, sessions, or episodes?

### Always set `repeatable: true` + `max_entries: 7`

- Thought records (any column count)
- Mood / emotion diaries and monitoring worksheets
- Sleep diaries and trackers
- Activity monitoring and scheduling worksheets
- Behavioural experiment worksheets
- Exposure / ERP practice records
- Food / eating logs and diaries
- Pain monitoring diaries
- Panic diaries
- Symptom diaries (PTSD, OCD, BDD, health anxiety, etc.)
- Practice logs (relaxation, mindfulness, attention training, etc.)
- Reassurance-seeking / checking reduction logs
- Social situation records
- Session belief trackers
- Weight monitoring worksheets
- Worry diaries
- Any worksheet with "diary", "log", "record", "monitor", or "tracker" in the title

### Never set `repeatable: true`

- Formulations (any layout)
- Safety plans
- Exposure hierarchies and ladders
- One-off assessments, checklists, and surveys
- Cost-benefit analyses
- Psychoeducation worksheets
- Relapse prevention plans and blueprints
- Goal-setting worksheets
- Letters (compassionate letter, etc.)
- Pie charts and continuum worksheets

### How to apply

**In a migration:**

```sql
UPDATE worksheets
SET schema = schema || '{"repeatable": true, "max_entries": 7}'::jsonb
WHERE id = '<worksheet-id>'
  AND (schema->>'repeatable' IS NULL OR schema->>'repeatable' = 'false');
```

**In the admin panel:** Set `repeatable: true` and `max_entries: 7` in the schema JSON.

**AI-generated worksheets:** The generate and import prompts already auto-detect this. Review the output to confirm correctness.

---

## 2. Schema Quality Checks

- [ ] All field IDs are unique and use kebab-case
- [ ] All fields have a non-empty `label`
- [ ] Likert fields have `anchors` for min and max values
- [ ] Tables have at least 2 columns and `min_rows: 1`
- [ ] Formulation fields use the correct layout and domain colours
- [ ] Placeholders are realistic clinical examples, not generic "enter here" text
- [ ] British English throughout (behaviour, formulation, organisation, recognise)
- [ ] No personally identifiable information in placeholders or labels
- [ ] `estimated_minutes` is set and reasonable
- [ ] Tags include therapy type, technique, and relevant disorder

## 3. Metadata Checks

- [ ] Title is clear and clinically meaningful
- [ ] Description is 1-2 sentences explaining the tool's purpose
- [ ] Instructions tell the user how to complete it
- [ ] Slug is URL-friendly and unique
- [ ] Category/tags are appropriate

## 4. Mobile & Accessibility

- [ ] No tables wider than 4 columns (renders poorly on mobile)
- [ ] Form is completable on a phone screen
- [ ] All interactive elements have visible labels

---

## Automation

The AI worksheet generator (`src/lib/ai/generate-prompt.ts`) and importer (`src/lib/ai/import-prompt.ts`) both include rules for auto-detecting `repeatable` status. When reviewing AI-generated worksheets, verify the flag is correct.

## Reference migration

See `supabase/migrations/00029_repeatable_diary_worksheets.sql` for the batch update that enabled `repeatable` on all existing diary/log worksheets.
