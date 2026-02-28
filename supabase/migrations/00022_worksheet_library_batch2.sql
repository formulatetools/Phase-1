-- ============================================================================
-- FORMULATE — Batch 2: A2 High-Priority Extensions (~33 Worksheets)
-- ============================================================================
-- Run AFTER Batch 1 is live. Single transaction.
-- ============================================================================

BEGIN;

-- ============================================================================
-- CROSSWALK & CONSOLIDATION DECISIONS
-- ============================================================================
--
-- OVERWRITES (existing slug, enhanced schema):
--   activity-mood-diary             →  D2  Activity Monitoring Diary
--   behavioural-activation-schedule →  D3  Activity & Mood Diary (Mastery/Pleasure)
--   worry-log                       →  G3  Worry Diary with Postponement Log
--   erp-practice-record             →  O3  ERP Homework Log
--   health-anxiety-monitoring-log   →  H2  Health Anxiety Monitoring Diary
--
-- SKIPPED (covered by Batch 1 transdiagnostic tools):
--   D8 (Depression Thought Record)  →  Existing 5/7-column thought records suffice
--   P5 (Agoraphobia Hierarchy)      →  T8 (graded-exposure-hierarchy) with panic context
--
-- MERGED:
--   Bi3 + Bi4 → Single "Bipolar Early Warning Signs & Action Plan"
--     (T11 is transdiagnostic; bipolar needs mood-polarity-specific content)
--
-- UNTOUCHED (exist, not in Batch 2):
--   5-column-thought-record, 7-column-thought-record,
--   cognitive-distortions-checklist, values-assessment,
--   cross-sectional-formulation, longitudinal-formulation,
--   safety-plan, social-situation-record, tolerating-uncertainty-practice,
--   erp-hierarchy-builder, worry-decision-tree, trauma-impact-statement,
--   grounding-techniques-practice, low-self-esteem-formulation
--
-- FINAL COUNT: 33 worksheets (5 overwrite + 28 new)
-- ============================================================================


-- ============================================================================
-- 1. NEW CATEGORIES
-- ============================================================================

INSERT INTO categories (id, name, slug, icon, display_order)
VALUES
  (gen_random_uuid(), 'Eating Disorders', 'eating-disorders', 'utensils', 10),
  (gen_random_uuid(), 'Insomnia / Sleep', 'insomnia-sleep', 'moon', 11),
  (gen_random_uuid(), 'Bipolar Disorder', 'bipolar-disorder', 'trending-up', 12),
  (gen_random_uuid(), 'Personality & Schema Work', 'personality-schema-work', 'layers', 13)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 2. DELETE WORKSHEETS BEING OVERWRITTEN
-- ============================================================================

DELETE FROM worksheets WHERE slug IN (
  'activity-mood-diary',
  'behavioural-activation-schedule',
  'worry-log',
  'erp-practice-record',
  'health-anxiety-monitoring-log'
);


-- ============================================================================
-- 3. DEPRESSION (D2, D3, D4)
-- ============================================================================

