-- ============================================================================
-- FORMULATE — Batch 4: Priority C (17 Worksheets)
-- ============================================================================
-- Final batch. Run AFTER Batches 1–3 are live. Single transaction.
-- ============================================================================

BEGIN;

-- ============================================================================
-- CONSOLIDATION DECISIONS
-- ============================================================================
--
-- These are specialist, niche, or "when demand signals" worksheets.
-- Some disorders get deeper toolkits; new category Low Self-Esteem
-- gets its first dedicated formulation and tools.
--
-- FINAL COUNT: 17 worksheets (all new slugs)
-- ============================================================================


-- ============================================================================
-- 1. LOW SELF-ESTEEM (LSE1, LSE2, LSE3)
-- ============================================================================

-- LSE1: Low Self-Esteem Formulation (Fennell)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'low-self-esteem'),
  'Low Self-Esteem Formulation (Fennell)',
  'low-self-esteem-formulation-fennell',
  'A longitudinal formulation based on Fennell''s cognitive model of low self-esteem — mapping how early experiences created a negative bottom line that is maintained by biased processing and unhelpful rules.',
  'This formulation maps how early experiences led to a core negative belief about yourself (the "bottom line"), the rules you developed to cope, what happens when those rules are triggered or broken, and how biased thinking and safety behaviours prevent the bottom line from ever being updated. Work through it with your therapist.',
  $schema${
  "version": 1,
  "layout": "formulation_longitudinal",
  "sections": [
    {
      "id": "early_experiences",
      "title": "Early Experiences",
      "fields": [{ "id": "experiences", "type": "textarea", "label": "What experiences shaped your view of yourself?", "placeholder": "e.g. Critical parent, bullying, comparison with siblings, neglect, being told you weren't good enough" }]
    },
    {
      "id": "core_beliefs",
      "title": "The Bottom Line",
      "highlight": "amber",
      "fields": [
        { "id": "bottom-line", "type": "textarea", "label": "My bottom line about myself:", "placeholder": "e.g. I'm not good enough, I'm unlovable, I'm stupid, I'm worthless" },
        { "id": "conviction", "type": "likert", "label": "How much do you believe this? (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "rules_assumptions",
      "title": "Rules for Living",
      "fields": [{
        "id": "rules",
        "type": "textarea",
        "label": "What rules did you develop to manage the bottom line?",
        "placeholder": "If I... [work harder than everyone / keep people happy / never make mistakes / stay invisible]... then... [I'll be OK / no one will notice / I won't be rejected]"
      }]
    },
    {
      "id": "triggered",
      "title": "When Rules Are Triggered or Broken",
      "highlight": "red_dashed",
      "fields": [
        { "id": "trigger-situation", "type": "textarea", "label": "What situations trigger or break your rules?", "placeholder": "e.g. Making a mistake, being criticised, being compared, failing to meet a standard" }
      ]
    },
    {
      "id": "maintenance_cycle",
      "title": "Maintenance Cycle",
      "layout": "four_quadrant",
      "fields": [
        { "id": "predictions", "type": "textarea", "label": "Negative Predictions", "domain": "thoughts", "placeholder": "e.g. I'll fail, they'll see I'm not good enough, it'll go wrong" },
        { "id": "anxiety", "type": "textarea", "label": "Anxiety / Low Mood", "domain": "emotions", "placeholder": "e.g. Anxiety, dread, sadness, shame" },
        { "id": "safety-behaviours", "type": "textarea", "label": "Safety Behaviours / Avoidance", "domain": "behaviour", "placeholder": "e.g. Over-preparing, avoiding challenges, not speaking up, people-pleasing" },
        { "id": "confirmation", "type": "textarea", "label": "Biased Processing", "domain": "physical", "placeholder": "e.g. Discounting success, focusing on criticism, all-or-nothing judgement of self" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['low self-esteem', 'formulation', 'Fennell', 'CBT', 'core beliefs', 'bottom line', 'rules for living'],
  25, 1, true, 1
);


-- LSE2: Self-Compassion Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'low-self-esteem'),
  'Self-Compassion Worksheet',
  'self-compassion-worksheet',
  'Practise responding to yourself with the same kindness you would offer a friend — challenging the self-critical voice with compassion.',
  'When something goes wrong, notice the self-critical voice and then deliberately generate a compassionate response. What would you say to a close friend in the same situation? This isn''t about lowering standards — it''s about responding to difficulty without adding unnecessary self-punishment.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "records",
      "title": "Self-Compassion Practice",
      "fields": [
        {
          "id": "compassion-record",
          "type": "record",
          "label": "Self-Compassion Entry",
          "min_records": 1,
          "max_records": 10,
          "groups": [
            {
              "id": "situation",
              "header": "Situation",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "what-happened", "type": "textarea", "placeholder": "What triggered self-criticism?" }
              ]
            },
            {
              "id": "critic",
              "header": "Self-Critical Voice",
              "width": "normal",
              "fields": [
                { "id": "critical-thought", "type": "textarea", "placeholder": "What did the self-critical voice say?" },
                { "id": "feeling", "type": "text", "placeholder": "How did that make you feel?" }
              ]
            },
            {
              "id": "compassion",
              "header": "Compassionate Response",
              "width": "normal",
              "fields": [
                { "id": "friend-response", "type": "textarea", "placeholder": "What would you say to a friend in this situation?" },
                { "id": "compassionate-thought", "type": "textarea", "placeholder": "Can you say the same thing to yourself?" },
                { "id": "feeling-after", "type": "text", "placeholder": "How do you feel after?" }
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
        { "id": "learning", "type": "textarea", "label": "What do you notice about the difference between self-criticism and self-compassion?", "placeholder": "Which is more motivating? Which helps you cope better?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['self-compassion', 'low self-esteem', 'CBT', 'self-criticism', 'Gilbert', 'compassionate mind'],
  10, 2, true, 1
);


-- LSE3: Strengths and Qualities Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'low-self-esteem'),
  'Strengths & Qualities Log',
  'strengths-qualities-log',
  'Build a catalogue of your strengths, qualities, and achievements — evidence that doesn''t fit the negative bottom line.',
  'Low self-esteem makes it hard to recognise your own strengths. This log asks you to deliberately collect evidence of things you''re good at, qualities others value in you, and achievements (however small). Ask trusted people to contribute too.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "qualities",
      "title": "My Strengths & Qualities",
      "fields": [
        {
          "id": "qualities-table",
          "type": "table",
          "label": "Collect evidence of your strengths",
          "columns": [
            { "id": "quality", "header": "Strength / Quality / Achievement", "type": "textarea" },
            { "id": "evidence", "header": "Evidence / Example", "type": "textarea" },
            { "id": "source", "header": "Who Noticed?", "type": "text" },
            { "id": "belief-fit", "header": "How Does This Fit My Bottom Line?", "type": "textarea" }
          ],
          "min_rows": 5,
          "max_rows": 20
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "pattern", "type": "textarea", "label": "What themes emerge?", "placeholder": "Are there strengths you consistently discount? What does the evidence suggest about the accuracy of your bottom line?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['low self-esteem', 'strengths', 'CBT', 'Fennell', 'positive data', 'qualities'],
  10, 3, true, 1
);


-- ============================================================================
-- 2. OCD (O6, O8)
-- ============================================================================

-- O6: Contamination Reappraisal Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'), 'Contamination Reappraisal Worksheet', 'contamination-reappraisal',
  'Challenge contamination-specific appraisals by examining the realistic probability of harm, the role of disgust vs danger, and what "clean enough" means.',
  'Contamination OCD often blurs the boundary between disgust and danger. This worksheet helps you separate the two: is the problem that something is genuinely dangerous, or that it feels disgusting? What would "clean enough" look like for someone without OCD?',
  $schema${ "version": 1, "sections": [{ "id": "trigger", "title": "The Contamination Trigger", "fields": [{ "id": "trigger", "type": "textarea", "label": "What did you touch / encounter?", "placeholder": "e.g. Door handle, public toilet, raw food, someone who was ill", "required": true }, { "id": "appraisal", "type": "textarea", "label": "What do you believe will happen?", "placeholder": "e.g. I'll get seriously ill, I'll spread germs to my family, I'll be contaminated forever" }, { "id": "disgust", "type": "likert", "label": "Disgust level (0–100)", "min": 0, "max": 100, "step": 5 }, { "id": "danger", "type": "likert", "label": "Actual danger level (0–100)", "min": 0, "max": 100, "step": 5 }] }, { "id": "challenging", "title": "Challenging the Appraisal", "fields": [{ "id": "probability", "type": "textarea", "label": "What is the realistic probability of harm?", "placeholder": "What would a doctor say? What do most people do in this situation?" }, { "id": "disgust-vs-danger", "type": "textarea", "label": "Is this about disgust or genuine danger?", "placeholder": "Would you react this way if you didn't have OCD?" }, { "id": "good-enough", "type": "textarea", "label": "What would 'clean enough' look like for someone without OCD?", "placeholder": "How much washing/cleaning would a non-OCD person do here?" }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "revised-danger", "type": "likert", "label": "Revised danger level (0–100)", "min": 0, "max": 100, "step": 5 }, { "id": "learning", "type": "textarea", "label": "What did you learn?", "placeholder": "Is the issue contamination or the feeling of contamination?" }] }] }$schema$::jsonb,
  true, false, ARRAY['OCD', 'contamination', 'CBT', 'disgust', 'reappraisal', 'cognitive restructuring'], 15, 6, true, 1
);

-- O8: Mental Compulsion Monitoring Log
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'), 'Mental Compulsion Monitoring Log', 'mental-compulsion-monitoring',
  'Track covert / mental compulsions — mental reviewing, counting, praying, reassuring self — which are often missed because they''re invisible.',
  'Mental compulsions are rituals that happen in your head: reviewing whether you locked the door, mentally counting, silently praying, testing your emotional reaction to an intrusion, reassuring yourself. They''re as much a compulsion as hand-washing but harder to spot. This log builds awareness.',
  $schema${ "version": 1, "sections": [{ "id": "log", "title": "Mental Compulsion Log", "fields": [{ "id": "mental-table", "type": "table", "label": "Track covert rituals", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "intrusion", "header": "Triggering Intrusion", "type": "textarea" }, { "id": "mental-ritual", "header": "Mental Compulsion", "type": "textarea" }, { "id": "function", "header": "What Was It Trying to Achieve?", "type": "textarea" }, { "id": "duration", "header": "Duration (mins)", "type": "number", "min": 0 }, { "id": "distress-after", "header": "Distress After (0–10)", "type": "number", "min": 0, "max": 10 }], "min_rows": 1, "max_rows": 14 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "patterns", "type": "textarea", "label": "What do you notice about your mental compulsions?", "placeholder": "How much time do they consume? Do they reduce or maintain anxiety?" }] }] }$schema$::jsonb,
  true, false, ARRAY['OCD', 'mental compulsions', 'covert rituals', 'CBT', 'pure O', 'monitoring'], 10, 7, true, 1
);


-- ============================================================================
-- 3. EATING DISORDERS (E10, E12)
-- ============================================================================

-- E10: Mood Intolerance Module
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Mood Intolerance Module Worksheet', 'mood-intolerance-module',
  'Explore how difficulty tolerating emotions drives eating disorder behaviours — and develop alternative ways to manage intense feelings.',
  'Some people use eating disorder behaviours (bingeing, purging, restricting, exercising) to manage emotions they find intolerable. This worksheet helps you identify the link between emotion and behaviour, and develop alternatives.',
  $schema${ "version": 1, "sections": [{ "id": "episodes", "title": "Mood → Behaviour Link", "fields": [{ "id": "mood-table", "type": "table", "label": "Track the link between mood and eating behaviour", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "emotion", "header": "Emotion / Trigger", "type": "textarea" }, { "id": "intensity", "header": "Intensity (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "ed-behaviour", "header": "ED Behaviour Used", "type": "textarea" }, { "id": "effect", "header": "Effect on Emotion", "type": "textarea" }, { "id": "alternative", "header": "What Could You Do Instead?", "type": "textarea" }], "min_rows": 1, "max_rows": 10 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "patterns", "type": "textarea", "label": "What emotions are hardest to tolerate?", "placeholder": "Which emotions most reliably trigger ED behaviours?" }, { "id": "alternatives", "type": "textarea", "label": "Which alternatives have you tried? What worked?", "placeholder": "Building a toolkit of non-ED ways to manage emotions" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'mood intolerance', 'CBT-E', 'emotional regulation', 'binge triggers'], 15, 10, true, 1
);

-- E12: Body Image Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Body Image Diary', 'body-image-diary',
  'Track daily body image fluctuations alongside mood, context, and eating — to show that body image feelings change and are influenced by mood, not just body size.',
  'Body image changes from hour to hour and day to day — but it''s not your body that''s changing, it''s your emotional state. This diary tracks how you feel about your body alongside mood and context, building evidence that "feeling fat" is an emotion, not a physical fact.',
  $schema${ "version": 1, "sections": [{ "id": "diary", "title": "Body Image Log", "fields": [{ "id": "body-image-table", "type": "table", "label": "Daily body image record", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "body-feeling", "header": "Body Feeling (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "mood", "header": "Mood (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "context", "header": "What Was Happening?", "type": "textarea" }, { "id": "comparison", "header": "Comparing With Anyone?", "type": "text" }], "min_rows": 7, "max_rows": 14 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "mood-body-link", "type": "textarea", "label": "What is the relationship between mood and body image?", "placeholder": "Do they move together? Is 'feeling fat' actually about something else?" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'body image', 'CBT-E', 'mood', 'comparison'], 5, 11, true, 1
);


-- ============================================================================
-- 4. BIPOLAR (Bi6, Bi7)
-- ============================================================================

-- Bi6: Pro-Mania Beliefs Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bipolar-disorder'), 'Pro-Mania Beliefs Worksheet', 'pro-mania-beliefs',
  'Identify and challenge positive beliefs about mania/hypomania that reduce motivation for relapse prevention — e.g. "I''m more creative when high."',
  'Many people with bipolar disorder hold positive beliefs about their elevated states: "I''m more productive," "I''m the real me when high," "The creativity is worth the crash." These beliefs reduce adherence to medication and early intervention. This worksheet helps you examine them honestly.',
  $schema${ "version": 1, "sections": [{ "id": "beliefs", "title": "Positive Beliefs About Elevated Mood", "fields": [{ "id": "beliefs-table", "type": "table", "label": "What do you believe about your highs?", "columns": [{ "id": "belief", "header": "Pro-Mania Belief", "type": "textarea" }, { "id": "conviction", "header": "Conviction (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" }, { "id": "evidence-for", "header": "Evidence For", "type": "textarea" }, { "id": "evidence-against", "header": "Evidence Against (including aftermath)", "type": "textarea" }], "min_rows": 2, "max_rows": 6 }] }, { "id": "full-picture", "title": "The Full Picture", "fields": [{ "id": "aftermath", "type": "textarea", "label": "What typically happens AFTER the high?", "placeholder": "Financial damage? Relationship damage? Depressive crash? Embarrassment? Lost trust?" }, { "id": "revised-view", "type": "textarea", "label": "What is a more balanced view of your highs?", "placeholder": "Can you separate genuine energy/creativity from the destructive elements?" }] }] }$schema$::jsonb,
  true, false, ARRAY['bipolar', 'pro-mania beliefs', 'CBT', 'hypomania', 'medication adherence', 'relapse prevention'], 15, 5, true, 1
);

-- Bi7: Sleep Protection Plan
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bipolar-disorder'), 'Sleep Protection Plan', 'bipolar-sleep-protection-plan',
  'Create a personalised plan for protecting sleep — the single most important modifiable risk factor for mood episodes in bipolar disorder.',
  'Sleep disruption is both a trigger and an early warning sign for mood episodes. This plan helps you establish protective routines, identify sleep threats, and set rules for action when sleep deteriorates.',
  $schema${ "version": 1, "sections": [{ "id": "routine", "title": "My Sleep Routine", "fields": [{ "id": "target-bedtime", "type": "text", "label": "Target bedtime:", "placeholder": "e.g. 10:30pm" }, { "id": "target-wake", "type": "text", "label": "Target wake time:", "placeholder": "e.g. 7:00am" }, { "id": "wind-down", "type": "textarea", "label": "My wind-down routine:", "placeholder": "What do you do in the hour before bed?" }, { "id": "sleep-rules", "type": "textarea", "label": "My non-negotiable sleep rules:", "placeholder": "e.g. No screens after 9:30pm, no caffeine after 2pm, bedroom for sleep only" }] }, { "id": "threats", "title": "Sleep Threats & Responses", "fields": [{ "id": "threats-table", "type": "table", "label": "What threatens your sleep and what to do", "columns": [{ "id": "threat", "header": "Sleep Threat", "type": "textarea" }, { "id": "response", "header": "My Response Plan", "type": "textarea" }], "min_rows": 3, "max_rows": 8 }] }, { "id": "action", "title": "When Sleep Drops Below 6 Hours for 2+ Nights", "fields": [{ "id": "action-plan", "type": "textarea", "label": "What will you do?", "placeholder": "e.g. Contact psychiatrist, take PRN medication, cancel stimulating plans, tell key supporter" }] }] }$schema$::jsonb,
  true, false, ARRAY['bipolar', 'sleep', 'protection', 'CBT', 'relapse prevention', 'circadian rhythm'], 15, 6, true, 1
);


-- ============================================================================
-- 5. BDD (BD4, BD5)
-- ============================================================================

-- BD4: Perceptual Retraining / Photo Experiment
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bdd'), 'Photo Experiment Worksheet', 'bdd-photo-experiment',
  'Compare your mental image of yourself with photographic evidence to test whether the perceived flaw is as visible as you believe.',
  'Like video feedback for social anxiety, this experiment compares your internal image with external evidence. Before viewing a photograph, write down exactly what you expect to see. Then look at the photo and describe what you actually see.',
  $schema${ "version": 1, "sections": [{ "id": "prediction", "title": "Before Viewing", "fields": [{ "id": "predicted-appearance", "type": "textarea", "label": "What do you predict you will see?", "placeholder": "Describe the flaw as you imagine it will appear", "required": true }, { "id": "prediction-conviction", "type": "likert", "label": "How certain are you? (0–100%)", "min": 0, "max": 100, "step": 5 }] }, { "id": "observation", "title": "After Viewing", "fields": [{ "id": "actual-appearance", "type": "textarea", "label": "What do you actually see in the photo?", "placeholder": "Describe only what is objectively visible — stick to facts" }, { "id": "other-features", "type": "textarea", "label": "What other features do you notice?", "placeholder": "What else is in the photo besides the perceived flaw?" }] }, { "id": "reflection", "title": "Discrepancy", "fields": [{ "id": "revised-conviction", "type": "likert", "label": "How visible is the flaw now? (0–100%)", "min": 0, "max": 100, "step": 5 }, { "id": "learning", "type": "textarea", "label": "What is the discrepancy between your mental image and the photo?", "placeholder": "How accurate is the image you carry in your mind?" }] }] }$schema$::jsonb,
  true, false, ARRAY['BDD', 'photo experiment', 'CBT', 'Veale', 'perceptual retraining', 'body image'], 15, 4, true, 1
);

-- BD5: BDD Avoidance Hierarchy
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bdd'), 'BDD Exposure Hierarchy', 'bdd-exposure-hierarchy',
  'Build a hierarchy of appearance-related situations you avoid, ranked by distress, to guide graded exposure.',
  'BDD leads to avoidance of situations where the perceived flaw might be noticed. List avoided situations, rate the distress, and plan a graded approach to facing them.',
  $schema${ "version": 1, "sections": [{ "id": "hierarchy", "title": "BDD Exposure Hierarchy", "fields": [{ "id": "bdd-ladder", "type": "hierarchy", "label": "Avoided appearance-related situations", "columns": [{ "id": "situation", "header": "Situation", "type": "textarea" }, { "id": "distress", "header": "Distress (0–100)", "type": "number", "min": 0, "max": 100 }, { "id": "safety-behaviour", "header": "Safety Behaviour to Drop", "type": "textarea" }, { "id": "completed", "header": "Done?", "type": "text" }], "sort_by": "distress", "sort_direction": "desc", "min_rows": 5, "max_rows": 15, "visualisation": "gradient_bar", "gradient": { "low": "#e8f5e9", "mid": "#e4a930", "high": "#dc2626" } }] }] }$schema$::jsonb,
  true, false, ARRAY['BDD', 'exposure hierarchy', 'avoidance', 'CBT', 'Veale', 'body image'], 15, 5, true, 1
);


-- ============================================================================
-- 6. CHRONIC PAIN (CP7, CP8)
-- ============================================================================

-- CP7: Pain Catastrophising Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Pain Catastrophising Worksheet', 'pain-catastrophising-worksheet',
  'Identify and challenge catastrophic thoughts about pain — helplessness, magnification, and rumination.',
  'Pain catastrophising amplifies the pain experience through three processes: rumination (can''t stop thinking about it), magnification (it''s going to get worse and worse), and helplessness (there''s nothing I can do). This worksheet helps you notice which patterns you fall into and develop more balanced responses.',
  $schema${ "version": 1, "sections": [{ "id": "episodes", "title": "Catastrophising Episodes", "fields": [{ "id": "episode-table", "type": "table", "label": "Track catastrophic pain thoughts", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "pain-level", "header": "Pain (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "catastrophic-thought", "header": "Catastrophic Thought", "type": "textarea" }, { "id": "type", "header": "Type (R/M/H)", "type": "text", "width": "narrow" }, { "id": "balanced-thought", "header": "More Balanced Response", "type": "textarea" }, { "id": "pain-after", "header": "Pain After Reappraisal (0–10)", "type": "number", "min": 0, "max": 10 }], "min_rows": 1, "max_rows": 10 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "pattern", "type": "textarea", "label": "Which type of catastrophising is most common for you?", "placeholder": "Rumination (R), Magnification (M), or Helplessness (H)?" }, { "id": "learning", "type": "textarea", "label": "Does reappraising the thought affect your pain experience?", "placeholder": "What do you notice about the relationship between catastrophic thinking and pain intensity?" }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'catastrophising', 'CBT', 'Sullivan', 'pain management', 'cognitive restructuring'], 10, 7, true, 1
);

-- CP8: Pain Acceptance Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Pain Acceptance Worksheet', 'pain-acceptance-worksheet',
  'Explore the difference between struggling against pain and accepting its presence while engaging in valued activities — a key shift in chronic pain management.',
  'Acceptance doesn''t mean giving up or liking pain. It means stopping the fight against pain so you can redirect energy toward living well despite it. This worksheet helps you explore what you''re currently fighting, what that costs you, and what acceptance might look like in practice.',
  $schema${ "version": 1, "sections": [{ "id": "struggle", "title": "The Struggle", "fields": [{ "id": "fighting", "type": "textarea", "label": "What are you fighting against?", "placeholder": "e.g. The unfairness of it, the loss of my old life, the pain itself, the uncertainty" }, { "id": "cost", "type": "textarea", "label": "What does the fight cost you?", "placeholder": "Energy, mood, relationships, activities, quality of life?" }] }, { "id": "acceptance", "title": "Exploring Acceptance", "fields": [{ "id": "not-acceptance", "type": "textarea", "label": "What acceptance does NOT mean:", "placeholder": "e.g. It doesn't mean giving up, liking pain, pretending it's fine, stopping treatment" }, { "id": "does-mean", "type": "textarea", "label": "What acceptance COULD mean:", "placeholder": "e.g. Acknowledging pain is here today without fighting it, choosing to do valued activities alongside pain" }] }, { "id": "values", "title": "Living Alongside Pain", "fields": [{ "id": "willing", "type": "textarea", "label": "What would you be willing to do this week, even with pain present?", "placeholder": "What valued activity could you engage in without waiting for pain to disappear?" }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'acceptance', 'ACT', 'CBT', 'pain management', 'values'], 15, 8, true, 1
);


-- ============================================================================
-- 7. PSYCHOSIS (Ps5, Ps6)
-- ============================================================================

-- Ps5: Normalising Psychotic Experiences
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'psychosis-cbtp'), 'Normalising Unusual Experiences', 'normalising-unusual-experiences',
  'Explore how common unusual experiences are in the general population — and how context, stress, and sleep deprivation can produce them in anyone.',
  'Many experiences associated with psychosis (hearing voices, unusual beliefs, paranoia, perceptual disturbances) exist on a continuum and are surprisingly common in the general population, especially during stress, sleep deprivation, or bereavement. This worksheet helps normalise your experiences without dismissing them.',
  $schema${ "version": 1, "sections": [{ "id": "experience", "title": "My Experience", "fields": [{ "id": "description", "type": "textarea", "label": "What experience would you like to understand better?", "placeholder": "e.g. Hearing voices, feeling paranoid, unusual beliefs", "required": true }, { "id": "how-unusual", "type": "likert", "label": "How unusual do you think this experience is? (0–100)", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Very common", "50": "Somewhat unusual", "100": "Completely unique to me" } }] }, { "id": "normalising", "title": "Normalising Information", "fields": [{ "id": "continuum", "type": "textarea", "label": "What did you learn about how common this experience is?", "placeholder": "e.g. 5–15% of people hear voices, paranoid thoughts are common under stress, bereavement hallucinations occur in ~50% of bereaved people" }, { "id": "context", "type": "textarea", "label": "What context might have made you more vulnerable?", "placeholder": "e.g. Sleep deprivation, stress, substance use, isolation, trauma history" }] }, { "id": "reflection", "title": "Revised View", "fields": [{ "id": "revised-unusual", "type": "likert", "label": "How unusual does the experience feel now? (0–100)", "min": 0, "max": 100, "step": 5 }, { "id": "meaning", "type": "textarea", "label": "Does this change what the experience means to you?", "placeholder": "If it's more common than you thought, what does that suggest?" }] }] }$schema$::jsonb,
  true, false, ARRAY['psychosis', 'CBTp', 'normalising', 'voices', 'continuum', 'unusual experiences'], 15, 3, true, 1
);

-- Ps6: Coping Strategy Enhancement Log
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'psychosis-cbtp'), 'Coping Strategy Enhancement Log', 'coping-strategy-enhancement',
  'Systematically evaluate and build on existing coping strategies for managing distressing psychotic experiences.',
  'You already cope with your experiences in various ways. Some strategies work better than others. This log helps you identify what you''re already doing, rate how well each strategy works, and experiment with enhancing or adding strategies.',
  $schema${ "version": 1, "sections": [{ "id": "current-strategies", "title": "Current Coping Strategies", "fields": [{ "id": "strategies-table", "type": "table", "label": "What do you currently do to cope?", "columns": [{ "id": "strategy", "header": "Strategy", "type": "textarea" }, { "id": "when-used", "header": "When Do You Use It?", "type": "textarea" }, { "id": "effectiveness", "header": "How Well Does It Work? (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "downside", "header": "Any Downsides?", "type": "textarea" }], "min_rows": 3, "max_rows": 10 }] }, { "id": "new-strategies", "title": "Strategies to Try", "fields": [{ "id": "new-table", "type": "table", "label": "New strategies to experiment with", "columns": [{ "id": "strategy", "header": "Strategy to Try", "type": "textarea" }, { "id": "tried", "header": "Tried?", "type": "text", "width": "narrow" }, { "id": "result", "header": "How Did It Go?", "type": "textarea" }], "min_rows": 2, "max_rows": 6 }] }] }$schema$::jsonb,
  true, false, ARRAY['psychosis', 'CBTp', 'coping strategies', 'voices', 'enhancement'], 10, 4, true, 1
);


-- ============================================================================
-- 8. DEPRESSION (D9, D10)
-- ============================================================================

-- D9: Pleasure Predicting Experiment
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'), 'Pleasure Predicting Experiment', 'pleasure-predicting-experiment',
  'Test the depressive prediction that "nothing will be enjoyable" by predicting pleasure before activities and comparing with actual experience.',
  'Depression tells you nothing will be enjoyable, so why bother. This experiment tests that prediction: before each activity, predict how much pleasure you''ll get, then rate the actual experience. Most people find the reality exceeds the prediction.',
  $schema${ "version": 1, "sections": [{ "id": "experiments", "title": "Pleasure Prediction Tests", "fields": [{ "id": "prediction-table", "type": "table", "label": "Predict then compare", "columns": [{ "id": "activity", "header": "Activity", "type": "textarea" }, { "id": "predicted-pleasure", "header": "Predicted Pleasure (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "actual-pleasure", "header": "Actual Pleasure (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "difference", "header": "Difference", "type": "text", "width": "narrow" }], "min_rows": 5, "max_rows": 14 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "pattern", "type": "textarea", "label": "What did you notice?", "placeholder": "Were activities more or less enjoyable than predicted? What does this tell you about trusting depressive predictions?" }] }] }$schema$::jsonb,
  true, false, ARRAY['depression', 'pleasure predicting', 'behavioural experiment', 'CBT', 'anhedonia', 'behavioural activation'], 10, 7, true, 1
);

-- D10: Compassionate Mind Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'), 'Compassionate Letter to Self', 'compassionate-letter-to-self',
  'Write a letter to yourself from the perspective of a compassionate, wise observer — addressing your struggles with understanding rather than criticism.',
  'Imagine a compassionate observer who understands your full history, sees your struggles clearly, and feels warmth toward you without judgement. Write a letter from their perspective to you, addressing a current difficulty. This is not about being unrealistically positive — it''s about being honest and kind.',
  $schema${ "version": 1, "sections": [{ "id": "context", "title": "What Are You Struggling With?", "fields": [{ "id": "difficulty", "type": "textarea", "label": "What situation or feeling is troubling you?", "placeholder": "Describe what you're going through", "required": true }, { "id": "self-criticism", "type": "textarea", "label": "What is the self-critical voice saying?", "placeholder": "What are you telling yourself about this?" }] }, { "id": "letter", "title": "Compassionate Letter", "fields": [{ "id": "letter-text", "type": "textarea", "label": "Write a letter from your compassionate observer:", "placeholder": "Dear [your name],\n\nI can see that you're going through a difficult time..." }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "mood-before", "type": "likert", "label": "Mood before writing (0–10)", "min": 0, "max": 10, "step": 1 }, { "id": "mood-after", "type": "likert", "label": "Mood after reading the letter (0–10)", "min": 0, "max": 10, "step": 1 }, { "id": "learning", "type": "textarea", "label": "What was it like to receive this perspective?", "placeholder": "What did the compassionate observer say that the self-critical voice doesn't?" }] }] }$schema$::jsonb,
  true, false, ARRAY['depression', 'compassion', 'Gilbert', 'CBT', 'self-criticism', 'compassionate mind', 'letter'], 20, 8, true, 1
);


-- ============================================================================
-- DONE.
-- ============================================================================
-- Expected: 17 new rows inserted
-- All new slugs — no overwrites
-- Low Self-Esteem gets dedicated formulation + 2 tools
-- Completes the full Formulate worksheet library
--
-- GRAND TOTAL ACROSS ALL 4 BATCHES:
--   Batch 1: 21 worksheets (6 overwrites + 15 new)
--   Batch 2: 33 worksheets (5 overwrites + 28 new)
--   Batch 3: 47 worksheets (all new)
--   Batch 4: 17 worksheets (all new)
--   = 118 worksheets generated
--   + ~9 untouched existing worksheets
--   = ~127 total worksheet library
--
-- Categories: 16 disorder domains
-- Schema version: All v1
-- Language: British English throughout
-- Field types used: text, textarea, number, likert, checklist, select,
--                   date, table, hierarchy, computed, record, formulation
-- Unused field types: time, safety_plan, decision_tree
--   (safety_plan exists via existing safety-plan worksheet;
--    decision_tree exists via existing worry-decision-tree)

COMMIT;