-- D2: Activity Monitoring Diary (overwrites activity-mood-diary)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Activity Monitoring Diary',
  'activity-mood-diary',
  'Track activities hour by hour alongside mood to identify patterns linking what you do to how you feel.',
  'For the next week, record what you do each day and rate your mood at regular intervals. Don''t try to change anything yet — just observe. This baseline helps you and your therapist spot patterns: which activities lift your mood, which lower it, and when the difficult times tend to be.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "context",
      "title": "Monitoring Period",
      "fields": [
        { "id": "start-date", "type": "date", "label": "Start date", "required": true },
        { "id": "goal", "type": "textarea", "label": "What are you hoping to learn from monitoring?", "placeholder": "e.g. I want to see whether staying in bed all morning actually makes me feel worse" }
      ]
    },
    {
      "id": "log",
      "title": "Activity Log",
      "fields": [
        {
          "id": "activity-table",
          "type": "table",
          "label": "Hourly activity and mood",
          "columns": [
            { "id": "day", "header": "Day", "type": "text", "width": "narrow" },
            { "id": "time", "header": "Time", "type": "text", "width": "narrow" },
            { "id": "activity", "header": "Activity", "type": "textarea" },
            { "id": "who-with", "header": "With Whom", "type": "text" },
            { "id": "mood", "header": "Mood (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 1,
          "max_rows": 28
        },
        {
          "id": "avg-mood",
          "type": "computed",
          "label": "Average mood",
          "computation": { "operation": "average", "field": "activity-table.mood" }
        }
      ]
    },
    {
      "id": "reflection",
      "title": "What Did You Notice?",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns can you see between activity and mood?", "placeholder": "When was your mood highest? Lowest? What were you doing at those times?" },
        { "id": "surprises", "type": "textarea", "label": "Was anything surprising?", "placeholder": "Did any activity affect your mood differently than you expected?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['activity monitoring', 'depression', 'CBT', 'behavioural activation', 'mood diary', 'baseline'],
  10, 2, true, 1
);


-- D3: Activity & Mood Diary with Mastery/Pleasure (overwrites behavioural-activation-schedule)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Behavioural Activation Schedule',
  'behavioural-activation-schedule',
  'Plan and rate activities with mastery and pleasure scores to gradually rebuild a rewarding routine.',
  'Behavioural activation works by scheduling activities that give you a sense of achievement (mastery) or enjoyment (pleasure), even when your mood tells you not to bother. Plan activities in advance, then rate how they went. Over time, the data shows that doing more leads to feeling better — breaking the depression cycle of withdrawal and inactivity.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "schedule",
      "title": "Activity Schedule",
      "fields": [
        {
          "id": "activity-table",
          "type": "table",
          "label": "Planned and actual activities with ratings",
          "columns": [
            { "id": "day", "header": "Day", "type": "text", "width": "narrow" },
            { "id": "time", "header": "Time", "type": "text", "width": "narrow" },
            { "id": "planned", "header": "Planned Activity", "type": "textarea" },
            { "id": "actual", "header": "What I Actually Did", "type": "textarea" },
            { "id": "pleasure", "header": "Pleasure (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "mastery", "header": "Mastery (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 1,
          "max_rows": 28
        },
        {
          "id": "avg-pleasure",
          "type": "computed",
          "label": "Average pleasure",
          "computation": { "operation": "average", "field": "activity-table.pleasure" }
        },
        {
          "id": "avg-mastery",
          "type": "computed",
          "label": "Average mastery",
          "computation": { "operation": "average", "field": "activity-table.mastery" }
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Review",
      "fields": [
        { "id": "highest-pleasure", "type": "textarea", "label": "Which activities gave the most pleasure?", "placeholder": "Even small moments count" },
        { "id": "highest-mastery", "type": "textarea", "label": "Which activities gave the most sense of achievement?", "placeholder": "What did you manage despite not feeling like it?" },
        { "id": "next-week", "type": "textarea", "label": "What will you schedule more of next week?", "placeholder": "Build on what worked" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['behavioural activation', 'depression', 'CBT', 'activity scheduling', 'mastery', 'pleasure'],
  20, 3, true, 1
);


-- D4: Downward Arrow / Assumptions Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Downward Arrow Worksheet',
  'downward-arrow-worksheet',
  'Trace a negative automatic thought down through underlying assumptions to the core belief using the "what would that mean?" technique.',
  'Start with a specific negative automatic thought (NAT) from a recent situation. Then ask: "If that were true, what would that mean about me / the situation / the future?" Record each answer and ask the question again, going deeper each time. You''ll typically reach a core belief within 4–6 steps. This helps identify the beliefs that therapy needs to target.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "situation",
      "title": "Starting Point",
      "fields": [
        { "id": "situation", "type": "textarea", "label": "Situation that triggered the thought", "placeholder": "e.g. My manager didn't reply to my email for two days", "required": true },
        { "id": "nat", "type": "textarea", "label": "Negative automatic thought (NAT)", "placeholder": "e.g. She's ignoring me because my work wasn't good enough" }
      ]
    },
    {
      "id": "arrow",
      "title": "Downward Arrow",
      "description": "For each thought, ask: \"If that were true, what would that mean?\"",
      "fields": [
        {
          "id": "arrow-table",
          "type": "table",
          "label": "Downward arrow chain",
          "columns": [
            { "id": "level", "header": "#", "type": "text", "width": "narrow" },
            { "id": "thought", "header": "If that were true, what would it mean?", "type": "textarea" },
            { "id": "belief-type", "header": "Level", "type": "text" }
          ],
          "min_rows": 3,
          "max_rows": 8
        }
      ]
    },
    {
      "id": "core-belief",
      "title": "Core Belief Identified",
      "highlight": "amber",
      "fields": [
        { "id": "belief", "type": "textarea", "label": "What core belief did you reach?", "placeholder": "e.g. I'm not good enough, I'm unlovable, I'm a failure" },
        { "id": "conviction", "type": "likert", "label": "How strongly do you believe this right now? (0–100%)", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" } },
        { "id": "rules", "type": "textarea", "label": "What rules or assumptions protect you from this belief?", "placeholder": "e.g. If I work harder than everyone else, maybe I'll be good enough. If I don't let people close, they can't reject me." }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['downward arrow', 'core beliefs', 'assumptions', 'depression', 'CBT', 'cognitive restructuring'],
  15, 4, true, 1
);


-- ============================================================================
-- 4. GAD (G2, G3, G4, G5)
-- ============================================================================

-- G2: Worry Classification Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Worry Classification Worksheet',
  'worry-classification-worksheet',
  'Learn to distinguish between practical worries (that you can act on) and hypothetical worries (that are about "what if") to respond differently to each.',
  'Not all worries are the same. Practical worries are about real, current problems you can do something about. Hypothetical worries are about things that might happen — often starting with "what if." This matters because the two types need different responses: practical worries benefit from problem-solving, while hypothetical worries need to be noticed and let go. Practise sorting your worries to build this skill.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "worries",
      "title": "Worry Classification",
      "fields": [
        {
          "id": "worry-table",
          "type": "table",
          "label": "Sort each worry into its type",
          "columns": [
            { "id": "worry", "header": "Worry", "type": "textarea" },
            { "id": "type", "header": "Type 1 (Practical) or Type 2 (Hypothetical)?", "type": "text" },
            { "id": "evidence", "header": "How Do You Know?", "type": "textarea" },
            { "id": "response", "header": "Appropriate Response", "type": "textarea" }
          ],
          "min_rows": 3,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "proportion", "type": "textarea", "label": "What proportion of your worries are hypothetical vs practical?", "placeholder": "Most people find the majority are hypothetical — what if worries that can't be solved by action" },
        { "id": "learning", "type": "textarea", "label": "What does this tell you about your worry habit?", "placeholder": "If most worries are hypothetical, what does that suggest about the strategy of trying to solve them?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['worry', 'GAD', 'CBT', 'metacognitive', 'Wells', 'Type 1', 'Type 2', 'worry classification'],
  10, 2, true, 1
);


-- G3: Worry Diary with Postponement Log (overwrites worry-log)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Worry Diary with Postponement Log',
  'worry-log',
  'Track worries as they occur, classify them, practise postponing hypothetical worries to a designated worry period, and record outcomes.',
  'When you notice yourself worrying, jot it down here. Classify whether it''s practical or hypothetical. If it''s hypothetical, practise postponing it to your designated worry period (e.g. 5:00–5:15pm). Note whether you successfully postponed and what happened — most postponed worries feel less urgent by the time the worry period arrives.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "setup",
      "title": "Worry Period",
      "fields": [
        { "id": "worry-time", "type": "text", "label": "My designated worry period is:", "placeholder": "e.g. 5:00–5:15pm at the kitchen table" }
      ]
    },
    {
      "id": "diary",
      "title": "Worry Log",
      "fields": [
        {
          "id": "worry-record",
          "type": "record",
          "label": "Worry Entry",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "worry",
              "header": "The Worry",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date / time" },
                { "id": "content", "type": "textarea", "placeholder": "What were you worrying about?" }
              ]
            },
            {
              "id": "classification",
              "header": "Type",
              "width": "narrow",
              "fields": [
                { "id": "type", "type": "select", "label": "Worry type", "options": [
                  { "id": "practical", "label": "Practical (can act now)" },
                  { "id": "hypothetical", "label": "Hypothetical (what if)" }
                ]},
                { "id": "intensity", "type": "likert", "label": "Intensity (0–100)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "postponement",
              "header": "Postponement",
              "width": "normal",
              "fields": [
                { "id": "postponed", "type": "select", "label": "Did you postpone?", "options": [
                  { "id": "yes", "label": "Yes — saved for worry period" },
                  { "id": "partially", "label": "Partially — some engagement" },
                  { "id": "no", "label": "No — engaged with the worry" }
                ]},
                { "id": "outcome", "type": "textarea", "placeholder": "By the worry period, how important did this feel?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Reflection",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What did you notice about your postponed worries?", "placeholder": "How many still felt urgent by the worry period? What does that tell you?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['worry diary', 'GAD', 'CBT', 'metacognitive', 'Wells', 'worry postponement', 'stimulus control'],
  10, 3, true, 1
);


-- G4: Metacognitive Beliefs Worksheet (Positive)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Positive Meta-Beliefs About Worry',
  'positive-meta-beliefs-worry',
  'Identify and challenge positive beliefs about worrying — the beliefs that keep you worrying because you think it helps.',
  'One reason people keep worrying is that they believe it''s useful: "Worrying helps me prepare," "If I worry, bad things are less likely to happen." These positive meta-beliefs make worry feel necessary and hard to give up. This worksheet helps you identify your positive beliefs about worry, examine the evidence, and design experiments to test whether worry actually delivers what it promises.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "beliefs",
      "title": "My Positive Beliefs About Worry",
      "fields": [
        {
          "id": "beliefs-table",
          "type": "table",
          "label": "What do you believe worrying does for you?",
          "columns": [
            { "id": "belief", "header": "Positive Belief About Worry", "type": "textarea" },
            { "id": "conviction", "header": "Conviction (0–100%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "evidence-for", "header": "Evidence This Is True", "type": "textarea" },
            { "id": "evidence-against", "header": "Evidence This Is Not True", "type": "textarea" }
          ],
          "min_rows": 2,
          "max_rows": 6
        }
      ]
    },
    {
      "id": "experiment",
      "title": "Testing a Positive Meta-Belief",
      "fields": [
        { "id": "target-belief", "type": "textarea", "label": "Which belief will you test?", "placeholder": "e.g. Worrying helps me prepare for meetings" },
        { "id": "experiment-plan", "type": "textarea", "label": "How will you test it?", "placeholder": "e.g. Prepare for one meeting with worry, one without — compare outcomes" },
        { "id": "result", "type": "textarea", "label": "What happened?", "placeholder": "Was the outcome different when you didn't worry?" },
        { "id": "revised-conviction", "type": "likert", "label": "Conviction in the belief now (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['metacognitive beliefs', 'GAD', 'CBT', 'Wells', 'positive beliefs about worry', 'behavioural experiment'],
  15, 4, true, 1
);


-- G5: Metacognitive Beliefs Worksheet (Negative)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Negative Meta-Beliefs About Worry',
  'negative-meta-beliefs-worry',
  'Identify and challenge negative beliefs about worry — the beliefs that worry is uncontrollable or dangerous.',
  'Negative meta-beliefs are what turn ordinary worry into meta-worry (Type 2 worry): "I can''t control my worrying," "Worrying could damage my brain," "If I start worrying I won''t be able to stop." These beliefs create anxiety about anxiety itself. This worksheet helps you identify these beliefs, examine the evidence, and run experiments to discover that worry is neither uncontrollable nor dangerous.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "beliefs",
      "title": "My Negative Beliefs About Worry",
      "fields": [
        {
          "id": "beliefs-table",
          "type": "table",
          "label": "What do you believe about the dangers or uncontrollability of worry?",
          "columns": [
            { "id": "belief", "header": "Negative Belief About Worry", "type": "textarea" },
            { "id": "conviction", "header": "Conviction (0–100%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "evidence-for", "header": "Evidence This Is True", "type": "textarea" },
            { "id": "evidence-against", "header": "Evidence This Is Not True", "type": "textarea" }
          ],
          "min_rows": 2,
          "max_rows": 6
        }
      ]
    },
    {
      "id": "experiment",
      "title": "Testing a Negative Meta-Belief",
      "fields": [
        { "id": "target-belief", "type": "textarea", "label": "Which belief will you test?", "placeholder": "e.g. If I start worrying, I won't be able to stop" },
        { "id": "experiment-plan", "type": "textarea", "label": "How will you test it?", "placeholder": "e.g. Deliberately worry for 5 minutes, then try to stop and shift attention — what happens?" },
        { "id": "result", "type": "textarea", "label": "What happened?", "placeholder": "Were you able to stop? What does this tell you about controllability?" },
        { "id": "revised-conviction", "type": "likert", "label": "Conviction in the belief now (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['metacognitive beliefs', 'GAD', 'CBT', 'Wells', 'negative beliefs about worry', 'uncontrollability', 'danger', 'Type 2 worry'],
  15, 5, true, 1
);


-- ============================================================================
-- 5. PANIC (P3)
-- ============================================================================

-- P3: Panic Thought Challenging Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'panic-disorder'),
  'Panic Thought Challenging Worksheet',
  'panic-thought-challenging',
  'Challenge catastrophic misinterpretations of body sensations by examining evidence and generating realistic alternatives.',
  'During a panic episode, you misinterpret normal body sensations as signs of something catastrophic. This worksheet helps you examine those misinterpretations after the fact: what sensation did you notice, what did you think it meant, what is the evidence for and against that interpretation, and what is a more realistic explanation? Over time, this weakens the automatic catastrophic link.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "records",
      "title": "Thought Challenging Records",
      "fields": [
        {
          "id": "panic-thought-record",
          "type": "record",
          "label": "Catastrophic Thought Challenge",
          "min_records": 1,
          "max_records": 10,
          "groups": [
            {
              "id": "sensation",
              "header": "Body Sensation",
              "width": "normal",
              "fields": [
                { "id": "what-felt", "type": "textarea", "placeholder": "What sensation did you notice? e.g. Heart racing, dizzy, breathless" }
              ]
            },
            {
              "id": "misinterpretation",
              "header": "Catastrophic Thought",
              "width": "normal",
              "fields": [
                { "id": "thought", "type": "textarea", "placeholder": "What did you think was happening? e.g. I'm having a heart attack" },
                { "id": "belief-before", "type": "likert", "label": "Belief %", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "evidence",
              "header": "Evidence",
              "width": "normal",
              "fields": [
                { "id": "for", "type": "textarea", "placeholder": "Evidence FOR the catastrophe" },
                { "id": "against", "type": "textarea", "placeholder": "Evidence AGAINST (e.g. GP checks, past episodes, how long it lasted)" }
              ]
            },
            {
              "id": "alternative",
              "header": "Realistic Alternative",
              "width": "normal",
              "fields": [
                { "id": "alternative-thought", "type": "textarea", "placeholder": "What is a more likely explanation for the sensation?" },
                { "id": "belief-after", "type": "likert", "label": "Belief in catastrophe now %", "min": 0, "max": 100, "step": 5 }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Do you tend to misinterpret the same sensations? What's the most common alternative explanation?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['panic', 'thought challenging', 'CBT', 'Clark', 'catastrophic misinterpretation', 'cognitive restructuring'],
  15, 4, true, 1
);


-- ============================================================================
-- 6. SOCIAL ANXIETY (S2, S4)
-- ============================================================================

-- S2: Self-Image Identification Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Self-Image Identification Worksheet',
  'self-image-identification',
  'Identify the distorted observer-perspective self-image that drives social anxiety — the "felt sense" of how you appear to others.',
  'In social anxiety, you construct an image of yourself from the observer''s perspective — seeing yourself as if from the outside. This image is based on how you feel, not how you actually appear, and is usually much more negative than reality. This worksheet helps you capture that internal self-image in detail so it can be tested with video feedback and other experiments.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "situation",
      "title": "Social Situation",
      "fields": [
        { "id": "situation", "type": "textarea", "label": "What social situation are you thinking about?", "placeholder": "e.g. Work presentation, meeting new people, eating in public", "required": true },
        { "id": "worst-fear", "type": "textarea", "label": "What do you most fear others will think of you?", "placeholder": "e.g. That I'm boring, incompetent, visibly anxious, weird" }
      ]
    },
    {
      "id": "self-image",
      "title": "The Internal Self-Image",
      "description": "Close your eyes and imagine yourself in the situation. Describe what you \"see\" from the observer's perspective.",
      "fields": [
        { "id": "visual", "type": "textarea", "label": "What do you look like?", "placeholder": "e.g. Face bright red, hands shaking, hunched over, sweating visibly, looking at the floor" },
        { "id": "voice", "type": "textarea", "label": "What do you sound like?", "placeholder": "e.g. Voice trembling, speaking too quietly, stumbling over words, long pauses" },
        { "id": "impression", "type": "textarea", "label": "What impression do you give?", "placeholder": "e.g. Incompetent, anxious wreck, boring, someone who doesn't belong" },
        { "id": "image-vividness", "type": "likert", "label": "How vivid is this image? (0–100)", "min": 0, "max": 100, "step": 5 },
        { "id": "image-belief", "type": "likert", "label": "How much do you believe this image is accurate? (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "source",
      "title": "Where Does This Image Come From?",
      "fields": [
        { "id": "earliest-memory", "type": "textarea", "label": "What is the earliest memory linked to this self-image?", "placeholder": "e.g. Being laughed at during a school presentation, being told I was boring" },
        { "id": "source-link", "type": "textarea", "label": "How does that experience connect to the image you hold now?", "placeholder": "How might that early experience have shaped the image you carry into social situations today?" }
      ]
    },
    {
      "id": "testing",
      "title": "How Could You Test This Image?",
      "fields": [
        { "id": "test-ideas", "type": "textarea", "label": "What experiment could help you check whether the image is accurate?", "placeholder": "e.g. Video feedback, asking a trusted friend what they actually see, dropping a safety behaviour and observing the result" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'self-image', 'Clark', 'Wells', 'CBT', 'observer perspective', 'self-focused attention'],
  20, 3, true, 1
);


-- S4: Post-Event Processing Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Post-Event Processing Log',
  'post-event-processing-log',
  'Monitor and challenge the post-mortem rumination that follows social situations — a key maintenance factor in social anxiety.',
  'After a social situation, people with social anxiety often conduct a detailed "post-mortem" — replaying the event, focusing on moments that felt awkward, and concluding it went worse than it actually did. This maintains anxiety by strengthening the negative self-image. Use this log to catch the rumination, identify the biases in it, and develop a more balanced perspective.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "records",
      "title": "Post-Event Processing Records",
      "fields": [
        {
          "id": "pep-record",
          "type": "record",
          "label": "Post-Event Processing Entry",
          "min_records": 1,
          "max_records": 10,
          "groups": [
            {
              "id": "situation",
              "header": "Situation",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "event", "type": "textarea", "placeholder": "What social situation are you replaying?" }
              ]
            },
            {
              "id": "rumination",
              "header": "What I Keep Replaying",
              "width": "normal",
              "fields": [
                { "id": "content", "type": "textarea", "placeholder": "What specific moments do you keep going over?" },
                { "id": "conclusion", "type": "textarea", "placeholder": "What conclusion are you drawing? e.g. It was a disaster, they think I'm an idiot" }
              ]
            },
            {
              "id": "biases",
              "header": "Biases",
              "width": "normal",
              "fields": [
                { "id": "bias-check", "type": "checklist", "label": "Which biases are at play?", "options": [
                  { "id": "feeling-based", "label": "Feeling-based reasoning (I felt anxious so it must have gone badly)" },
                  { "id": "selective", "label": "Selective focus (zooming in on one awkward moment)" },
                  { "id": "mind-reading", "label": "Mind-reading (assuming I know what others thought)" },
                  { "id": "discounting", "label": "Discounting positives (ignoring moments that went fine)" },
                  { "id": "self-image", "label": "Using the felt self-image rather than evidence" }
                ]}
              ]
            },
            {
              "id": "balanced",
              "header": "Balanced View",
              "width": "normal",
              "fields": [
                { "id": "evidence", "type": "textarea", "placeholder": "What actually happened? Include the parts that went OK." },
                { "id": "balanced-conclusion", "type": "textarea", "placeholder": "What would a friend say about how it went?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "pattern", "type": "textarea", "label": "What do you notice about your post-event processing?", "placeholder": "How often does the rumination match reality? Which biases come up most?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'post-event processing', 'rumination', 'CBT', 'Clark', 'Wells', 'cognitive biases'],
  15, 4, true, 1
);


-- ============================================================================
-- 7. OCD (O2, O3, O4)
-- ============================================================================

-- O2: OCD Monitoring Diary
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'),
  'OCD Monitoring Diary',
  'ocd-monitoring-diary',
  'Track OCD episodes — intrusions, appraisals, rituals, distress, and duration — to identify patterns and measure progress.',
  'Record each significant OCD episode as close to the time as possible. Note the intrusive thought or urge, what it meant to you (the appraisal), what you did in response (ritual, avoidance, or resisting), how distressed you felt, and how long the episode lasted. Over time, this reveals your most common triggers and whether distress is reducing.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "diary",
      "title": "OCD Episode Log",
      "fields": [
        {
          "id": "ocd-record",
          "type": "record",
          "label": "OCD Episode",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "trigger",
              "header": "Trigger & Intrusion",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date / time" },
                { "id": "trigger", "type": "textarea", "placeholder": "What triggered the episode?" },
                { "id": "intrusion", "type": "textarea", "placeholder": "What was the intrusive thought, image, or urge?" }
              ]
            },
            {
              "id": "appraisal",
              "header": "Appraisal",
              "width": "normal",
              "fields": [
                { "id": "meaning", "type": "textarea", "placeholder": "What did you think it meant? e.g. If I don't check, something bad will happen" },
                { "id": "distress", "type": "likert", "label": "Distress (0–100)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "response",
              "header": "Response",
              "width": "normal",
              "fields": [
                { "id": "ritual", "type": "textarea", "placeholder": "What did you do? (ritual, avoidance, reassurance, mental reviewing, resisted?)" },
                { "id": "duration", "type": "text", "placeholder": "How long did the episode last?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Patterns",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Common triggers? Most frequent appraisals? Are rituals getting shorter or less frequent?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['OCD', 'monitoring diary', 'CBT', 'Salkovskis', 'intrusions', 'rituals', 'compulsions'],
  10, 2, true, 1
);


-- O3: ERP Homework Log (overwrites erp-practice-record)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'),
  'ERP Practice Record',
  'erp-practice-record',
  'Log exposure and response prevention practice sessions with SUDS ratings, urge strength, and whether you resisted the compulsion.',
  'After each ERP practice, record the exposure you did, your anxiety and compulsion urge ratings, whether you successfully prevented the ritual, and what you learned. Tracking your ERP practice helps you see that anxiety reduces without performing the ritual, building evidence that you can tolerate the discomfort.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "records",
      "title": "ERP Practice Log",
      "fields": [
        {
          "id": "erp-record",
          "type": "record",
          "label": "ERP Practice Entry",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "exposure",
              "header": "Exposure",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "what", "type": "textarea", "placeholder": "What exposure did you do?" },
                { "id": "target-obsession", "type": "textarea", "placeholder": "What obsession / intrusion does this target?" }
              ]
            },
            {
              "id": "ratings",
              "header": "Ratings",
              "width": "narrow",
              "fields": [
                { "id": "suds-peak", "type": "likert", "label": "Peak anxiety (SUDS)", "min": 0, "max": 100, "step": 5 },
                { "id": "urge", "type": "likert", "label": "Urge to ritualise (0–100)", "min": 0, "max": 100, "step": 5 },
                { "id": "suds-end", "type": "likert", "label": "Anxiety at end", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "response-prevention",
              "header": "Response Prevention",
              "width": "normal",
              "fields": [
                { "id": "resisted", "type": "select", "label": "Did you prevent the ritual?", "options": [
                  { "id": "fully", "label": "Fully — no ritual" },
                  { "id": "mostly", "label": "Mostly — partial ritual" },
                  { "id": "no", "label": "No — completed ritual" }
                ]},
                { "id": "what-happened", "type": "textarea", "placeholder": "What happened? Did the feared outcome occur?" }
              ]
            },
            {
              "id": "learning",
              "header": "Learning",
              "width": "normal",
              "fields": [
                { "id": "learned", "type": "textarea", "placeholder": "What did you learn from this practice?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Progress",
      "fields": [
        { "id": "progress", "type": "textarea", "label": "What progress are you noticing across your ERP practice?", "placeholder": "Is peak anxiety reducing? Are urges becoming more manageable? Are you resisting more consistently?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['ERP', 'OCD', 'CBT', 'exposure', 'response prevention', 'compulsions', 'rituals'],
  10, 3, true, 1
);


-- O4: Responsibility Appraisal Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'),
  'Responsibility Appraisal Worksheet',
  'ocd-responsibility-appraisal',
  'Challenge inflated responsibility beliefs that drive OCD by examining the appraisal and generating realistic alternatives.',
  'OCD often relies on an inflated sense of responsibility: "If I don''t check, and something bad happens, it will be my fault." This worksheet helps you identify the responsibility appraisal behind a specific obsession, examine whether the level of responsibility you''re assigning is realistic, and consider what you would say to a friend in the same situation.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "obsession",
      "title": "The Obsession",
      "fields": [
        { "id": "intrusion", "type": "textarea", "label": "What was the intrusive thought, image, or urge?", "placeholder": "e.g. What if I left the cooker on and the house burns down?", "required": true },
        { "id": "responsibility-belief", "type": "textarea", "label": "What responsibility are you assigning yourself?", "placeholder": "e.g. If the house burns down, it will be entirely my fault because I should have checked" },
        { "id": "responsibility-rating", "type": "likert", "label": "How responsible do you feel? (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "challenging",
      "title": "Challenging the Appraisal",
      "fields": [
        { "id": "friend-test", "type": "textarea", "label": "If a friend told you they had this thought, what would you say?", "placeholder": "Would you hold them to the same standard of responsibility?" },
        { "id": "probability", "type": "textarea", "label": "What is the realistic probability of the feared outcome?", "placeholder": "How many times have you had this worry? How many times has the feared event actually happened?" },
        { "id": "other-factors", "type": "textarea", "label": "What other factors could be responsible if it did happen?", "placeholder": "e.g. The cooker manufacturer, the gas company, fire safety regulations, chance" },
        { "id": "thought-action", "type": "textarea", "label": "Does thinking about it make it more likely to happen?", "placeholder": "Is there a difference between thinking something and doing it?" }
      ]
    },
    {
      "id": "reflection",
      "title": "Revised View",
      "fields": [
        { "id": "realistic-responsibility", "type": "textarea", "label": "What is a more realistic view of your responsibility?", "placeholder": "Rewrite the responsibility belief in a more balanced way" },
        { "id": "revised-rating", "type": "likert", "label": "How responsible do you feel now? (0–100%)", "min": 0, "max": 100, "step": 5 },
        { "id": "rating-change", "type": "computed", "label": "Change in responsibility rating", "computation": { "operation": "difference", "field_a": "responsibility-rating", "field_b": "revised-rating", "format": "percentage_change" } }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['OCD', 'responsibility', 'Salkovskis', 'CBT', 'cognitive restructuring', 'inflated responsibility', 'appraisal'],
  15, 4, true, 1
);


-- ============================================================================
-- 8. PTSD (PT2, PT3, PT4, PT6)
-- ============================================================================

-- PT2: Reliving Preparation and Processing Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Reliving Preparation & Processing Worksheet',
  'reliving-preparation-processing',
  'Prepare for trauma reliving sessions and process the experience afterwards — tracking hotspots, emotions, and updated meanings.',
  'This worksheet supports the reliving component of CT-PTSD. Before the session, note your current distress and any specific concerns. After reliving, record the hotspot moments, the emotions and meanings that emerged, and any updated meanings you reached through processing. This helps track progress across reliving sessions.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "pre-session",
      "title": "Before Reliving",
      "fields": [
        { "id": "session-number", "type": "text", "label": "Reliving session number", "placeholder": "e.g. Session 3" },
        { "id": "current-distress", "type": "likert", "label": "Current distress (0–100)", "min": 0, "max": 100, "step": 5 },
        { "id": "concerns", "type": "textarea", "label": "Any concerns about today's reliving?", "placeholder": "What are you worried about? What do you need from your therapist?" }
      ]
    },
    {
      "id": "hotspots",
      "title": "Hotspots Identified",
      "fields": [
        {
          "id": "hotspot-table",
          "type": "table",
          "label": "Key moments in the trauma memory",
          "columns": [
            { "id": "moment", "header": "Hotspot Moment", "type": "textarea" },
            { "id": "emotion", "header": "Emotion", "type": "text" },
            { "id": "meaning-then", "header": "Meaning at the Time", "type": "textarea" },
            { "id": "meaning-now", "header": "Updated Meaning", "type": "textarea" },
            { "id": "distress", "header": "Distress (0–100)", "type": "number", "min": 0, "max": 100 }
          ],
          "min_rows": 1,
          "max_rows": 6
        }
      ]
    },
    {
      "id": "post-session",
      "title": "After Reliving",
      "fields": [
        { "id": "post-distress", "type": "likert", "label": "Distress now (0–100)", "min": 0, "max": 100, "step": 5 },
        { "id": "distress-change", "type": "computed", "label": "Distress change", "computation": { "operation": "difference", "field_a": "current-distress", "field_b": "post-distress", "format": "percentage_change" } },
        { "id": "key-learning", "type": "textarea", "label": "What was the most important thing you learned or updated today?", "placeholder": "Did any meanings shift? Did any new information emerge?" },
        { "id": "homework", "type": "textarea", "label": "What will you practise before the next session?", "placeholder": "e.g. Listen to the reliving recording, practise trigger discrimination, site visit" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'reliving', 'trauma', 'CT-PTSD', 'Ehlers', 'Clark', 'hotspots', 'processing'],
  20, 3, true, 1
);


-- PT3: Hotspot Identification and Meaning Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Hotspot Identification & Meaning Worksheet',
  'hotspot-identification-meaning',
  'Identify the "hotspot" moments in a trauma memory — the moments of peak emotion — and work on updating their personal meaning.',
  'Hotspots are the moments in the trauma memory that carry the most emotional charge. They''re often linked to specific personal meanings (e.g. "It was my fault," "I''m going to die," "I''m powerless"). Identifying these moments and their meanings is the first step toward updating them. For each hotspot, record the moment, the emotion, the meaning it held at the time, and — with your therapist''s help — what you know now that you didn''t know then.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "hotspots",
      "title": "Hotspot Analysis",
      "fields": [
        {
          "id": "hotspot-record",
          "type": "record",
          "label": "Hotspot",
          "min_records": 1,
          "max_records": 8,
          "groups": [
            {
              "id": "moment",
              "header": "The Moment",
              "width": "normal",
              "fields": [
                { "id": "description", "type": "textarea", "placeholder": "Briefly describe the hotspot moment (you don't need detail — just enough to identify it)" }
              ]
            },
            {
              "id": "emotion",
              "header": "Emotion",
              "width": "narrow",
              "fields": [
                { "id": "emotion-name", "type": "text", "placeholder": "e.g. Terror, shame, guilt, rage, helplessness" },
                { "id": "intensity", "type": "likert", "label": "Intensity (0–100)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "meaning-then",
              "header": "Meaning at the Time",
              "width": "normal",
              "fields": [
                { "id": "meaning", "type": "textarea", "placeholder": "What did this moment mean to you? e.g. I'm going to die, It's my fault, I'm completely powerless" },
                { "id": "conviction", "type": "likert", "label": "How true does this feel now? (0–100%)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "updated-meaning",
              "header": "What I Know Now",
              "width": "normal",
              "fields": [
                { "id": "update", "type": "textarea", "placeholder": "What do you know now that you didn't know at that moment? What information was missing?" },
                { "id": "updated-conviction", "type": "likert", "label": "How true does the original meaning feel now? (0–100%)", "min": 0, "max": 100, "step": 5 }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "strongest-hotspot", "type": "textarea", "label": "Which hotspot carries the most emotional weight?", "placeholder": "This is often the one that most needs updating through reliving" },
        { "id": "theme", "type": "textarea", "label": "What theme connects your hotspots?", "placeholder": "e.g. Responsibility, powerlessness, betrayal, contamination, death" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'hotspots', 'trauma', 'CT-PTSD', 'Ehlers', 'Clark', 'meaning', 'cognitive restructuring'],
  20, 4, true, 1
);


-- PT4: Stuck Point / Trauma Appraisal Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Trauma Appraisal Worksheet',
  'trauma-appraisal-worksheet',
  'Identify and challenge stuck points — the unhelpful beliefs about the trauma and its aftermath that maintain PTSD symptoms.',
  'Stuck points are beliefs that developed from or were reinforced by the trauma — about safety, trust, power/control, esteem, and intimacy. They often take the form of overgeneralised conclusions (e.g. "The world is completely dangerous," "I can never trust anyone"). This worksheet helps you identify a stuck point, examine the evidence, and develop a more balanced perspective.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "stuck-point",
      "title": "The Stuck Point",
      "fields": [
        { "id": "belief", "type": "textarea", "label": "What is the stuck point / trauma-related belief?", "placeholder": "e.g. It was my fault because I should have fought back. No one can be trusted. The world is completely dangerous.", "required": true },
        { "id": "domain", "type": "select", "label": "Which area does this relate to?", "options": [
          { "id": "safety", "label": "Safety" },
          { "id": "trust", "label": "Trust" },
          { "id": "power", "label": "Power / Control" },
          { "id": "esteem", "label": "Esteem" },
          { "id": "intimacy", "label": "Intimacy" }
        ]},
        { "id": "conviction-before", "type": "likert", "label": "How strongly do you believe this? (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "challenging",
      "title": "Examining the Evidence",
      "fields": [
        { "id": "evidence-for", "type": "textarea", "label": "Evidence that supports this belief", "placeholder": "What facts support this conclusion?" },
        { "id": "evidence-against", "type": "textarea", "label": "Evidence that challenges this belief", "placeholder": "What facts don't fit? What would a trusted person say?" },
        { "id": "thinking-patterns", "type": "checklist", "label": "Are any of these thinking patterns involved?", "options": [
          { "id": "overgeneralising", "label": "Overgeneralising (one event → always/everyone)" },
          { "id": "hindsight", "label": "Hindsight bias (I should have known)" },
          { "id": "ignoring-context", "label": "Ignoring context (what was actually possible?)" },
          { "id": "emotional-reasoning", "label": "Emotional reasoning (I feel it so it must be true)" },
          { "id": "all-or-nothing", "label": "All-or-nothing thinking (completely safe/dangerous)" }
        ]}
      ]
    },
    {
      "id": "alternative",
      "title": "More Balanced Belief",
      "fields": [
        { "id": "balanced-belief", "type": "textarea", "label": "What is a more balanced way to think about this?", "placeholder": "This doesn't mean the opposite extreme — it means a nuanced, evidence-based view" },
        { "id": "conviction-after", "type": "likert", "label": "How strongly do you believe the original stuck point now? (0–100%)", "min": 0, "max": 100, "step": 5 },
        { "id": "conviction-change", "type": "computed", "label": "Change in conviction", "computation": { "operation": "difference", "field_a": "conviction-before", "field_b": "conviction-after", "format": "percentage_change" } }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'stuck points', 'trauma appraisal', 'CPT', 'CBT', 'cognitive restructuring', 'safety', 'trust'],
  15, 5, true, 1
);


-- PT6: PTSD Symptom Diary
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'PTSD Symptom Diary',
  'ptsd-symptom-diary',
  'Track PTSD symptoms across the three clusters — re-experiencing, avoidance, and hyperarousal — to monitor progress through treatment.',
  'Use this diary daily or every few days to track your PTSD symptoms. Rate each symptom cluster and note any significant triggers or flashbacks. This creates a record you and your therapist can review to see whether symptoms are reducing over the course of treatment.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "diary",
      "title": "Symptom Log",
      "fields": [
        {
          "id": "symptom-table",
          "type": "table",
          "label": "Daily PTSD symptom ratings",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "re-experiencing", "header": "Re-experiencing (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "avoidance", "header": "Avoidance (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "hyperarousal", "header": "Hyperarousal (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "flashbacks", "header": "Flashbacks Today?", "type": "text", "width": "narrow" },
            { "id": "key-trigger", "header": "Key Trigger", "type": "textarea" }
          ],
          "min_rows": 1,
          "max_rows": 14
        },
        {
          "id": "avg-reexp", "type": "computed", "label": "Avg re-experiencing",
          "computation": { "operation": "average", "field": "symptom-table.re-experiencing" }
        },
        {
          "id": "avg-avoid", "type": "computed", "label": "Avg avoidance",
          "computation": { "operation": "average", "field": "symptom-table.avoidance" }
        },
        {
          "id": "avg-hyper", "type": "computed", "label": "Avg hyperarousal",
          "computation": { "operation": "average", "field": "symptom-table.hyperarousal" }
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Reflection",
      "fields": [
        { "id": "changes", "type": "textarea", "label": "What changes have you noticed this week?", "placeholder": "Are any symptom clusters improving? Getting worse? Staying the same?" },
        { "id": "helpful", "type": "textarea", "label": "What helped most this week?", "placeholder": "Which strategies, techniques, or situations made symptoms more manageable?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'symptom diary', 'trauma', 'CBT', 'flashbacks', 're-experiencing', 'avoidance', 'hyperarousal'],
  10, 6, true, 1
);


-- ============================================================================
-- 9. HEALTH ANXIETY (H1, H2, H3, H4)
-- ============================================================================

-- H1: Health Anxiety Formulation (Salkovskis & Warwick)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'health-anxiety'),
  'Health Anxiety Formulation (Salkovskis & Warwick)',
  'health-anxiety-formulation',
  'A formulation based on the cognitive-behavioural model of health anxiety — mapping the vicious cycle of misinterpretation, anxiety, checking, and temporary reassurance.',
  'This formulation shows how health anxiety is maintained by a cycle: you notice a body sensation or health information, interpret it as meaning something is seriously wrong, become anxious (which produces more sensations), and then engage in checking, reassurance-seeking, or avoidance — which temporarily reduces anxiety but reinforces the belief that you were right to worry. Work through it with your therapist.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "Health Anxiety Maintenance Cycle",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "Salkovskis & Warwick Health Anxiety Model",
        "layout": "cycle",
        "formulation_config": {
          "title": "Health Anxiety Model (Salkovskis & Warwick)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "trigger",
            "slot": "top",
            "label": "Trigger",
            "domain_colour": "#6366f1",
            "fields": [{ "id": "trigger-content", "type": "textarea", "placeholder": "e.g. Body sensation (headache, lump), health news, someone else's illness, Google search" }]
          },
          {
            "id": "misinterpretation",
            "slot": "top-right",
            "label": "Misinterpretation",
            "domain_colour": "#dc2626",
            "fields": [{ "id": "misinterpretation-content", "type": "textarea", "placeholder": "e.g. This headache means I have a brain tumour, This lump is cancer, Tingling means MS" }]
          },
          {
            "id": "anxiety",
            "slot": "right",
            "label": "Health Anxiety",
            "domain_colour": "#f97316",
            "fields": [{ "id": "anxiety-content", "type": "textarea", "placeholder": "e.g. Dread, preoccupation, can't stop thinking about it, panic, catastrophising" }]
          },
          {
            "id": "body-focus",
            "slot": "bottom-right",
            "label": "Increased Body Focus",
            "domain_colour": "#eab308",
            "fields": [{ "id": "body-focus-content", "type": "textarea", "placeholder": "e.g. Scanning body for symptoms, noticing every sensation, checking affected area, heightened awareness" }]
          },
          {
            "id": "safety-behaviours",
            "slot": "bottom",
            "label": "Safety Behaviours",
            "domain_colour": "#a855f7",
            "fields": [{ "id": "safety-content", "type": "textarea", "placeholder": "e.g. Googling symptoms, GP visits, body checking, asking partner for reassurance, avoiding health triggers" }]
          },
          {
            "id": "temporary-relief",
            "slot": "left",
            "label": "Temporary Relief → Reinforcement",
            "domain_colour": "#22c55e",
            "fields": [{ "id": "relief-content", "type": "textarea", "placeholder": "e.g. Brief relief after GP says it's fine, but doubt returns within hours/days; relief confirms checking was necessary" }]
          }
        ],
        "connections": [
          { "from": "trigger", "to": "misinterpretation", "style": "arrow", "direction": "one_way" },
          { "from": "misinterpretation", "to": "anxiety", "style": "arrow", "direction": "one_way" },
          { "from": "anxiety", "to": "body-focus", "style": "arrow", "direction": "one_way" },
          { "from": "body-focus", "to": "misinterpretation", "style": "arrow_dashed", "direction": "one_way", "label": "Finds more 'evidence'" },
          { "from": "anxiety", "to": "safety-behaviours", "style": "arrow", "direction": "one_way" },
          { "from": "safety-behaviours", "to": "temporary-relief", "style": "arrow", "direction": "one_way" },
          { "from": "temporary-relief", "to": "trigger", "style": "arrow_dashed", "direction": "one_way", "label": "Cycle restarts" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "key-insight", "type": "textarea", "label": "What role do your safety behaviours play in keeping the cycle going?", "placeholder": "What would happen if you didn't check / Google / seek reassurance?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['health anxiety', 'formulation', 'Salkovskis', 'Warwick', 'CBT', 'hypochondriasis', 'maintenance cycle'],
  25, 1, true, 1
);


-- H2: Health Anxiety Monitoring Diary (overwrites health-anxiety-monitoring-log)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'health-anxiety'),
  'Health Anxiety Monitoring Diary',
  'health-anxiety-monitoring-log',
  'Track health anxiety episodes — the trigger, misinterpretation, anxiety level, safety behaviour used, and the actual outcome.',
  'Record each health anxiety episode as soon as possible. Note what triggered it (sensation, news, conversation), what you thought it meant, how anxious you were, what you did about it, and what actually happened. This builds awareness of the pattern and provides evidence to review in sessions.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "diary",
      "title": "Health Anxiety Log",
      "fields": [
        {
          "id": "ha-record",
          "type": "record",
          "label": "Health Anxiety Episode",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "trigger",
              "header": "Trigger",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "trigger", "type": "textarea", "placeholder": "What triggered the worry? (sensation, news, conversation)" }
              ]
            },
            {
              "id": "interpretation",
              "header": "Interpretation",
              "width": "normal",
              "fields": [
                { "id": "thought", "type": "textarea", "placeholder": "What did you think it meant? e.g. This headache means I have a brain tumour" },
                { "id": "anxiety", "type": "likert", "label": "Anxiety (0–100)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "response",
              "header": "Response",
              "width": "normal",
              "fields": [
                { "id": "safety-behaviour", "type": "textarea", "placeholder": "What did you do? (check, Google, GP, asked someone, avoided)" },
                { "id": "reassurance-effect", "type": "textarea", "placeholder": "How long did the reassurance last before doubt returned?" }
              ]
            },
            {
              "id": "reappraisal",
              "header": "Reappraisal",
              "width": "normal",
              "fields": [
                { "id": "alternative", "type": "textarea", "placeholder": "What is a more realistic explanation for the symptom?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Patterns",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Common triggers? How long does reassurance last? Are the catastrophes ever confirmed?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['health anxiety', 'monitoring diary', 'CBT', 'Salkovskis', 'body checking', 'reassurance'],
  10, 2, true, 1
);


-- H3: Reassurance-Seeking Reduction Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'health-anxiety'),
  'Reassurance-Seeking Reduction Log',
  'reassurance-seeking-reduction-log',
  'Track urges to seek reassurance, whether you resisted, and what happened — building evidence that you can tolerate uncertainty without reassurance.',
  'Reassurance-seeking provides temporary relief but maintains health anxiety by teaching your brain that you needed the reassurance to cope. This log helps you notice the urge, decide whether to resist it, and track what happens when you do. Over time, you''ll see that anxiety reduces on its own without reassurance — and that resisting gets easier.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "log",
      "title": "Reassurance-Seeking Log",
      "fields": [
        {
          "id": "reassurance-table",
          "type": "table",
          "label": "Track each urge to seek reassurance",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "urge", "header": "What Was the Urge?", "type": "textarea" },
            { "id": "urge-strength", "header": "Urge (0–100)", "type": "number", "min": 0, "max": 100 },
            { "id": "resisted", "header": "Did You Resist?", "type": "text" },
            { "id": "what-happened", "header": "What Happened?", "type": "textarea" },
            { "id": "anxiety-after", "header": "Anxiety After (0–100)", "type": "number", "min": 0, "max": 100 }
          ],
          "min_rows": 1,
          "max_rows": 14
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Reflection",
      "fields": [
        { "id": "resist-rate", "type": "textarea", "label": "What proportion of urges did you resist this week?", "placeholder": "Even partial resistance counts as progress" },
        { "id": "learning", "type": "textarea", "label": "What did you learn about what happens when you don't seek reassurance?", "placeholder": "Did the anxiety pass on its own? How long did it take?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['health anxiety', 'reassurance seeking', 'CBT', 'response prevention', 'urge surfing'],
  10, 3, true, 1
);


-- H4: Body Vigilance Experiment
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'health-anxiety'),
  'Body Vigilance Experiment',
  'body-vigilance-experiment',
  'Test how attention to the body creates and amplifies sensations — demonstrating that body scanning is part of the problem, not the solution.',
  'This experiment demonstrates a key principle: paying close attention to any part of your body will produce sensations. Focus on your hand for 2 minutes and you''ll notice tingling, warmth, or pulsing — sensations that were always there but that you only notice when you look for them. This is exactly what happens with health anxiety: scanning your body for symptoms creates the very sensations you then misinterpret.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "before",
      "title": "Before the Experiment",
      "fields": [
        { "id": "belief", "type": "textarea", "label": "What do you currently believe about body sensations and illness?", "placeholder": "e.g. If I notice a sensation, it's a sign something is wrong" },
        { "id": "prediction", "type": "textarea", "label": "What do you predict will happen if you focus attention on a healthy body part?", "placeholder": "e.g. Nothing — I won't notice anything because there's nothing wrong with my hand" },
        { "id": "belief-rating", "type": "likert", "label": "How strongly do you believe attention creates sensations? (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "experiment",
      "title": "The Experiment",
      "description": "Focus your full attention on your left hand for 2 minutes. Notice every sensation.",
      "fields": [
        { "id": "sensations-noticed", "type": "textarea", "label": "What sensations did you notice?", "placeholder": "e.g. Tingling, warmth, pulsing, heaviness, itching, numbness" },
        { "id": "surprise", "type": "textarea", "label": "Were you surprised by any of them?", "placeholder": "Were there sensations you wouldn't normally notice?" }
      ]
    },
    {
      "id": "body-scanning",
      "title": "Now Apply This to Your Health Anxiety",
      "fields": [
        { "id": "scanning-behaviour", "type": "textarea", "label": "What parts of your body do you regularly scan or monitor?", "placeholder": "e.g. Throat, head, chest, stomach, skin" },
        { "id": "connection", "type": "textarea", "label": "How might your scanning create or amplify the symptoms you then worry about?", "placeholder": "If focusing on your hand produced sensations, what happens when you focus on the area you worry about?" }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "revised-belief", "type": "likert", "label": "How strongly do you now believe attention creates sensations? (0–100%)", "min": 0, "max": 100, "step": 5 },
        { "id": "belief-change", "type": "computed", "label": "Change in belief", "computation": { "operation": "difference", "field_a": "belief-rating", "field_b": "revised-belief", "format": "percentage_change" } },
        { "id": "implication", "type": "textarea", "label": "What does this mean for how you respond to body sensations?", "placeholder": "If attention produces sensations, what should you do differently when you notice a symptom?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['health anxiety', 'body vigilance', 'attention', 'CBT', 'behavioural experiment', 'selective attention'],
  15, 4, true, 1
);


-- ============================================================================
-- 10. EATING DISORDERS (E1, E2, E3, E4)
-- ============================================================================

-- E1: Eating Disorder Formulation (CBT-E)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'),
  'Eating Disorder Formulation (CBT-E)',
  'eating-disorder-formulation-cbte',
  'A formulation based on Fairburn''s enhanced cognitive-behavioural model — mapping over-evaluation of eating, shape, and weight alongside maintaining mechanisms.',
  'This formulation maps the core psychopathology of eating disorders: over-evaluation of eating, shape, weight, and their control as the basis of self-worth. This drives dietary restraint, which leads to binge eating (in some presentations), compensatory behaviours, and a cycle of low self-esteem. Additional maintaining mechanisms — perfectionism, mood intolerance, or interpersonal difficulties — may also be relevant. Complete with your therapist.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "CBT-E Formulation",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "Enhanced Cognitive-Behavioural Model",
        "layout": "cycle",
        "formulation_config": {
          "title": "Eating Disorder Model (Fairburn, CBT-E)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "over-evaluation",
            "slot": "top",
            "label": "Over-Evaluation of Eating, Shape & Weight",
            "domain_colour": "#dc2626",
            "description": "Core psychopathology",
            "fields": [{ "id": "over-eval-content", "type": "textarea", "placeholder": "How do eating, shape, and weight determine your self-worth? e.g. I only feel OK about myself when I'm in control of my eating" }]
          },
          {
            "id": "dietary-restraint",
            "slot": "right",
            "label": "Strict Dietary Rules / Restraint",
            "domain_colour": "#f97316",
            "fields": [{ "id": "restraint-content", "type": "textarea", "placeholder": "What food rules do you follow? e.g. No eating before 6pm, no carbs, only 'safe' foods, calorie limits" }]
          },
          {
            "id": "binge-eating",
            "slot": "bottom-right",
            "label": "Binge Eating (if applicable)",
            "domain_colour": "#eab308",
            "fields": [{ "id": "binge-content", "type": "textarea", "placeholder": "What happens when rules break? e.g. Eat large amounts rapidly, feel out of control, eat past fullness" }]
          },
          {
            "id": "compensatory",
            "slot": "bottom",
            "label": "Compensatory Behaviours",
            "domain_colour": "#a855f7",
            "fields": [{ "id": "comp-content", "type": "textarea", "placeholder": "e.g. Purging, excessive exercise, laxative use, fasting, body checking, repeated weighing" }]
          },
          {
            "id": "low-self-esteem",
            "slot": "bottom-left",
            "label": "Low Self-Esteem / Negative Self-Evaluation",
            "domain_colour": "#64748b",
            "fields": [{ "id": "esteem-content", "type": "textarea", "placeholder": "e.g. I'm weak, disgusting, out of control, a failure" }]
          },
          {
            "id": "maintaining",
            "slot": "left",
            "label": "Additional Maintaining Mechanisms",
            "domain_colour": "#3b82f6",
            "description": "Tick those that apply",
            "fields": [
              { "id": "mechanisms", "type": "checklist", "label": "Which apply?", "options": [
                { "id": "perfectionism", "label": "Clinical perfectionism" },
                { "id": "mood-intolerance", "label": "Mood intolerance (eating to manage emotions)" },
                { "id": "interpersonal", "label": "Interpersonal difficulties" },
                { "id": "core-low-esteem", "label": "Core low self-esteem (beyond weight/shape)" }
              ]}
            ]
          }
        ],
        "connections": [
          { "from": "over-evaluation", "to": "dietary-restraint", "style": "arrow", "direction": "one_way" },
          { "from": "dietary-restraint", "to": "binge-eating", "style": "arrow", "direction": "one_way", "label": "Rule-breaking triggers" },
          { "from": "binge-eating", "to": "compensatory", "style": "arrow", "direction": "one_way" },
          { "from": "compensatory", "to": "low-self-esteem", "style": "arrow", "direction": "one_way" },
          { "from": "low-self-esteem", "to": "over-evaluation", "style": "arrow", "direction": "one_way", "label": "Reinforces reliance on control" },
          { "from": "maintaining", "to": "over-evaluation", "style": "arrow_dashed", "direction": "one_way", "label": "Maintains" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "key-insight", "type": "textarea", "label": "What stands out about how the cycle keeps itself going?", "placeholder": "What would happen to the cycle if you broadened the basis of your self-worth beyond eating, shape, and weight?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['eating disorder', 'formulation', 'CBT-E', 'Fairburn', 'bulimia', 'anorexia', 'binge eating', 'maintenance cycle'],
  25, 1, true, 1
);


-- E2: Food, Mood and Context Diary
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'),
  'Food, Mood & Context Diary',
  'food-mood-context-diary',
  'The core CBT-E self-monitoring tool — record what you eat, when, where, and how you felt, including any binge/purge episodes and triggers.',
  'Real-time self-monitoring is the cornerstone of CBT-E. Record everything you eat and drink as you go (not from memory later). Note the time, what you consumed, where you were, and any significant thoughts, feelings, or behaviours (mark binges with * and purges with V). This builds awareness of patterns linking mood, context, and eating.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "diary",
      "title": "Food & Mood Diary",
      "fields": [
        {
          "id": "food-record",
          "type": "record",
          "label": "Entry",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "when",
              "header": "When & Where",
              "width": "narrow",
              "fields": [
                { "id": "time", "type": "text", "placeholder": "Time" },
                { "id": "place", "type": "text", "placeholder": "Where?" }
              ]
            },
            {
              "id": "what",
              "header": "Food & Drink",
              "width": "normal",
              "fields": [
                { "id": "consumed", "type": "textarea", "placeholder": "What did you eat or drink?" }
              ]
            },
            {
              "id": "context",
              "header": "Context & Feelings",
              "width": "normal",
              "fields": [
                { "id": "feelings", "type": "textarea", "placeholder": "How were you feeling? Any triggers?" },
                { "id": "behaviours", "type": "checklist", "label": "Mark if applicable", "options": [
                  { "id": "binge", "label": "* Binge episode" },
                  { "id": "purge", "label": "V Purge" },
                  { "id": "restrict", "label": "R Restricted / skipped meal" },
                  { "id": "exercise", "label": "E Compensatory exercise" }
                ]}
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Daily Reflection",
      "fields": [
        { "id": "pattern", "type": "textarea", "label": "What patterns do you notice today?", "placeholder": "Any links between mood, context, and eating? Did you follow your regular eating plan?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['eating disorder', 'food diary', 'CBT-E', 'Fairburn', 'self-monitoring', 'binge', 'purge'],
  10, 2, true, 1
);


-- E3: Regular Eating Schedule
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'),
  'Regular Eating Schedule',
  'regular-eating-schedule',
  'Plan and track a pattern of regular eating — three meals and two to three snacks — to establish a predictable structure that reduces binge urges.',
  'Regular eating is a key early intervention in CBT-E. The goal is to eat at planned times (roughly every 3–4 hours) regardless of hunger or the urge to restrict. This stabilises blood sugar, reduces binge triggers, and gives you a framework to gradually challenge food rules. Plan your meals and snacks in advance, then track what you actually did.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "plan",
      "title": "Regular Eating Plan",
      "fields": [
        {
          "id": "eating-table",
          "type": "table",
          "label": "Plan and track regular eating",
          "columns": [
            { "id": "day", "header": "Day", "type": "text", "width": "narrow" },
            { "id": "meal", "header": "Meal/Snack", "type": "text" },
            { "id": "planned-time", "header": "Planned Time", "type": "text", "width": "narrow" },
            { "id": "actual-time", "header": "Actual Time", "type": "text", "width": "narrow" },
            { "id": "what-eaten", "header": "What I Ate", "type": "textarea" },
            { "id": "flexibility", "header": "Flexibility Rating (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 5,
          "max_rows": 28
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Review",
      "fields": [
        { "id": "adherence", "type": "textarea", "label": "How well did you stick to your regular eating plan?", "placeholder": "What helped? What got in the way?" },
        { "id": "binge-link", "type": "textarea", "label": "Did you notice any connection between skipping meals and binge urges?", "placeholder": "What happened on days you ate regularly vs days you restricted?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['eating disorder', 'regular eating', 'CBT-E', 'Fairburn', 'meal planning', 'structure'],
  10, 3, true, 1
);


-- E4: Self-Evaluation Pie Chart
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'),
  'Self-Evaluation Pie Chart',
  'self-evaluation-pie-chart',
  'Examine what determines your self-worth — and how much is dominated by eating, shape, and weight compared to other life domains.',
  'Most people evaluate themselves across multiple domains: relationships, work, hobbies, parenting, creativity, values. In eating disorders, eating/shape/weight take up a disproportionate share. This worksheet asks you to allocate percentages to each area of your life that determines your self-worth — first as it is now, then as you would like it to be.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "current",
      "title": "Current Self-Evaluation",
      "description": "How much does each area determine your self-worth RIGHT NOW? Percentages should add to 100.",
      "fields": [
        {
          "id": "current-table",
          "type": "table",
          "label": "Current self-worth pie",
          "columns": [
            { "id": "domain", "header": "Life Area", "type": "text" },
            { "id": "percentage", "header": "% of Self-Worth", "type": "number", "min": 0, "max": 100, "suffix": "%", "width": "narrow" }
          ],
          "min_rows": 4,
          "max_rows": 10
        },
        {
          "id": "current-total",
          "type": "computed",
          "label": "Total",
          "computation": { "operation": "sum", "field": "current-table.percentage", "format": "integer" }
        }
      ]
    },
    {
      "id": "preferred",
      "title": "Preferred Self-Evaluation",
      "description": "How would you LIKE it to be? What would a more balanced pie look like?",
      "fields": [
        {
          "id": "preferred-table",
          "type": "table",
          "label": "Preferred self-worth pie",
          "columns": [
            { "id": "domain", "header": "Life Area", "type": "text" },
            { "id": "percentage", "header": "% of Self-Worth", "type": "number", "min": 0, "max": 100, "suffix": "%", "width": "narrow" }
          ],
          "min_rows": 4,
          "max_rows": 10
        },
        {
          "id": "preferred-total",
          "type": "computed",
          "label": "Total",
          "computation": { "operation": "sum", "field": "preferred-table.percentage", "format": "integer" }
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "difference", "type": "textarea", "label": "What is the biggest difference between your current and preferred pie?", "placeholder": "How much space does eating/shape/weight take up now vs what you'd like?" },
        { "id": "first-step", "type": "textarea", "label": "What is one step you could take to invest more in another area?", "placeholder": "e.g. Restart a hobby, reconnect with a friend, spend time on something you value" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['eating disorder', 'self-evaluation', 'CBT-E', 'Fairburn', 'self-worth', 'pie chart', 'values'],
  15, 4, true, 1
);


-- ============================================================================
-- 11. INSOMNIA / CBT-I (I1, I2, I3, I4)
-- ============================================================================

-- I1: Insomnia Formulation (Spielman 3P)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'),
  'Insomnia Formulation (Spielman 3P Model)',
  'insomnia-formulation-3p',
  'A formulation based on Spielman''s 3P model — mapping predisposing, precipitating, and perpetuating factors that maintain insomnia.',
  'The 3P model explains why insomnia persists even after the original cause has gone. Predisposing factors made you vulnerable, a precipitating event triggered it, and perpetuating factors (the things you do to cope with poor sleep) are what keep it going. Understanding this model is key to CBT for insomnia — because the perpetuating factors are what you can change.',
  $schema${
  "version": 1,
  "layout": "formulation_longitudinal",
  "sections": [
    {
      "id": "predisposing",
      "title": "Predisposing Factors",
      "fields": [{
        "id": "predisposing-content",
        "type": "textarea",
        "label": "What makes you vulnerable to sleep problems?",
        "placeholder": "e.g. Family history of insomnia, tendency to worry, light sleeper, perfectionism, hyperarousal"
      }]
    },
    {
      "id": "precipitating",
      "title": "Precipitating Factors",
      "highlight": "red_dashed",
      "fields": [{
        "id": "precipitating-content",
        "type": "textarea",
        "label": "What originally triggered the insomnia?",
        "placeholder": "e.g. Stressful life event, illness, shift work change, new baby, bereavement, pain"
      }]
    },
    {
      "id": "perpetuating",
      "title": "Perpetuating Factors",
      "highlight": "amber",
      "fields": [
        {
          "id": "behaviours",
          "type": "textarea",
          "label": "What behaviours are keeping it going?",
          "placeholder": "e.g. Spending too long in bed, napping, irregular schedule, clock-watching, using phone in bed, caffeine late in day"
        },
        {
          "id": "cognitions",
          "type": "textarea",
          "label": "What thoughts or beliefs about sleep are maintaining it?",
          "placeholder": "e.g. I need 8 hours or I can't function, If I don't sleep I'll get ill, I should try harder to sleep"
        },
        {
          "id": "arousal",
          "type": "textarea",
          "label": "What creates arousal at bedtime?",
          "placeholder": "e.g. Worrying in bed, frustration about not sleeping, monitoring body for tiredness signs"
        }
      ]
    },
    {
      "id": "maintenance_cycle",
      "title": "The Insomnia Maintenance Cycle",
      "layout": "four_quadrant",
      "fields": [
        { "id": "poor-sleep", "type": "textarea", "label": "Poor Sleep", "domain": "situation", "placeholder": "Difficulty falling asleep, waking in the night, early waking" },
        { "id": "daytime-effects", "type": "textarea", "label": "Daytime Effects", "domain": "physical", "placeholder": "Fatigue, poor concentration, irritability, low mood" },
        { "id": "unhelpful-strategies", "type": "textarea", "label": "Compensatory Strategies", "domain": "behaviour", "placeholder": "Napping, lie-ins, going to bed early, cancelling plans, caffeine" },
        { "id": "beliefs-worry", "type": "textarea", "label": "Beliefs & Worry About Sleep", "domain": "thoughts", "placeholder": "Catastrophising about consequences, clock-watching, effort to control sleep" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['insomnia', 'formulation', 'Spielman', '3P model', 'CBT-I', 'perpetuating factors', 'sleep'],
  20, 1, true, 1
);


-- I2: Sleep Diary
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'),
  'Sleep Diary',
  'sleep-diary',
  'The standard CBT-I sleep diary — record bed times, sleep times, wake times, and daytime functioning to track patterns and calculate sleep efficiency.',
  'Complete this diary each morning when you wake up. Record when you got into bed, when you think you fell asleep, any time awake in the night, when you finally woke, and when you got out of bed. Don''t clock-watch — estimates are fine. Your therapist will use this data to calculate sleep efficiency and guide your sleep window.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "diary",
      "title": "Sleep Log",
      "fields": [
        {
          "id": "sleep-table",
          "type": "table",
          "label": "Nightly sleep record",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "bed-time", "header": "Got Into Bed", "type": "text", "width": "narrow" },
            { "id": "sleep-onset", "header": "Fell Asleep (est.)", "type": "text", "width": "narrow" },
            { "id": "wakings", "header": "Night Wakings (mins total)", "type": "number", "min": 0 },
            { "id": "final-wake", "header": "Final Wake Time", "type": "text", "width": "narrow" },
            { "id": "out-of-bed", "header": "Got Out of Bed", "type": "text", "width": "narrow" },
            { "id": "quality", "header": "Sleep Quality (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "naps", "header": "Daytime Naps (mins)", "type": "number", "min": 0 }
          ],
          "min_rows": 7,
          "max_rows": 14
        },
        {
          "id": "avg-quality",
          "type": "computed",
          "label": "Average sleep quality",
          "computation": { "operation": "average", "field": "sleep-table.quality" }
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Reflection",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Which nights were better/worse? Any connection to daytime activity, caffeine, or stress?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['insomnia', 'sleep diary', 'CBT-I', 'sleep efficiency', 'sleep hygiene'],
  5, 2, true, 1
);


-- I3: Sleep Efficiency Tracker
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'),
  'Sleep Efficiency Tracker',
  'sleep-efficiency-tracker',
  'Calculate and track sleep efficiency (time asleep ÷ time in bed × 100) — the key metric for CBT-I sleep restriction therapy.',
  'Sleep efficiency is the percentage of time in bed that you actually spend asleep. A healthy sleeper has efficiency above 85%. People with insomnia often have low efficiency because they spend too long in bed awake. Tracking this weekly helps guide sleep restriction: when efficiency is consistently above 85%, you can extend your sleep window.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "weekly-data",
      "title": "Weekly Sleep Efficiency",
      "fields": [
        {
          "id": "efficiency-table",
          "type": "table",
          "label": "Enter data from your sleep diary",
          "columns": [
            { "id": "week", "header": "Week", "type": "text", "width": "narrow" },
            { "id": "total-bed", "header": "Total Time in Bed (hrs)", "type": "number", "min": 0, "step": 0.5 },
            { "id": "total-sleep", "header": "Total Sleep Time (hrs)", "type": "number", "min": 0, "step": 0.5 },
            { "id": "efficiency", "header": "Sleep Efficiency %", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "sleep-window", "header": "Current Sleep Window", "type": "text" }
          ],
          "min_rows": 1,
          "max_rows": 12
        }
      ]
    },
    {
      "id": "guide",
      "title": "Sleep Window Decision Guide",
      "fields": [
        { "id": "current-efficiency", "type": "textarea", "label": "What is your current average sleep efficiency?", "placeholder": "Calculate: (total sleep time ÷ total time in bed) × 100" },
        { "id": "decision", "type": "textarea", "label": "Based on this, what change to your sleep window is indicated?", "placeholder": "≥85% → extend by 15 mins. 80–84% → keep the same. <80% → reduce by 15 mins (never below 5 hours)" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['insomnia', 'sleep efficiency', 'CBT-I', 'sleep restriction', 'sleep window'],
  10, 3, true, 1
);


-- I4: Sleep Window Prescription and Tracking
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'),
  'Sleep Window Prescription & Tracking',
  'sleep-window-prescription',
  'Set and track your prescribed sleep window as part of sleep restriction therapy — with weekly adjustments based on sleep efficiency.',
  'Sleep restriction works by matching your time in bed to the amount you actually sleep, then gradually extending it. Your therapist will help you set an initial sleep window (e.g. 11:30pm–6:00am). Stick to it every night, including weekends. Each week, review your sleep efficiency and adjust the window according to the protocol.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "prescription",
      "title": "Current Sleep Window",
      "fields": [
        { "id": "bedtime", "type": "text", "label": "Prescribed bedtime (earliest you may get into bed):", "placeholder": "e.g. 11:30pm" },
        { "id": "rise-time", "type": "text", "label": "Prescribed rise time (must get up, no snoozing):", "placeholder": "e.g. 6:00am" },
        { "id": "window-hours", "type": "text", "label": "Total sleep window:", "placeholder": "e.g. 6.5 hours" }
      ]
    },
    {
      "id": "tracking",
      "title": "Weekly Tracking",
      "fields": [
        {
          "id": "tracking-table",
          "type": "table",
          "label": "Track adherence and adjustment each week",
          "columns": [
            { "id": "week", "header": "Week", "type": "text", "width": "narrow" },
            { "id": "window", "header": "Sleep Window", "type": "text" },
            { "id": "adherence", "header": "Nights Adhered (/7)", "type": "number", "min": 0, "max": 7, "width": "narrow" },
            { "id": "efficiency", "header": "Sleep Efficiency %", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "adjustment", "header": "Adjustment", "type": "text" }
          ],
          "min_rows": 1,
          "max_rows": 12
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "challenges", "type": "textarea", "label": "What has been hardest about sticking to the sleep window?", "placeholder": "Getting out of bed at the prescribed time? Staying up until the prescribed bedtime?" },
        { "id": "progress", "type": "textarea", "label": "What improvements have you noticed?", "placeholder": "Falling asleep faster? Less time awake at night? Better quality sleep?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['insomnia', 'sleep restriction', 'CBT-I', 'sleep window', 'prescription', 'adherence'],
  10, 4, true, 1
);


-- ============================================================================
-- 12. BIPOLAR (Bi3+Bi4 merged)
-- ============================================================================

-- Bi3+Bi4: Bipolar Early Warning Signs & Relapse Action Plan
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'bipolar-disorder'),
  'Bipolar Early Warning Signs & Action Plan',
  'bipolar-early-warning-signs-action-plan',
  'Identify personal early warning signs for both depression and mania/hypomania, and create a stepped action plan for each mood polarity.',
  'Bipolar disorder involves episodes in both directions — depression and mania/hypomania. Recognising the early signs of each polarity is the most powerful relapse prevention tool. This worksheet helps you map your personal warning signs for both poles, create separate action plans for each, and identify who can help you notice what you might miss yourself. Complete it collaboratively with your therapist and share with trusted supporters.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "baseline",
      "title": "My Baseline (When Stable)",
      "fields": [
        { "id": "stable-description", "type": "textarea", "label": "When I'm stable, I typically:", "placeholder": "Sleep pattern, energy, activity level, social behaviour, spending habits, typical mood" }
      ]
    },
    {
      "id": "depression-signs",
      "title": "Depression Early Warning Signs",
      "fields": [
        {
          "id": "depression-table",
          "type": "table",
          "label": "Signs that I may be sliding into depression",
          "columns": [
            { "id": "sign", "header": "Warning Sign", "type": "textarea" },
            { "id": "area", "header": "Area", "type": "text" },
            { "id": "who-notices", "header": "Who Notices?", "type": "text" }
          ],
          "min_rows": 3,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "depression-plan",
      "title": "Depression Action Plan",
      "fields": [
        { "id": "dep-green", "type": "textarea", "label": "🟢 Mild signs (1–2 changes):", "placeholder": "e.g. Maintain routine, increase pleasant activities, use BA schedule" },
        { "id": "dep-amber", "type": "textarea", "label": "🟡 Moderate signs (persistent >few days):", "placeholder": "e.g. Contact therapist/psychiatrist, adjust medication, tell key supporter" },
        { "id": "dep-red", "type": "textarea", "label": "🔴 Severe / crisis:", "placeholder": "e.g. Contact crisis team, safety plan, emergency contacts" }
      ]
    },
    {
      "id": "mania-signs",
      "title": "Mania / Hypomania Early Warning Signs",
      "fields": [
        {
          "id": "mania-table",
          "type": "table",
          "label": "Signs that I may be becoming hypomanic or manic",
          "columns": [
            { "id": "sign", "header": "Warning Sign", "type": "textarea" },
            { "id": "area", "header": "Area", "type": "text" },
            { "id": "who-notices", "header": "Who Notices?", "type": "text" }
          ],
          "min_rows": 3,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "mania-plan",
      "title": "Mania / Hypomania Action Plan",
      "fields": [
        { "id": "man-green", "type": "textarea", "label": "🟢 Mild signs (subtle changes):", "placeholder": "e.g. Prioritise sleep, limit stimulation, avoid big decisions, check with key supporter" },
        { "id": "man-amber", "type": "textarea", "label": "🟡 Moderate signs (others noticing):", "placeholder": "e.g. Contact psychiatrist urgently, hand over credit cards, increase sleep medication if prescribed" },
        { "id": "man-red", "type": "textarea", "label": "🔴 Full episode / crisis:", "placeholder": "e.g. Crisis team, trusted person takes over finances, emergency contacts" }
      ]
    },
    {
      "id": "key-contacts",
      "title": "Key Contacts",
      "fields": [
        {
          "id": "contacts-table",
          "type": "table",
          "label": "People who can support me",
          "columns": [
            { "id": "name", "header": "Name", "type": "text" },
            { "id": "role", "header": "Role", "type": "text" },
            { "id": "phone", "header": "Contact", "type": "text" },
            { "id": "what-to-do", "header": "What They Should Do", "type": "textarea" }
          ],
          "min_rows": 2,
          "max_rows": 6
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['bipolar', 'early warning signs', 'relapse prevention', 'mania', 'depression', 'CBT', 'action plan', 'hypomania'],
  25, 1, true, 1
);


-- ============================================================================
-- 13. PERSONALITY & SCHEMA WORK (PD1, PD2, PD3)
-- ============================================================================

-- PD1: Schema Formulation
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'),
  'Schema Formulation',
  'schema-formulation',
  'A longitudinal formulation mapping early experiences, core beliefs (schemas), coping strategies, and current patterns — the foundation for schema-focused work.',
  'This formulation tells your life story through the lens of schemas: what happened early on, what you learned about yourself and others, what rules and strategies you developed to cope, and how those patterns play out now — including in therapy. It''s a collaborative document that develops over time. You don''t need to complete it all at once.',
  $schema${
  "version": 1,
  "layout": "formulation_longitudinal",
  "sections": [
    {
      "id": "early_experiences",
      "title": "Early Experiences",
      "fields": [{
        "id": "experiences",
        "type": "textarea",
        "label": "Key early experiences and relationships",
        "placeholder": "What happened in your childhood/adolescence? What were your caregivers like? What was missing?"
      }]
    },
    {
      "id": "core_beliefs",
      "title": "Core Beliefs / Schemas",
      "highlight": "amber",
      "fields": [
        {
          "id": "self-beliefs",
          "type": "textarea",
          "label": "About myself:",
          "placeholder": "e.g. I'm defective, I'm unlovable, I'm worthless, I don't matter"
        },
        {
          "id": "other-beliefs",
          "type": "textarea",
          "label": "About others:",
          "placeholder": "e.g. Others will abandon me, Others can't be trusted, Others are critical/rejecting"
        },
        {
          "id": "world-beliefs",
          "type": "textarea",
          "label": "About the world:",
          "placeholder": "e.g. The world is dangerous, Life is unfair, Nothing ever works out"
        }
      ]
    },
    {
      "id": "rules_assumptions",
      "title": "Rules, Assumptions & Coping Strategies",
      "fields": [
        {
          "id": "rules",
          "type": "textarea",
          "label": "Rules for living:",
          "placeholder": "e.g. If I keep people at a distance, they can't hurt me. If I'm perfect, I'll be accepted."
        },
        {
          "id": "coping-strategies",
          "type": "textarea",
          "label": "Main coping strategies / modes:",
          "placeholder": "e.g. Avoidance, people-pleasing, emotional suppression, overcompensation, detachment, self-sacrifice"
        }
      ]
    },
    {
      "id": "current_patterns",
      "title": "Current Patterns",
      "layout": "four_quadrant",
      "fields": [
        { "id": "relationships", "type": "textarea", "label": "In Relationships", "domain": "emotions", "placeholder": "How do these schemas play out in your close relationships?" },
        { "id": "work", "type": "textarea", "label": "At Work / Study", "domain": "thoughts", "placeholder": "How do they affect your professional life?" },
        { "id": "self-care", "type": "textarea", "label": "Self-Care & Identity", "domain": "physical", "placeholder": "How do they affect how you treat yourself?" },
        { "id": "therapy", "type": "textarea", "label": "In Therapy", "domain": "behaviour", "placeholder": "How might these patterns show up in the therapeutic relationship?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['schema', 'formulation', 'longitudinal', 'CBT', 'personality', 'core beliefs', 'early maladaptive schemas'],
  30, 1, true, 1
);


-- PD2: Core Belief Continuum
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'),
  'Core Belief Continuum',
  'core-belief-continuum',
  'Move from all-or-nothing core belief thinking to a continuum — placing yourself and evidence along a 0–100 scale.',
  'Core beliefs tend to feel absolute: "I''m completely worthless" or "I''m totally competent." Reality is always on a continuum. This worksheet helps you define the two ends of the scale, place yourself on it, then plot evidence at various points — building a more nuanced, flexible view of yourself.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "continuum",
      "title": "The Continuum",
      "fields": [
        { "id": "negative-end", "type": "textarea", "label": "Negative end (0%):", "placeholder": "e.g. Completely worthless / unlovable / incompetent — what would this actually look like?", "required": true },
        { "id": "positive-end", "type": "textarea", "label": "Positive end (100%):", "placeholder": "e.g. Completely worthy / lovable / competent — what would this look like?" },
        { "id": "initial-rating", "type": "likert", "label": "Where do you place yourself right now?", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Negative end", "50": "Middle", "100": "Positive end" } }
      ]
    },
    {
      "id": "evidence",
      "title": "Evidence Along the Continuum",
      "description": "Plot specific pieces of evidence at different points on the scale. Include evidence from all levels — not just the extremes.",
      "fields": [
        {
          "id": "evidence-table",
          "type": "table",
          "label": "Evidence plotted on the continuum",
          "columns": [
            { "id": "evidence", "header": "Evidence / Experience", "type": "textarea" },
            { "id": "rating", "header": "Where on the Scale? (0–100)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "era", "header": "When?", "type": "text" }
          ],
          "min_rows": 5,
          "max_rows": 12
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "revised-rating", "type": "likert", "label": "Having plotted the evidence, where do you now place yourself?", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Negative end", "50": "Middle", "100": "Positive end" } },
        { "id": "rating-change", "type": "computed", "label": "Shift on the continuum", "computation": { "operation": "difference", "field_a": "initial-rating", "field_b": "revised-rating", "format": "percentage_change" } },
        { "id": "learning", "type": "textarea", "label": "What do you notice about where the evidence clusters?", "placeholder": "Is there more evidence in the middle than you expected? What does the full picture suggest?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['core beliefs', 'continuum', 'CBT', 'schema', 'cognitive restructuring', 'all-or-nothing', 'personality'],
  20, 2, true, 1
);


-- PD3: Therapy Flashcard Builder
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'),
  'Therapy Flashcard Builder',
  'therapy-flashcard-builder',
  'Create coping flashcards that capture a triggering situation, the old unhelpful response, and a new, more adaptive response — for quick reference in difficult moments.',
  'Flashcards are a bridge between session learning and real life. Each card captures a specific situation you find difficult, the old pattern (belief + behaviour), and the new alternative you''re building (balanced belief + adaptive action). Keep them on your phone or print them out. Use them in the moment when you notice an old pattern activating.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "flashcards",
      "title": "Therapy Flashcards",
      "fields": [
        {
          "id": "flashcard-record",
          "type": "record",
          "label": "Flashcard",
          "min_records": 1,
          "max_records": 10,
          "groups": [
            {
              "id": "situation",
              "header": "Trigger Situation",
              "width": "normal",
              "fields": [
                { "id": "situation", "type": "textarea", "placeholder": "When does this pattern get activated? e.g. When someone criticises my work" }
              ]
            },
            {
              "id": "old-pattern",
              "header": "Old Pattern",
              "width": "normal",
              "fields": [
                { "id": "old-belief", "type": "textarea", "placeholder": "Old belief: e.g. I'm incompetent and everyone can see it" },
                { "id": "old-behaviour", "type": "textarea", "placeholder": "Old behaviour: e.g. Withdraw, overwork to compensate, avoid the person" }
              ]
            },
            {
              "id": "new-pattern",
              "header": "New Response",
              "width": "normal",
              "fields": [
                { "id": "new-belief", "type": "textarea", "placeholder": "Balanced belief: e.g. Criticism of one piece of work doesn't define my competence" },
                { "id": "new-behaviour", "type": "textarea", "placeholder": "Adaptive action: e.g. Ask for specific feedback, respond proportionally, don't avoid" }
              ]
            },
            {
              "id": "reminder",
              "header": "Reminder to Self",
              "width": "normal",
              "fields": [
                { "id": "compassionate-statement", "type": "textarea", "placeholder": "What would you say to a friend in this situation? What does the evidence from therapy tell you?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Using Your Flashcards",
      "fields": [
        { "id": "when-to-use", "type": "textarea", "label": "When will you check your flashcards?", "placeholder": "e.g. When I notice a strong emotional reaction, before a difficult conversation, when I catch myself in an old pattern" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['flashcards', 'coping cards', 'CBT', 'schema', 'personality', 'core beliefs', 'relapse prevention'],
  15, 3, true, 1
);


-- ============================================================================
-- DONE. Verify counts.
-- ============================================================================
-- Expected: 33 new rows inserted
-- Deleted: 5 old worksheet rows (replaced by new versions)
-- New categories: Eating Disorders, Insomnia/Sleep, Bipolar Disorder,
--                 Personality & Schema Work
-- Skipped: D8 (existing thought records), P5 (covered by T8)
-- Merged: Bi3 + Bi4 → single worksheet

COMMIT;
