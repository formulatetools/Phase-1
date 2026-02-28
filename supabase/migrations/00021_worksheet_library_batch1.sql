-- ============================================================================
-- FORMULATE — Batch 1: A1 MVP Library (21 Worksheets)
-- ============================================================================
-- Generated from Phase 2 output + Worksheet Schema Reference
-- All schemas: version 1, British English, clinical accuracy priority
-- Run as a single transaction against the Formulate database
-- ============================================================================

BEGIN;

-- ============================================================================
-- CROSSWALK: Existing worksheets vs Batch 1
-- ============================================================================
--
-- OVERWRITE (delete + reinsert with same or updated slug):
--   behavioural-experiment-planner  →  T1  Behavioural Experiment Worksheet
--   relapse-prevention-plan         →  T6  Relapse Prevention Blueprint
--   depression-formulation          →  D1  Depression Formulation (Beck)
--   ocd-vicious-flower-formulation  →  O1  OCD Formulation (Salkovskis)
--   panic-diary                     →  P2  Panic Diary
--   positive-data-log               →  T10 Positive Data Log
--
-- NEW (no existing equivalent):
--   T2  Safety Behaviours Identification & Drop Plan
--   T3  Theory A vs Theory B
--   T4  Responsibility Pie Chart
--   T5  Cost-Benefit Analysis
--   T7  Exposure Practice Record
--   T8  Graded Exposure / Avoidance Hierarchy
--   T9  Problem-Solving Worksheet
--   T11 Early Warning Signs & Action Plan
--   G1  GAD Metacognitive Formulation (Wells)
--   P1  Panic Formulation (Clark)
--   S1  Social Anxiety Formulation (Clark & Wells)
--   PT1 PTSD Formulation (Ehlers & Clark)
--   P4  Interoceptive Exposure Record
--   S3  Video Feedback Worksheet
--   PT5 Trigger Discrimination Worksheet (Then vs Now)
--
-- UNTOUCHED (exist, not in Batch 1 — update in later batches):
--   5-column-thought-record, 7-column-thought-record,
--   cognitive-distortions-checklist, values-assessment,
--   cross-sectional-formulation, longitudinal-formulation,
--   safety-plan, behavioural-activation-schedule, activity-mood-diary,
--   worry-log, worry-decision-tree, tolerating-uncertainty-practice,
--   erp-hierarchy-builder, erp-practice-record, social-situation-record,
--   health-anxiety-monitoring-log, trauma-impact-statement,
--   grounding-techniques-practice, low-self-esteem-formulation
--
-- CONSOLIDATION DECISIONS:
--   T8 is a NEW generic hierarchy (graded-exposure-hierarchy).
--     erp-hierarchy-builder stays as-is for now — update in Batch 2 (O3).
--   T6 absorbs the existing relapse-prevention-plan slug.
--     Disorder-specific blueprints (P7, O7, H7, E11) will use T6 with
--     clinical_context in later batches, not standalone worksheets.
--   O1 uses Salkovskis cycle model, NOT vicious flower.
--     Old ocd-vicious-flower-formulation is deleted. Generic vicious flower
--     remains available via cross-sectional-formulation for maintenance use.
-- ============================================================================


-- ============================================================================
-- 1. CATEGORY SETUP
-- ============================================================================
-- Create any categories that don't yet exist. ON CONFLICT = already exists.

INSERT INTO categories (id, name, slug, icon, display_order)
VALUES
  (gen_random_uuid(), 'Social Anxiety', 'social-anxiety', 'users', 5),
  (gen_random_uuid(), 'Health Anxiety', 'health-anxiety', 'activity', 6),
  (gen_random_uuid(), 'Panic Disorder', 'panic-disorder', 'zap', 7),
  (gen_random_uuid(), 'PTSD / Trauma', 'ptsd-trauma', 'shield', 8),
  (gen_random_uuid(), 'Low Self-Esteem', 'low-self-esteem', 'message-circle', 9)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 2. DELETE WORKSHEETS BEING OVERWRITTEN
-- ============================================================================

DELETE FROM worksheets WHERE slug IN (
  'behavioural-experiment-planner',
  'relapse-prevention-plan',
  'depression-formulation',
  'ocd-vicious-flower-formulation',
  'panic-diary',
  'positive-data-log'
);


-- ============================================================================
-- 3. TRANSDIAGNOSTIC WORKSHEETS (T1–T11)
-- ============================================================================

-- --------------------------------------------------------
-- T1: Behavioural Experiment Worksheet
-- Slug: behavioural-experiment-planner (overwrites existing)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Behavioural Experiment Worksheet',
  'behavioural-experiment-planner',
  'Design, carry out, and reflect on behavioural experiments to test anxious predictions and unhelpful beliefs.',
  'Use this worksheet to test a specific prediction or belief. First, write down exactly what you expect will happen and how strongly you believe it. Then plan an experiment to test it. After the experiment, record what actually happened and what you learned. You can add multiple experiments to track a pattern of learning over time.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "context",
      "title": "Belief or Prediction to Test",
      "fields": [
        {
          "id": "target-belief",
          "type": "textarea",
          "label": "What belief or prediction are you testing?",
          "placeholder": "e.g. If I say something wrong in the meeting, everyone will think I'm incompetent",
          "required": true
        }
      ]
    },
    {
      "id": "experiments",
      "title": "Experiments",
      "fields": [
        {
          "id": "experiment-record",
          "type": "record",
          "label": "Behavioural Experiment",
          "min_records": 1,
          "max_records": 10,
          "groups": [
            {
              "id": "prediction",
              "header": "Prediction",
              "width": "normal",
              "fields": [
                { "id": "specific-prediction", "type": "textarea", "placeholder": "What specifically do you predict will happen?" },
                { "id": "belief-before", "type": "likert", "label": "Belief strength", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Don't believe it", "50": "Half and half", "100": "Completely believe it" } }
              ]
            },
            {
              "id": "plan",
              "header": "Experiment Plan",
              "width": "normal",
              "fields": [
                { "id": "what", "type": "textarea", "placeholder": "What will you do? Where? When? With whom?" },
                { "id": "safety-behaviours", "type": "textarea", "placeholder": "Any safety behaviours to drop during the experiment?" }
              ]
            },
            {
              "id": "outcome",
              "header": "What Happened",
              "width": "normal",
              "fields": [
                { "id": "actual-outcome", "type": "textarea", "placeholder": "Describe what actually happened" },
                { "id": "belief-after", "type": "likert", "label": "Belief strength now", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Don't believe it", "50": "Half and half", "100": "Completely believe it" } }
              ]
            },
            {
              "id": "learning",
              "header": "Learning",
              "width": "normal",
              "fields": [
                { "id": "what-learned", "type": "textarea", "placeholder": "What does this tell you about your original prediction?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Overall Reflection",
      "fields": [
        {
          "id": "pattern",
          "type": "textarea",
          "label": "What pattern do you notice across your experiments?",
          "placeholder": "Are your predictions usually accurate? What keeps surprising you?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['behavioural experiments', 'CBT', 'belief testing', 'cognitive restructuring', 'anxiety'],
  20, 4, true, 1
);


-- --------------------------------------------------------
-- T2: Safety Behaviours Identification & Drop Plan
-- Slug: safety-behaviours-drop-plan (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Safety Behaviours Identification & Drop Plan',
  'safety-behaviours-drop-plan',
  'Identify safety behaviours that maintain anxiety, understand their costs, and plan experiments to gradually drop them.',
  'Safety behaviours are things you do to prevent a feared outcome or manage anxiety in the moment. While they feel helpful, they actually maintain anxiety by preventing you from learning that you can cope without them. Use this worksheet to identify your safety behaviours, understand what they cost you, and plan how to test dropping them.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "context",
      "title": "The Feared Situation",
      "fields": [
        {
          "id": "situation",
          "type": "textarea",
          "label": "What situation triggers your anxiety?",
          "placeholder": "e.g. Speaking in meetings, going to the supermarket, being around contamination",
          "required": true
        },
        {
          "id": "feared-outcome",
          "type": "textarea",
          "label": "What do you fear will happen without your safety behaviours?",
          "placeholder": "e.g. I'll have a panic attack and collapse, people will see I'm anxious and judge me"
        }
      ]
    },
    {
      "id": "safety-behaviours",
      "title": "Safety Behaviours",
      "fields": [
        {
          "id": "behaviours-table",
          "type": "table",
          "label": "List each safety behaviour, what it costs you, and your plan for dropping it",
          "columns": [
            { "id": "behaviour", "header": "Safety Behaviour", "type": "textarea" },
            { "id": "function", "header": "What It's Supposed to Prevent", "type": "textarea" },
            { "id": "cost", "header": "What It Actually Costs Me", "type": "textarea" },
            { "id": "drop-plan", "header": "Plan for Dropping It", "type": "textarea" }
          ],
          "min_rows": 1,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "experiment",
      "title": "Drop Experiment",
      "fields": [
        {
          "id": "which-behaviour",
          "type": "textarea",
          "label": "Which safety behaviour will you drop first?",
          "placeholder": "Start with the one that feels most manageable"
        },
        {
          "id": "prediction",
          "type": "textarea",
          "label": "What do you predict will happen without it?",
          "placeholder": "Be specific — what exactly do you fear?"
        },
        {
          "id": "prediction-belief",
          "type": "likert",
          "label": "How strongly do you believe this prediction?",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        },
        {
          "id": "what-happened",
          "type": "textarea",
          "label": "What actually happened?",
          "placeholder": "Describe the outcome after dropping the safety behaviour"
        },
        {
          "id": "learning",
          "type": "textarea",
          "label": "What did you learn?",
          "placeholder": "What does this tell you about the necessity of the safety behaviour?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['safety behaviours', 'CBT', 'anxiety maintenance', 'behavioural experiments', 'avoidance'],
  15, 10, true, 1
);


-- --------------------------------------------------------
-- T3: Theory A vs Theory B
-- Slug: theory-a-vs-theory-b (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Theory A vs Theory B',
  'theory-a-vs-theory-b',
  'Compare two explanations for your difficulties — the threat-based explanation (Theory A) and the anxiety-based explanation (Theory B) — to guide treatment focus.',
  'This worksheet helps you step back and consider two possible explanations for your experience. Theory A is usually the explanation your anxiety gives you (e.g. "I have a serious illness"). Theory B is an alternative explanation (e.g. "I have a problem with health anxiety"). For each theory, list the supporting evidence, then consider which theory better fits the facts and what each theory suggests you should do about it.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "problem",
      "title": "The Problem",
      "fields": [
        {
          "id": "presenting-problem",
          "type": "textarea",
          "label": "What is the problem you're trying to understand?",
          "placeholder": "e.g. I keep worrying that physical symptoms mean I have a serious illness",
          "required": true
        }
      ]
    },
    {
      "id": "theories",
      "title": "Two Theories",
      "layout": "four_quadrant",
      "fields": [
        {
          "id": "theory-a",
          "type": "textarea",
          "label": "Theory A (The threat is real)",
          "placeholder": "e.g. I have a serious undiagnosed illness and the symptoms are proof of this",
          "domain": "behaviour"
        },
        {
          "id": "theory-b",
          "type": "textarea",
          "label": "Theory B (I have an anxiety problem)",
          "placeholder": "e.g. I have a problem with health anxiety that makes me misinterpret normal body sensations",
          "domain": "thoughts"
        },
        {
          "id": "evidence-a",
          "type": "textarea",
          "label": "Evidence for Theory A",
          "placeholder": "List everything that supports the threat being real",
          "domain": "behaviour"
        },
        {
          "id": "evidence-b",
          "type": "textarea",
          "label": "Evidence for Theory B",
          "placeholder": "List everything that supports this being an anxiety problem",
          "domain": "thoughts"
        }
      ]
    },
    {
      "id": "implications",
      "title": "What Each Theory Suggests",
      "fields": [
        {
          "id": "if-a-true",
          "type": "textarea",
          "label": "If Theory A is true, what should I do?",
          "placeholder": "e.g. Keep checking, seek more tests, avoid triggers"
        },
        {
          "id": "if-b-true",
          "type": "textarea",
          "label": "If Theory B is true, what should I do?",
          "placeholder": "e.g. Reduce checking, test out my fears, learn to tolerate uncertainty"
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "which-fits",
          "type": "textarea",
          "label": "Which theory better fits the overall evidence?",
          "placeholder": "Consider: what have doctors said? What happens when you check/don't check? How long has this been going on?"
        },
        {
          "id": "commitment",
          "type": "textarea",
          "label": "What will you do differently based on this?",
          "placeholder": "What's one step you can take to act in line with Theory B this week?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['theory a theory b', 'CBT', 'health anxiety', 'OCD', 'cognitive restructuring', 'formulation'],
  15, 11, true, 1
);


-- --------------------------------------------------------
-- T4: Responsibility Pie Chart
-- Slug: responsibility-pie-chart (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Responsibility Pie Chart',
  'responsibility-pie-chart',
  'Challenge inflated responsibility by listing all contributing factors to a negative event and assigning realistic percentages.',
  'When something goes wrong, it''s common to take on too much responsibility. This worksheet helps you step back and consider ALL the factors that contributed — other people, circumstances, chance, timing — before assigning your own share. Start by listing every other possible contributing factor and giving each a percentage. Only assign your own responsibility last, using whatever percentage remains.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "event",
      "title": "The Event",
      "fields": [
        {
          "id": "what-happened",
          "type": "textarea",
          "label": "What happened that you feel responsible for?",
          "placeholder": "Describe the event or outcome",
          "required": true
        },
        {
          "id": "initial-responsibility",
          "type": "likert",
          "label": "How responsible do you feel right now? (0–100%)",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Partly", "100": "Entirely my fault" }
        }
      ]
    },
    {
      "id": "factors",
      "title": "All Contributing Factors",
      "description": "List every other factor that contributed, no matter how small. Assign percentages to these FIRST. Leave yourself until last.",
      "fields": [
        {
          "id": "factors-table",
          "type": "table",
          "label": "Contributing factors (list others before yourself)",
          "columns": [
            { "id": "factor", "header": "Contributing Factor", "type": "textarea" },
            { "id": "percentage", "header": "%", "type": "number", "min": 0, "max": 100, "suffix": "%", "width": "narrow" }
          ],
          "min_rows": 3,
          "max_rows": 12
        },
        {
          "id": "total",
          "type": "computed",
          "label": "Total responsibility assigned",
          "computation": { "operation": "sum", "field": "factors-table.percentage", "format": "integer" }
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "revised-responsibility",
          "type": "likert",
          "label": "Having considered all factors, how responsible do you now feel? (0–100%)",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Partly", "100": "Entirely my fault" }
        },
        {
          "id": "responsibility-change",
          "type": "computed",
          "label": "Change in perceived responsibility",
          "computation": { "operation": "difference", "field_a": "initial-responsibility", "field_b": "revised-responsibility", "format": "percentage_change" }
        },
        {
          "id": "learning",
          "type": "textarea",
          "label": "What do you notice about your share of responsibility now?",
          "placeholder": "How does seeing all the contributing factors change your perspective?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['responsibility pie', 'CBT', 'cognitive restructuring', 'depression', 'OCD', 'guilt'],
  15, 12, true, 1
);


-- --------------------------------------------------------
-- T5: Cost-Benefit Analysis
-- Slug: cost-benefit-analysis (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Cost-Benefit Analysis',
  'cost-benefit-analysis',
  'Weigh up the short-term and long-term advantages and disadvantages of a behaviour, belief, or decision.',
  'Use this worksheet when you''re stuck in a pattern and need to step back and evaluate whether it''s serving you. Consider the behaviour or belief you want to analyse, then fill in each quadrant: short-term advantages, short-term disadvantages, long-term advantages, and long-term disadvantages. This helps make the hidden costs visible.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "target",
      "title": "What Are You Analysing?",
      "fields": [
        {
          "id": "behaviour-or-belief",
          "type": "textarea",
          "label": "What behaviour, belief, or pattern are you weighing up?",
          "placeholder": "e.g. Avoiding social situations, checking behaviour, staying in bed all day",
          "required": true
        }
      ]
    },
    {
      "id": "analysis",
      "title": "Costs and Benefits",
      "layout": "four_quadrant",
      "fields": [
        {
          "id": "short-term-advantages",
          "type": "textarea",
          "label": "Short-Term Advantages",
          "placeholder": "What do I gain right now from this?",
          "domain": "thoughts"
        },
        {
          "id": "short-term-disadvantages",
          "type": "textarea",
          "label": "Short-Term Disadvantages",
          "placeholder": "What does it cost me right now?",
          "domain": "emotions"
        },
        {
          "id": "long-term-advantages",
          "type": "textarea",
          "label": "Long-Term Advantages",
          "placeholder": "What will I gain in the long run if I keep this up?",
          "domain": "thoughts"
        },
        {
          "id": "long-term-disadvantages",
          "type": "textarea",
          "label": "Long-Term Disadvantages",
          "placeholder": "What will it cost me in the long run?",
          "domain": "emotions"
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "overall",
          "type": "textarea",
          "label": "Looking at the full picture, does this behaviour serve you?",
          "placeholder": "Which quadrant carries the most weight for you?"
        },
        {
          "id": "alternative",
          "type": "textarea",
          "label": "What could you do differently?",
          "placeholder": "Is there an alternative that keeps the benefits but reduces the costs?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['cost-benefit analysis', 'CBT', 'motivation', 'decision making', 'ambivalence'],
  10, 13, true, 1
);


-- --------------------------------------------------------
-- T6: Relapse Prevention Blueprint
-- Slug: relapse-prevention-plan (overwrites existing)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Relapse Prevention Blueprint',
  'relapse-prevention-plan',
  'A comprehensive plan for maintaining progress after therapy — covering warning signs, coping strategies, and an action plan for setbacks.',
  'Complete this blueprint towards the end of therapy to consolidate what you''ve learned and prepare for life after sessions. It covers your early warning signs, the strategies that work for you, what to do if things start slipping, and who can support you. Keep this somewhere accessible — it''s your personal instruction manual for staying well.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "therapy-summary",
      "title": "What I've Learned in Therapy",
      "fields": [
        {
          "id": "key-problem",
          "type": "textarea",
          "label": "My main problem was:",
          "placeholder": "Brief summary of the difficulty that brought you to therapy"
        },
        {
          "id": "understanding",
          "type": "textarea",
          "label": "I now understand that:",
          "placeholder": "What did you learn about how the problem was maintained?"
        },
        {
          "id": "what-helped",
          "type": "textarea",
          "label": "The things that helped most were:",
          "placeholder": "Techniques, insights, or changes that made the biggest difference"
        }
      ]
    },
    {
      "id": "warning-signs",
      "title": "My Early Warning Signs",
      "description": "These are the signals that things might be starting to slip. Catching them early is key.",
      "fields": [
        {
          "id": "signs-checklist",
          "type": "checklist",
          "label": "Common warning signs (tick any that apply to you)",
          "options": [
            { "id": "withdrawal", "label": "Withdrawing from people or activities" },
            { "id": "sleep", "label": "Changes in sleep pattern" },
            { "id": "avoidance", "label": "Returning to avoidance" },
            { "id": "negative-thoughts", "label": "Increase in negative thinking" },
            { "id": "safety-behaviours", "label": "Resuming safety behaviours or rituals" },
            { "id": "mood", "label": "Persistent low mood or increased anxiety" },
            { "id": "self-care", "label": "Neglecting self-care (exercise, eating, routine)" },
            { "id": "substances", "label": "Increased use of alcohol or other substances" }
          ]
        },
        {
          "id": "personal-signs",
          "type": "textarea",
          "label": "My personal warning signs (ones specific to me):",
          "placeholder": "What are the earliest signals YOU notice when things start to dip?"
        }
      ]
    },
    {
      "id": "coping-strategies",
      "title": "My Coping Toolkit",
      "fields": [
        {
          "id": "strategies-table",
          "type": "table",
          "label": "Strategies that work for me",
          "columns": [
            { "id": "strategy", "header": "Strategy / Technique", "type": "textarea" },
            { "id": "when-to-use", "header": "When to Use It", "type": "textarea" },
            { "id": "effectiveness", "header": "How Well It Works (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 3,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "action-plan",
      "title": "My Action Plan for Setbacks",
      "description": "Setbacks are normal — they are not the same as relapse. Having a plan makes them manageable.",
      "fields": [
        {
          "id": "first-steps",
          "type": "textarea",
          "label": "If I notice warning signs, the first thing I will do is:",
          "placeholder": "e.g. Re-read this blueprint, use a thought record, go for a walk"
        },
        {
          "id": "if-persists",
          "type": "textarea",
          "label": "If things don't improve within a week, I will:",
          "placeholder": "e.g. Contact my GP, rebook a therapy session, speak to a trusted friend"
        },
        {
          "id": "emergency",
          "type": "textarea",
          "label": "In a crisis, I will:",
          "placeholder": "e.g. Call Samaritans (116 123), go to A&E, call my crisis contact"
        }
      ]
    },
    {
      "id": "support-network",
      "title": "My Support Network",
      "fields": [
        {
          "id": "contacts-table",
          "type": "table",
          "label": "People who can support me",
          "columns": [
            { "id": "name", "header": "Name", "type": "text" },
            { "id": "relationship", "header": "Relationship", "type": "text" },
            { "id": "how-they-help", "header": "How They Can Help", "type": "textarea" },
            { "id": "contact", "header": "Contact Details", "type": "text" }
          ],
          "min_rows": 1,
          "max_rows": 6
        }
      ]
    },
    {
      "id": "commitment",
      "title": "My Commitment",
      "fields": [
        {
          "id": "ongoing-practice",
          "type": "textarea",
          "label": "To maintain my progress, I commit to:",
          "placeholder": "e.g. Continuing weekly behavioural experiments, keeping a regular routine, exercising 3x per week"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['relapse prevention', 'CBT', 'therapy ending', 'maintenance', 'coping strategies', 'blueprint'],
  20, 6, true, 1
);


-- --------------------------------------------------------
-- T7: Exposure Practice Record
-- Slug: exposure-practice-record (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Exposure Practice Record',
  'exposure-practice-record',
  'Log exposure exercises with SUDS ratings, safety behaviours dropped, and key learning points.',
  'Use this after each exposure practice to record what you did, how anxious you felt, whether you dropped any safety behaviours, and most importantly what you learned. Tracking your exposures helps you see progress over time and build confidence that you can tolerate anxiety without it lasting forever.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "records",
      "title": "Exposure Records",
      "fields": [
        {
          "id": "exposure-record",
          "type": "record",
          "label": "Exposure Practice Entry",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "situation",
              "header": "Exposure",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "description", "type": "textarea", "placeholder": "What did you do? Be specific." }
              ]
            },
            {
              "id": "ratings",
              "header": "Anxiety (SUDS 0–100)",
              "width": "narrow",
              "fields": [
                { "id": "suds-before", "type": "likert", "label": "Before", "min": 0, "max": 100, "step": 5 },
                { "id": "suds-peak", "type": "likert", "label": "Peak", "min": 0, "max": 100, "step": 5 },
                { "id": "suds-after", "type": "likert", "label": "After", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "behaviours",
              "header": "Safety Behaviours",
              "width": "normal",
              "fields": [
                { "id": "dropped", "type": "textarea", "placeholder": "Which safety behaviours did you drop?" },
                { "id": "kept", "type": "textarea", "placeholder": "Any you kept? (Be honest — this helps planning)" }
              ]
            },
            {
              "id": "learning",
              "header": "Learning",
              "width": "normal",
              "fields": [
                { "id": "what-learned", "type": "textarea", "placeholder": "What did you learn from this exposure?" }
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
        {
          "id": "progress",
          "type": "textarea",
          "label": "What patterns do you notice across your exposure practices?",
          "placeholder": "Is anxiety peaking lower? Lasting less time? Are you dropping more safety behaviours?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['exposure', 'CBT', 'SUDS', 'graded exposure', 'anxiety', 'safety behaviours', 'habituation'],
  10, 14, true, 1
);


-- --------------------------------------------------------
-- T8: Graded Exposure / Avoidance Hierarchy
-- Slug: graded-exposure-hierarchy (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Graded Exposure / Avoidance Hierarchy',
  'graded-exposure-hierarchy',
  'Build a hierarchy of feared situations ranked by anxiety level, from least to most challenging, to guide graded exposure work.',
  'List situations you avoid or find anxiety-provoking, and rate how anxious each one makes you (0–100 SUDS). The list will automatically sort from most to least anxiety-provoking, creating a visual ladder. Start exposure work from the bottom of the ladder and work your way up as confidence builds.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "context",
      "title": "What Are You Working On?",
      "fields": [
        {
          "id": "target-fear",
          "type": "textarea",
          "label": "What fear or avoidance pattern is this hierarchy for?",
          "placeholder": "e.g. Fear of public speaking, avoidance of social situations, contamination anxiety",
          "required": true
        },
        {
          "id": "goal",
          "type": "textarea",
          "label": "What would you like to be able to do by the end?",
          "placeholder": "e.g. Give a presentation to 20 people without avoiding or using safety behaviours"
        }
      ]
    },
    {
      "id": "hierarchy",
      "title": "Exposure Hierarchy",
      "fields": [
        {
          "id": "exposure-ladder",
          "type": "hierarchy",
          "label": "Feared Situations",
          "columns": [
            { "id": "situation", "header": "Situation", "type": "textarea" },
            { "id": "suds", "header": "SUDS (0–100)", "type": "number", "min": 0, "max": 100 },
            { "id": "completed", "header": "Done?", "type": "text" }
          ],
          "sort_by": "suds",
          "sort_direction": "desc",
          "min_rows": 5,
          "max_rows": 15,
          "visualisation": "gradient_bar",
          "gradient": {
            "low": "#e8f5e9",
            "mid": "#e4a930",
            "high": "#dc2626"
          }
        },
        {
          "id": "step-count",
          "type": "computed",
          "label": "Total steps in hierarchy",
          "computation": { "operation": "count", "field": "exposure-ladder" }
        }
      ]
    },
    {
      "id": "coping",
      "title": "Coping Strategies",
      "fields": [
        {
          "id": "coping-strategies",
          "type": "checklist",
          "label": "Strategies to use during exposures (not safety behaviours)",
          "options": [
            { "id": "mindfulness", "label": "Mindful awareness — observe anxiety without reacting" },
            { "id": "acceptance", "label": "Accept uncertainty — tolerate not knowing the outcome" },
            { "id": "urge-surfing", "label": "Urge surfing — ride the wave of discomfort" },
            { "id": "values", "label": "Connect to values — remind yourself why this matters" },
            { "id": "self-compassion", "label": "Self-compassion — acknowledge the difficulty" },
            { "id": "grounding", "label": "Grounding — focus on what you can see, hear, touch" }
          ]
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['graded exposure', 'hierarchy', 'avoidance', 'fear ladder', 'SUDS', 'CBT', 'phobia', 'anxiety'],
  20, 15, true, 1
);


-- --------------------------------------------------------
-- T9: Problem-Solving Worksheet
-- Slug: problem-solving-worksheet (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Problem-Solving Worksheet',
  'problem-solving-worksheet',
  'Work through a structured problem-solving process: define the problem, brainstorm solutions, evaluate options, and create an action plan.',
  'This worksheet guides you through a step-by-step problem-solving approach. Start by defining the problem as specifically as possible. Then brainstorm as many solutions as you can without judging them. Next, evaluate the pros and cons of each option. Finally, choose one and make a concrete plan. Come back to review how it went.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "define",
      "title": "Step 1: Define the Problem",
      "fields": [
        {
          "id": "problem",
          "type": "textarea",
          "label": "What is the problem? Be as specific as possible.",
          "placeholder": "e.g. I need to have a difficult conversation with my manager about my workload, and I keep putting it off",
          "required": true
        },
        {
          "id": "goal",
          "type": "textarea",
          "label": "What outcome would you like?",
          "placeholder": "What would 'solved' look like?"
        }
      ]
    },
    {
      "id": "brainstorm",
      "title": "Step 2: Brainstorm Solutions",
      "description": "List every possible solution — don't judge or filter yet. Quantity over quality.",
      "fields": [
        {
          "id": "solutions-table",
          "type": "table",
          "label": "Possible solutions",
          "columns": [
            { "id": "solution", "header": "Solution", "type": "textarea" },
            { "id": "pros", "header": "Pros", "type": "textarea" },
            { "id": "cons", "header": "Cons", "type": "textarea" }
          ],
          "min_rows": 3,
          "max_rows": 8
        }
      ]
    },
    {
      "id": "choose",
      "title": "Step 3: Choose and Plan",
      "fields": [
        {
          "id": "chosen-solution",
          "type": "textarea",
          "label": "Which solution will you try?",
          "placeholder": "Pick the one with the best balance of pros vs cons"
        },
        {
          "id": "action-plan",
          "type": "textarea",
          "label": "Action plan: what specifically will you do, when, and how?",
          "placeholder": "Break it into concrete steps with a timeline"
        }
      ]
    },
    {
      "id": "review",
      "title": "Step 4: Review",
      "fields": [
        {
          "id": "what-happened",
          "type": "textarea",
          "label": "What happened when you tried it?",
          "placeholder": "Describe the outcome"
        },
        {
          "id": "next-steps",
          "type": "textarea",
          "label": "What's the next step?",
          "placeholder": "Did it work? Do you need to try a different solution? Adjust the plan?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['problem solving', 'CBT', 'depression', 'GAD', 'coping', 'practical worry'],
  15, 16, true, 1
);


-- --------------------------------------------------------
-- T10: Positive Data Log
-- Slug: positive-data-log (overwrites existing)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Positive Data Log',
  'positive-data-log',
  'Collect evidence that contradicts a negative core belief and supports a more balanced alternative — building a new perspective over time.',
  'Identify the negative belief you want to work on and a more balanced alternative. Each day, actively look for experiences — however small — that support the new belief. Rate how much each piece of evidence shifts your conviction. Over time, the log builds a body of evidence your mind can''t easily dismiss.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "beliefs",
      "title": "Core Beliefs",
      "fields": [
        {
          "id": "old-belief",
          "type": "textarea",
          "label": "Negative core belief I'm working on:",
          "placeholder": "e.g. I'm worthless, I'm unlovable, I'm incompetent",
          "required": true
        },
        {
          "id": "old-belief-conviction",
          "type": "likert",
          "label": "How much do you believe this right now?",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        },
        {
          "id": "new-belief",
          "type": "textarea",
          "label": "New, more balanced belief:",
          "placeholder": "e.g. I have worth, I am capable enough, I deserve connection"
        },
        {
          "id": "new-belief-conviction",
          "type": "likert",
          "label": "How much do you believe this right now?",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        }
      ]
    },
    {
      "id": "evidence",
      "title": "Evidence Log",
      "fields": [
        {
          "id": "evidence-table",
          "type": "table",
          "label": "Positive data — evidence that supports the new belief",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "experience", "header": "What Happened", "type": "textarea" },
            { "id": "what-it-means", "header": "What This Says About Me", "type": "textarea" },
            { "id": "strength", "header": "Strength (0–10)", "type": "number", "min": 0, "max": 10, "width": "narrow" }
          ],
          "min_rows": 1,
          "max_rows": 20
        },
        {
          "id": "avg-strength",
          "type": "computed",
          "label": "Average evidence strength",
          "computation": { "operation": "average", "field": "evidence-table.strength" }
        }
      ]
    },
    {
      "id": "review",
      "title": "Review (Complete After 1–2 Weeks)",
      "fields": [
        {
          "id": "updated-old-conviction",
          "type": "likert",
          "label": "Negative belief conviction now:",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        },
        {
          "id": "updated-new-conviction",
          "type": "likert",
          "label": "New belief conviction now:",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        },
        {
          "id": "patterns",
          "type": "textarea",
          "label": "What patterns do you notice in your evidence?",
          "placeholder": "What themes keep coming up? What are you learning about yourself?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['positive data log', 'CBT', 'core beliefs', 'depression', 'self-esteem', 'schema', 'evidence'],
  10, 17, true, 1
);


-- --------------------------------------------------------
-- T11: Early Warning Signs & Action Plan
-- Slug: early-warning-signs-action-plan (new)
-- Category: General CBT Skills
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Early Warning Signs & Action Plan',
  'early-warning-signs-action-plan',
  'Identify your personal early warning signs across thinking, mood, behaviour, and physical health, and create a stepped action plan for responding.',
  'This worksheet helps you and the people around you recognise the early signs that your mental health may be deteriorating, and plan what to do at each stage. It''s especially useful for conditions with a relapse pattern, such as bipolar disorder, psychosis, or recurrent depression. Complete it collaboratively with your therapist and share it with trusted supporters.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "when-well",
      "title": "When I Am Well",
      "description": "Describe your baseline — what you're like when things are going well.",
      "fields": [
        {
          "id": "baseline",
          "type": "textarea",
          "label": "When I'm well, I typically:",
          "placeholder": "e.g. Sleep 7-8 hours, see friends regularly, exercise, enjoy hobbies, feel generally positive"
        }
      ]
    },
    {
      "id": "warning-signs",
      "title": "Early Warning Signs",
      "fields": [
        {
          "id": "signs-table",
          "type": "table",
          "label": "Signs that things may be deteriorating",
          "columns": [
            { "id": "sign", "header": "Warning Sign", "type": "textarea" },
            { "id": "domain", "header": "Area", "type": "text" },
            { "id": "who-notices", "header": "Who Usually Notices?", "type": "text" }
          ],
          "min_rows": 3,
          "max_rows": 12
        }
      ]
    },
    {
      "id": "action-plan",
      "title": "Stepped Action Plan",
      "fields": [
        {
          "id": "green",
          "type": "textarea",
          "label": "🟢 If I notice 1–2 early signs:",
          "placeholder": "e.g. Increase self-care, use therapy techniques, talk to a friend"
        },
        {
          "id": "amber",
          "type": "textarea",
          "label": "🟡 If signs persist or worsen after a few days:",
          "placeholder": "e.g. Contact therapist, adjust medication timing, increase structure in my day"
        },
        {
          "id": "red",
          "type": "textarea",
          "label": "🔴 If I am in crisis or unable to manage:",
          "placeholder": "e.g. Contact crisis team, go to A&E, call emergency contact"
        }
      ]
    },
    {
      "id": "contacts",
      "title": "Key Contacts",
      "fields": [
        {
          "id": "contacts-table",
          "type": "table",
          "label": "People to contact at each stage",
          "columns": [
            { "id": "name", "header": "Name", "type": "text" },
            { "id": "role", "header": "Role / Relationship", "type": "text" },
            { "id": "phone", "header": "Phone / Contact", "type": "text" },
            { "id": "when", "header": "Contact When?", "type": "text" }
          ],
          "min_rows": 2,
          "max_rows": 8
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['early warning signs', 'relapse prevention', 'action plan', 'bipolar', 'psychosis', 'CBT', 'staying well'],
  20, 18, true, 1
);


-- ============================================================================
-- 4. DISORDER-SPECIFIC FORMULATIONS (D1, G1, P1, S1, O1, PT1)
-- ============================================================================

-- --------------------------------------------------------
-- D1: Depression Formulation (Beck)
-- Slug: depression-formulation (overwrites existing)
-- Category: Depression
-- Layout: formulation_longitudinal
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Depression Formulation (Beck)',
  'depression-formulation',
  'A longitudinal CBT formulation based on Beck''s cognitive model of depression — mapping early experiences through core beliefs to current maintenance cycles.',
  'This formulation maps how early life experiences shaped your core beliefs and rules for living, what critical incident activated them, and how your current thoughts, feelings, behaviours, and physical responses keep the depression going. Work through it from top to bottom with your therapist. It creates a shared map that guides the rest of therapy.',
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
        "label": "Early Experiences",
        "placeholder": "What happened in childhood/adolescence that shaped how you see yourself? e.g. Criticism from parents, bullying, loss, neglect, high expectations"
      }]
    },
    {
      "id": "core_beliefs",
      "title": "Core Beliefs",
      "highlight": "amber",
      "fields": [{
        "id": "beliefs",
        "type": "textarea",
        "label": "Core Beliefs",
        "placeholder": "What did those experiences teach you about yourself, others, and the world? e.g. I'm worthless, Others will reject me, The world is unfair"
      }]
    },
    {
      "id": "rules_assumptions",
      "title": "Rules & Assumptions",
      "fields": [{
        "id": "rules",
        "type": "textarea",
        "label": "Rules & Assumptions",
        "placeholder": "What rules did you develop to cope? e.g. If I work harder than everyone else, I might be good enough. If I don't try, I can't fail."
      }]
    },
    {
      "id": "critical_incident",
      "title": "Critical Incident",
      "highlight": "red_dashed",
      "fields": [{
        "id": "incident",
        "type": "textarea",
        "label": "Critical Incident",
        "placeholder": "What event or change activated the core beliefs and broke through the rules? e.g. Job loss, relationship breakdown, health scare"
      }]
    },
    {
      "id": "maintenance_cycle",
      "title": "Maintenance Cycle",
      "layout": "four_quadrant",
      "fields": [
        {
          "id": "cycle_thoughts",
          "type": "textarea",
          "label": "Thoughts",
          "domain": "thoughts",
          "placeholder": "Negative automatic thoughts: e.g. I'm a failure, Nothing will ever change, What's the point?"
        },
        {
          "id": "cycle_emotions",
          "type": "textarea",
          "label": "Emotions",
          "domain": "emotions",
          "placeholder": "e.g. Sadness, guilt, hopelessness, numbness, irritability"
        },
        {
          "id": "cycle_physical",
          "type": "textarea",
          "label": "Physical",
          "domain": "physical",
          "placeholder": "e.g. Fatigue, sleep disruption, appetite changes, aches, heaviness"
        },
        {
          "id": "cycle_behaviour",
          "type": "textarea",
          "label": "Behaviour",
          "domain": "behaviour",
          "placeholder": "e.g. Withdrawal, reduced activity, staying in bed, avoiding people, rumination"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['depression', 'formulation', 'Beck', 'longitudinal', 'CBT', 'core beliefs', 'maintenance cycle'],
  25, 1, true, 1
);


-- --------------------------------------------------------
-- G1: GAD Metacognitive Formulation (Wells)
-- Slug: gad-metacognitive-formulation (new)
-- Category: GAD
-- Layout: cycle (node-based)
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'GAD Metacognitive Formulation (Wells)',
  'gad-metacognitive-formulation',
  'A formulation based on Wells'' metacognitive model of GAD — mapping the role of positive and negative beliefs about worry in maintaining the worry cycle.',
  'This formulation maps how worry is maintained not just by what you worry about, but by what you believe about worrying itself. Work through it with your therapist. Start with a recent trigger, then map the Type 1 worry (the content worry), your beliefs about worry, the Type 2 meta-worry, and the coping strategies that keep the cycle going.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "Metacognitive Formulation",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "Wells Metacognitive Model",
        "layout": "cycle",
        "formulation_config": {
          "title": "GAD Metacognitive Model (Wells)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "trigger",
            "slot": "top",
            "label": "Trigger",
            "domain_colour": "#6366f1",
            "fields": [{
              "id": "trigger-content",
              "type": "textarea",
              "placeholder": "What event, thought, or sensation triggered the worry? e.g. Thinking about an upcoming deadline"
            }]
          },
          {
            "id": "type1-worry",
            "slot": "top-right",
            "label": "Type 1 Worry (Content)",
            "domain_colour": "#3b82f6",
            "fields": [{
              "id": "type1-content",
              "type": "textarea",
              "placeholder": "What if I fail? What if something bad happens? What if I can't cope?"
            }]
          },
          {
            "id": "positive-beliefs",
            "slot": "right",
            "label": "Positive Meta-Beliefs About Worry",
            "domain_colour": "#22c55e",
            "description": "Beliefs that worry is helpful",
            "fields": [{
              "id": "positive-beliefs-content",
              "type": "textarea",
              "placeholder": "e.g. Worrying helps me prepare, If I worry I won't be caught off guard, Worrying shows I care"
            }]
          },
          {
            "id": "type2-worry",
            "slot": "bottom-right",
            "label": "Type 2 Worry (Meta-Worry)",
            "domain_colour": "#ef4444",
            "description": "Worry about worry itself",
            "fields": [{
              "id": "type2-content",
              "type": "textarea",
              "placeholder": "e.g. I can't stop worrying, Worrying will make me ill, I'm going crazy, I'll lose control"
            }]
          },
          {
            "id": "negative-beliefs",
            "slot": "bottom",
            "label": "Negative Meta-Beliefs About Worry",
            "domain_colour": "#dc2626",
            "description": "Beliefs that worry is uncontrollable or dangerous",
            "fields": [{
              "id": "negative-beliefs-content",
              "type": "textarea",
              "placeholder": "e.g. Worry is uncontrollable, Worrying could damage my health, I can't function while worrying"
            }]
          },
          {
            "id": "emotions",
            "slot": "bottom-left",
            "label": "Emotional Response",
            "domain_colour": "#f97316",
            "fields": [{
              "id": "emotions-content",
              "type": "textarea",
              "placeholder": "e.g. Anxiety, tension, dread, exhaustion, low mood"
            }]
          },
          {
            "id": "coping",
            "slot": "left",
            "label": "Unhelpful Coping Strategies",
            "domain_colour": "#a855f7",
            "fields": [{
              "id": "coping-content",
              "type": "textarea",
              "placeholder": "e.g. Thought suppression, reassurance-seeking, avoidance, distraction, checking"
            }]
          }
        ],
        "connections": [
          { "from": "trigger", "to": "type1-worry", "style": "arrow", "direction": "one_way" },
          { "from": "positive-beliefs", "to": "type1-worry", "style": "arrow", "direction": "one_way", "label": "Fuels" },
          { "from": "type1-worry", "to": "type2-worry", "style": "arrow", "direction": "one_way", "label": "Activates" },
          { "from": "negative-beliefs", "to": "type2-worry", "style": "arrow", "direction": "one_way", "label": "Fuels" },
          { "from": "type2-worry", "to": "emotions", "style": "arrow", "direction": "one_way" },
          { "from": "emotions", "to": "coping", "style": "arrow", "direction": "one_way" },
          { "from": "coping", "to": "type1-worry", "style": "arrow_dashed", "direction": "one_way", "label": "Maintains" },
          { "from": "coping", "to": "negative-beliefs", "style": "arrow_dashed", "direction": "one_way", "label": "Reinforces" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "key-insight",
          "type": "textarea",
          "label": "What stands out to you about this formulation?",
          "placeholder": "What role do your beliefs about worry play in keeping the cycle going?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['GAD', 'formulation', 'Wells', 'metacognitive', 'worry', 'CBT', 'meta-worry', 'Type 1', 'Type 2'],
  25, 1, true, 1
);


-- --------------------------------------------------------
-- P1: Panic Formulation (Clark)
-- Slug: panic-formulation-clark (new)
-- Category: Panic Disorder
-- Layout: cycle (node-based)
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'panic-disorder'),
  'Panic Formulation (Clark)',
  'panic-formulation-clark',
  'A formulation based on Clark''s cognitive model of panic — mapping the vicious cycle of catastrophic misinterpretation of body sensations.',
  'This formulation maps the panic cycle: a trigger leads to a sense of threat, which produces anxiety and body sensations, which are then catastrophically misinterpreted, feeding back into the sense of threat. Safety behaviours prevent you from learning that the sensations are harmless. Work through it with your therapist using a recent panic episode as an example.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "Clark's Panic Cycle",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "Clark's Cognitive Model of Panic",
        "layout": "cycle",
        "formulation_config": {
          "title": "Panic Vicious Cycle (Clark, 1986)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "trigger",
            "slot": "top",
            "label": "Trigger",
            "domain_colour": "#6366f1",
            "fields": [{
              "id": "trigger-content",
              "type": "textarea",
              "placeholder": "Internal (sensation, thought) or external (place, situation) trigger. e.g. Noticing heart racing, being in a crowded shop"
            }]
          },
          {
            "id": "perceived-threat",
            "slot": "top-right",
            "label": "Perceived Threat",
            "domain_colour": "#dc2626",
            "fields": [{
              "id": "threat-content",
              "type": "textarea",
              "placeholder": "e.g. Something is wrong with me, I'm going to have a heart attack, I'm going to collapse"
            }]
          },
          {
            "id": "apprehension",
            "slot": "right",
            "label": "Apprehension / Anxiety",
            "domain_colour": "#f97316",
            "fields": [{
              "id": "apprehension-content",
              "type": "textarea",
              "placeholder": "e.g. Fear, dread, sense of impending doom, panic"
            }]
          },
          {
            "id": "body-sensations",
            "slot": "bottom-right",
            "label": "Body Sensations",
            "domain_colour": "#eab308",
            "fields": [{
              "id": "sensations-content",
              "type": "textarea",
              "placeholder": "e.g. Palpitations, dizziness, breathlessness, tingling, chest tightness, sweating, depersonalisation"
            }]
          },
          {
            "id": "misinterpretation",
            "slot": "bottom",
            "label": "Catastrophic Misinterpretation",
            "domain_colour": "#ef4444",
            "fields": [{
              "id": "misinterpretation-content",
              "type": "textarea",
              "placeholder": "e.g. My heart racing means I'm having a heart attack, Dizziness means I'll faint, Breathlessness means I'll suffocate"
            }]
          },
          {
            "id": "safety-behaviours",
            "slot": "left",
            "label": "Safety Behaviours",
            "domain_colour": "#a855f7",
            "description": "Prevent disconfirmation of catastrophe",
            "fields": [{
              "id": "safety-content",
              "type": "textarea",
              "placeholder": "e.g. Sitting down, gripping objects, escaping, calling 999, avoiding exercise, carrying water, staying near exits"
            }]
          }
        ],
        "connections": [
          { "from": "trigger", "to": "perceived-threat", "style": "arrow", "direction": "one_way" },
          { "from": "perceived-threat", "to": "apprehension", "style": "arrow", "direction": "one_way" },
          { "from": "apprehension", "to": "body-sensations", "style": "arrow", "direction": "one_way" },
          { "from": "body-sensations", "to": "misinterpretation", "style": "arrow", "direction": "one_way" },
          { "from": "misinterpretation", "to": "perceived-threat", "style": "arrow", "direction": "one_way", "label": "Confirms threat" },
          { "from": "apprehension", "to": "safety-behaviours", "style": "arrow_dashed", "direction": "one_way" },
          { "from": "safety-behaviours", "to": "misinterpretation", "style": "arrow_dashed", "direction": "one_way", "label": "Prevents disconfirmation" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "key-cycle",
          "type": "textarea",
          "label": "What is the key misinterpretation that drives your panic cycle?",
          "placeholder": "Which body sensation do you most fear, and what do you think it means?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['panic', 'formulation', 'Clark', 'cognitive model', 'CBT', 'catastrophic misinterpretation', 'vicious cycle'],
  25, 1, true, 1
);


-- --------------------------------------------------------
-- S1: Social Anxiety Formulation (Clark & Wells)
-- Slug: social-anxiety-formulation-clark-wells (new)
-- Category: Social Anxiety
-- Layout: cycle (node-based)
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Social Anxiety Formulation (Clark & Wells)',
  'social-anxiety-formulation-clark-wells',
  'A formulation based on Clark and Wells'' cognitive model of social anxiety — mapping self-focused attention, the observer-perspective self-image, and safety behaviours.',
  'This formulation maps how social anxiety is maintained by a shift in attention inward (self-focused attention), the creation of a distorted self-image, the use of safety behaviours that often cause the feared outcome, and pre- and post-event rumination. Work through it with your therapist using a recent social situation.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "Clark & Wells Social Anxiety Model",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "Social Anxiety Maintenance Model",
        "layout": "cycle",
        "formulation_config": {
          "title": "Social Anxiety Model (Clark & Wells)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "social-situation",
            "slot": "top",
            "label": "Social Situation",
            "domain_colour": "#6366f1",
            "fields": [{
              "id": "situation-content",
              "type": "textarea",
              "placeholder": "e.g. Team meeting, party, speaking to a stranger, eating in public"
            }]
          },
          {
            "id": "assumptions",
            "slot": "top-right",
            "label": "Assumptions Activated",
            "domain_colour": "#3b82f6",
            "fields": [{
              "id": "assumptions-content",
              "type": "textarea",
              "placeholder": "e.g. People will think I'm boring, I'll say something stupid, Others can see how anxious I am"
            }]
          },
          {
            "id": "perceived-danger",
            "slot": "right",
            "label": "Perceived Social Danger",
            "domain_colour": "#dc2626",
            "fields": [{
              "id": "danger-content",
              "type": "textarea",
              "placeholder": "e.g. I'll be humiliated, rejected, laughed at, thought of as incompetent"
            }]
          },
          {
            "id": "self-processing",
            "slot": "bottom-right",
            "label": "Self-Focused Attention & Self-Image",
            "domain_colour": "#f97316",
            "description": "Processing of self as a social object",
            "fields": [{
              "id": "self-image-content",
              "type": "textarea",
              "placeholder": "What do you see when you observe yourself from the outside? e.g. Red-faced, shaking, boring, visibly anxious, sweating, stumbling over words"
            }]
          },
          {
            "id": "safety-behaviours",
            "slot": "bottom",
            "label": "Safety Behaviours",
            "domain_colour": "#a855f7",
            "fields": [{
              "id": "safety-content",
              "type": "textarea",
              "placeholder": "e.g. Avoiding eye contact, rehearsing what to say, gripping glass tightly, speaking quietly, staying at the edge, drinking alcohol"
            }]
          },
          {
            "id": "anxiety-symptoms",
            "slot": "left",
            "label": "Anxiety Symptoms",
            "domain_colour": "#eab308",
            "fields": [{
              "id": "symptoms-content",
              "type": "textarea",
              "placeholder": "e.g. Blushing, sweating, mind going blank, heart racing, shaky voice, feeling detached"
            }]
          },
          {
            "id": "pre-post-processing",
            "slot": "bottom-left",
            "label": "Pre- & Post-Event Processing",
            "domain_colour": "#64748b",
            "fields": [
              {
                "id": "pre-event",
                "type": "textarea",
                "label": "Before the situation:",
                "placeholder": "e.g. Hours of anxious anticipation, rehearsing conversations, imagining worst-case scenarios"
              },
              {
                "id": "post-event",
                "type": "textarea",
                "label": "After the situation:",
                "placeholder": "e.g. Going over everything I said, focusing on moments that felt awkward, concluding it went badly"
              }
            ]
          }
        ],
        "connections": [
          { "from": "social-situation", "to": "assumptions", "style": "arrow", "direction": "one_way" },
          { "from": "assumptions", "to": "perceived-danger", "style": "arrow", "direction": "one_way" },
          { "from": "perceived-danger", "to": "self-processing", "style": "arrow", "direction": "one_way" },
          { "from": "self-processing", "to": "safety-behaviours", "style": "arrow", "direction": "one_way" },
          { "from": "self-processing", "to": "anxiety-symptoms", "style": "arrow", "direction": "one_way" },
          { "from": "safety-behaviours", "to": "perceived-danger", "style": "arrow_dashed", "direction": "one_way", "label": "Can cause feared outcome" },
          { "from": "anxiety-symptoms", "to": "self-processing", "style": "arrow", "direction": "one_way", "label": "Feeds self-image" },
          { "from": "pre-post-processing", "to": "assumptions", "style": "arrow_dashed", "direction": "one_way", "label": "Reinforces beliefs" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "key-insight",
          "type": "textarea",
          "label": "What do you notice about the role of self-focused attention in your anxiety?",
          "placeholder": "How does the internal image of yourself compare to what others actually report seeing?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'formulation', 'Clark', 'Wells', 'cognitive model', 'CBT', 'self-focused attention', 'safety behaviours'],
  25, 1, true, 1
);


-- --------------------------------------------------------
-- O1: OCD Formulation (Salkovskis)
-- Slug: ocd-formulation-salkovskis (new — replaces ocd-vicious-flower-formulation)
-- Category: OCD
-- Layout: cycle (node-based)
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'),
  'OCD Formulation (Salkovskis)',
  'ocd-formulation-salkovskis',
  'A formulation based on Salkovskis'' cognitive model of OCD — mapping intrusions, responsibility appraisals, distress, and neutralising behaviours.',
  'This formulation maps how OCD is maintained not by the intrusive thoughts themselves (which everyone has) but by the meaning you give them — particularly inflated responsibility. The appraisal triggers distress, which drives neutralising (rituals, avoidance, reassurance), which provides temporary relief but reinforces the belief that the intrusion was dangerous. Work through it with your therapist using a recent OCD episode.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "Salkovskis OCD Model",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "OCD Maintenance Cycle",
        "layout": "cycle",
        "formulation_config": {
          "title": "OCD Cognitive Model (Salkovskis, 1985)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "intrusion",
            "slot": "top",
            "label": "Intrusive Thought / Image / Urge",
            "domain_colour": "#6366f1",
            "description": "Normal — everyone has these",
            "fields": [{
              "id": "intrusion-content",
              "type": "textarea",
              "placeholder": "e.g. Image of harming someone, thought about contamination, doubt about whether I locked the door, blasphemous thought"
            }]
          },
          {
            "id": "appraisal",
            "slot": "right",
            "label": "Responsibility Appraisal",
            "domain_colour": "#dc2626",
            "description": "The meaning given to the intrusion",
            "fields": [{
              "id": "appraisal-content",
              "type": "textarea",
              "placeholder": "e.g. Having this thought means I might actually do it, If I don't check and something bad happens it will be my fault, Thinking this makes me a bad person"
            }]
          },
          {
            "id": "distress",
            "slot": "bottom-right",
            "label": "Distress",
            "domain_colour": "#f97316",
            "fields": [{
              "id": "distress-content",
              "type": "textarea",
              "placeholder": "e.g. Intense anxiety, guilt, disgust, fear, dread, shame"
            }]
          },
          {
            "id": "neutralising",
            "slot": "bottom",
            "label": "Neutralising / Rituals / Avoidance",
            "domain_colour": "#a855f7",
            "fields": [{
              "id": "neutralising-content",
              "type": "textarea",
              "placeholder": "e.g. Checking, washing, counting, repeating, seeking reassurance, mental reviewing, avoiding triggers"
            }]
          },
          {
            "id": "relief",
            "slot": "bottom-left",
            "label": "Temporary Relief",
            "domain_colour": "#22c55e",
            "fields": [{
              "id": "relief-content",
              "type": "textarea",
              "placeholder": "e.g. Brief reduction in anxiety, feeling 'safe' for now, sense of having prevented harm"
            }]
          },
          {
            "id": "attention",
            "slot": "left",
            "label": "Increased Attention to Intrusions",
            "domain_colour": "#eab308",
            "description": "Monitoring makes intrusions more frequent",
            "fields": [{
              "id": "attention-content",
              "type": "textarea",
              "placeholder": "e.g. Scanning for the thought, hypervigilance for triggers, testing whether the thought comes back"
            }]
          }
        ],
        "connections": [
          { "from": "intrusion", "to": "appraisal", "style": "arrow", "direction": "one_way" },
          { "from": "appraisal", "to": "distress", "style": "arrow", "direction": "one_way" },
          { "from": "distress", "to": "neutralising", "style": "arrow", "direction": "one_way" },
          { "from": "neutralising", "to": "relief", "style": "arrow", "direction": "one_way" },
          { "from": "relief", "to": "appraisal", "style": "arrow_dashed", "direction": "one_way", "label": "Reinforces belief ritual was needed" },
          { "from": "relief", "to": "attention", "style": "arrow_dashed", "direction": "one_way" },
          { "from": "attention", "to": "intrusion", "style": "arrow_dashed", "direction": "one_way", "label": "Increases frequency" }
        ]
      }]
    },
    {
      "id": "normalising",
      "title": "Normalising",
      "fields": [
        {
          "id": "normalising-note",
          "type": "textarea",
          "label": "What percentage of the general population have intrusive thoughts like yours?",
          "placeholder": "Research shows ~90% of people have intrusive thoughts. The thought itself is not the problem — it's the meaning you give it."
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "key-insight",
          "type": "textarea",
          "label": "What role does the responsibility appraisal play in your OCD cycle?",
          "placeholder": "How would you respond to the intrusion if you didn't believe you were responsible for preventing harm?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['OCD', 'formulation', 'Salkovskis', 'cognitive model', 'CBT', 'intrusions', 'responsibility', 'neutralising'],
  25, 1, true, 1
);


-- --------------------------------------------------------
-- PT1: PTSD Formulation (Ehlers & Clark)
-- Slug: ptsd-formulation-ehlers-clark (new)
-- Category: PTSD / Trauma
-- Layout: cycle (node-based)
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'PTSD Formulation (Ehlers & Clark)',
  'ptsd-formulation-ehlers-clark',
  'A formulation based on Ehlers and Clark''s cognitive model of PTSD — mapping the nature of the trauma memory, negative appraisals, sense of current threat, and the maintaining strategies.',
  'This formulation explains why trauma symptoms persist: the trauma memory is stored differently from normal memories (fragmented, vivid, lacking time context), leading to intrusions and a sense of current threat. Negative appraisals of the trauma and its aftermath maintain distress, while coping strategies (avoidance, rumination, suppression) prevent the memory from being properly processed. Work through it with your therapist — you do not need to describe the trauma in detail.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "Ehlers & Clark PTSD Model",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "PTSD Maintenance Model",
        "layout": "cycle",
        "formulation_config": {
          "title": "PTSD Cognitive Model (Ehlers & Clark, 2000)",
          "show_title": true
        },
        "nodes": [
          {
            "id": "trauma-memory",
            "slot": "top",
            "label": "Nature of Trauma Memory",
            "domain_colour": "#6366f1",
            "description": "How the memory is stored — not the content",
            "fields": [{
              "id": "memory-content",
              "type": "textarea",
              "placeholder": "e.g. Fragmented, vivid sensory flashbacks, no clear time sequence, feels like it's happening NOW, strong sensory impressions (smell, sound, image), gaps in recall"
            }]
          },
          {
            "id": "appraisals",
            "slot": "top-right",
            "label": "Negative Appraisals",
            "domain_colour": "#dc2626",
            "description": "Of the trauma and/or its aftermath",
            "fields": [
              {
                "id": "appraisals-trauma",
                "type": "textarea",
                "label": "About the trauma:",
                "placeholder": "e.g. It was my fault, I should have done more, Nowhere is safe, I attracted it"
              },
              {
                "id": "appraisals-aftermath",
                "type": "textarea",
                "label": "About symptoms / aftermath:",
                "placeholder": "e.g. I'm going mad, I'll never get over this, My life is ruined, I'm permanently damaged"
              }
            ]
          },
          {
            "id": "current-threat",
            "slot": "right",
            "label": "Sense of Current Threat",
            "domain_colour": "#f97316",
            "fields": [{
              "id": "threat-content",
              "type": "textarea",
              "placeholder": "e.g. Constant hypervigilance, feeling unsafe, re-experiencing as if it's happening now, startle response, sense of foreshortened future"
            }]
          },
          {
            "id": "intrusions",
            "slot": "bottom-right",
            "label": "Intrusions & Re-experiencing",
            "domain_colour": "#eab308",
            "fields": [{
              "id": "intrusions-content",
              "type": "textarea",
              "placeholder": "e.g. Flashbacks, nightmares, intrusive images, emotional re-experiencing, body memories, triggered by sensory cues"
            }]
          },
          {
            "id": "strategies",
            "slot": "bottom",
            "label": "Cognitive & Behavioural Strategies",
            "domain_colour": "#a855f7",
            "description": "Well-intentioned but maintain the problem",
            "fields": [{
              "id": "strategies-content",
              "type": "textarea",
              "placeholder": "e.g. Avoiding reminders, thought suppression, rumination (why me?), substance use, social withdrawal, safety behaviours, numbing, dissociation"
            }]
          },
          {
            "id": "prevents-change",
            "slot": "left",
            "label": "Prevents Processing",
            "domain_colour": "#64748b",
            "description": "Strategies block memory elaboration and appraisal updating",
            "fields": [{
              "id": "prevents-content",
              "type": "textarea",
              "placeholder": "How do your coping strategies prevent the memory from being updated? e.g. Avoidance means I never learn the trigger is safe now, Rumination keeps me in the past"
            }]
          }
        ],
        "connections": [
          { "from": "trauma-memory", "to": "intrusions", "style": "arrow", "direction": "one_way", "label": "Triggers" },
          { "from": "appraisals", "to": "current-threat", "style": "arrow", "direction": "one_way" },
          { "from": "current-threat", "to": "intrusions", "style": "arrow", "direction": "both" },
          { "from": "current-threat", "to": "strategies", "style": "arrow", "direction": "one_way" },
          { "from": "strategies", "to": "prevents-change", "style": "arrow", "direction": "one_way" },
          { "from": "prevents-change", "to": "trauma-memory", "style": "arrow_dashed", "direction": "one_way", "label": "Memory stays unprocessed" },
          { "from": "prevents-change", "to": "appraisals", "style": "arrow_dashed", "direction": "one_way", "label": "Appraisals unchallenged" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "key-insight",
          "type": "textarea",
          "label": "What stands out about how the coping strategies are maintaining the problem?",
          "placeholder": "Which strategies made sense at the time but are now keeping you stuck?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'trauma', 'formulation', 'Ehlers', 'Clark', 'cognitive model', 'CBT', 'flashbacks', 'appraisals'],
  25, 1, true, 1
);


-- ============================================================================
-- 5. DISORDER-SPECIFIC TOOLS (P2, P4, S3, PT5)
-- ============================================================================

-- --------------------------------------------------------
-- P2: Panic Diary
-- Slug: panic-diary (overwrites existing)
-- Category: Panic Disorder
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'panic-disorder'),
  'Panic Diary',
  'panic-diary',
  'Record panic episodes with triggers, sensations, catastrophic thoughts, safety behaviours, and actual outcomes to identify patterns and build evidence against catastrophic predictions.',
  'Complete an entry as soon as possible after each panic episode (or strong wave of anxiety). The goal is to capture what triggered it, what you felt in your body, what you thought was happening, what you did to cope, and what actually happened. Over time, patterns emerge that help you and your therapist target the key maintenance factors.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "entries",
      "title": "Panic Episodes",
      "fields": [
        {
          "id": "panic-record",
          "type": "record",
          "label": "Panic Episode",
          "min_records": 1,
          "max_records": 20,
          "groups": [
            {
              "id": "context",
              "header": "When & Where",
              "width": "narrow",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "situation", "type": "textarea", "placeholder": "Where were you? What were you doing?" }
              ]
            },
            {
              "id": "trigger",
              "header": "Trigger",
              "width": "normal",
              "fields": [
                { "id": "trigger-content", "type": "textarea", "placeholder": "What triggered the panic? (sensation, thought, situation)" }
              ]
            },
            {
              "id": "sensations",
              "header": "Body Sensations",
              "width": "normal",
              "fields": [
                { "id": "physical-symptoms", "type": "textarea", "placeholder": "e.g. Heart racing, dizzy, breathless, tingling, chest tight" },
                { "id": "peak-anxiety", "type": "likert", "label": "Peak anxiety (0–100)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "interpretation",
              "header": "Catastrophic Thought",
              "width": "normal",
              "fields": [
                { "id": "misinterpretation", "type": "textarea", "placeholder": "What did you think was happening? e.g. I'm having a heart attack" },
                { "id": "belief-strength", "type": "likert", "label": "How much did you believe it?", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "response",
              "header": "Safety Behaviour & Outcome",
              "width": "normal",
              "fields": [
                { "id": "safety-behaviour", "type": "textarea", "placeholder": "What did you do? e.g. Escaped, sat down, called someone" },
                { "id": "actual-outcome", "type": "textarea", "placeholder": "What actually happened? Did the feared catastrophe occur?" }
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
        {
          "id": "patterns",
          "type": "textarea",
          "label": "What patterns do you notice across episodes?",
          "placeholder": "Common triggers? Recurring misinterpretations? Do the catastrophes ever actually happen?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['panic', 'diary', 'CBT', 'catastrophic misinterpretation', 'body sensations', 'safety behaviours', 'Clark'],
  10, 2, true, 1
);


-- --------------------------------------------------------
-- P4: Interoceptive Exposure Record
-- Slug: interoceptive-exposure-record (new)
-- Category: Panic Disorder
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'panic-disorder'),
  'Interoceptive Exposure Record',
  'interoceptive-exposure-record',
  'Log interoceptive exposure exercises that deliberately produce feared body sensations to break the link between sensations and catastrophic interpretations.',
  'Interoceptive exposure involves deliberately producing the body sensations you fear (e.g. breathing through a straw to feel breathless, spinning to feel dizzy) in a controlled way. This helps you learn that the sensations are uncomfortable but not dangerous. For each exercise, record the sensations produced, how similar they are to your panic symptoms, your anxiety level, what you predicted would happen, and what actually happened.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "exercises",
      "title": "Interoceptive Exposure Exercises",
      "fields": [
        {
          "id": "exercise-record",
          "type": "record",
          "label": "Exercise",
          "min_records": 1,
          "max_records": 15,
          "groups": [
            {
              "id": "exercise",
              "header": "Exercise",
              "width": "normal",
              "fields": [
                { "id": "name", "type": "text", "placeholder": "e.g. Breathing through straw, spinning in chair, running on spot" },
                { "id": "duration", "type": "text", "placeholder": "How long? e.g. 60 seconds" }
              ]
            },
            {
              "id": "sensations",
              "header": "Sensations Produced",
              "width": "normal",
              "fields": [
                { "id": "what-felt", "type": "textarea", "placeholder": "What sensations did you notice?" },
                { "id": "similarity", "type": "likert", "label": "Similarity to panic (0–10)", "min": 0, "max": 10, "step": 1, "anchors": { "0": "Nothing like it", "5": "Somewhat similar", "10": "Identical" } }
              ]
            },
            {
              "id": "ratings",
              "header": "Anxiety",
              "width": "narrow",
              "fields": [
                { "id": "suds", "type": "likert", "label": "Peak anxiety (SUDS)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "prediction-test",
              "header": "Prediction vs Reality",
              "width": "normal",
              "fields": [
                { "id": "prediction", "type": "textarea", "placeholder": "What did you predict would happen?" },
                { "id": "actual", "type": "textarea", "placeholder": "What actually happened?" }
              ]
            },
            {
              "id": "learning",
              "header": "Learning",
              "width": "normal",
              "fields": [
                { "id": "what-learned", "type": "textarea", "placeholder": "What does this tell you about these sensations?" }
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
        {
          "id": "overall-learning",
          "type": "textarea",
          "label": "What are you learning about body sensations through these exercises?",
          "placeholder": "Are the sensations as dangerous as you feared? What happens when you don't escape or use safety behaviours?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['interoceptive exposure', 'panic', 'CBT', 'body sensations', 'Clark', 'behavioural experiment'],
  15, 3, true, 1
);


-- --------------------------------------------------------
-- S3: Video Feedback Worksheet
-- Slug: video-feedback-worksheet (new)
-- Category: Social Anxiety
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Video Feedback Worksheet',
  'video-feedback-worksheet',
  'Compare your internal self-image with how you actually appear on video to challenge distorted self-perception in social anxiety.',
  'Video feedback is a powerful technique for social anxiety. Before watching the video, write down exactly what you predict you will see (based on how you felt during the situation). Then watch the video with your therapist and record what you actually observe. The discrepancy between your prediction and reality provides direct evidence against your distorted self-image.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "situation",
      "title": "The Situation",
      "fields": [
        {
          "id": "what-filmed",
          "type": "textarea",
          "label": "What situation was recorded?",
          "placeholder": "e.g. Having a conversation with my therapist, giving a short presentation, asking a question in a group",
          "required": true
        }
      ]
    },
    {
      "id": "prediction",
      "title": "Before Watching: My Prediction",
      "description": "Based on how you felt during the situation, what do you predict you'll see on the video?",
      "fields": [
        {
          "id": "predicted-appearance",
          "type": "textarea",
          "label": "What will I look like?",
          "placeholder": "e.g. Visibly shaking, face bright red, looking terrified, boring, stumbling over every word"
        },
        {
          "id": "predicted-impression",
          "type": "textarea",
          "label": "What impression will I give?",
          "placeholder": "e.g. Incompetent, anxious, weird, someone who shouldn't be there"
        },
        {
          "id": "prediction-confidence",
          "type": "likert",
          "label": "How confident are you in this prediction? (0–100%)",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all sure", "50": "Fairly sure", "100": "Absolutely certain" }
        }
      ]
    },
    {
      "id": "observation",
      "title": "After Watching: What I Actually Saw",
      "description": "Watch the video and focus on what you can actually observe, not what you feel.",
      "fields": [
        {
          "id": "actual-appearance",
          "type": "textarea",
          "label": "What did I actually look like?",
          "placeholder": "Describe only what you can see on the video — stick to observable facts"
        },
        {
          "id": "actual-impression",
          "type": "textarea",
          "label": "What impression does the person on the video give?",
          "placeholder": "Try to watch as if this were a stranger — what would you think of them?"
        }
      ]
    },
    {
      "id": "discrepancy",
      "title": "The Discrepancy",
      "fields": [
        {
          "id": "differences",
          "type": "textarea",
          "label": "What were the main differences between your prediction and reality?",
          "placeholder": "Where was the biggest gap between what you expected and what you saw?"
        },
        {
          "id": "revised-confidence",
          "type": "likert",
          "label": "How much do you now believe your original prediction? (0–100%)",
          "min": 0, "max": 100, "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        },
        {
          "id": "confidence-change",
          "type": "computed",
          "label": "Change in prediction confidence",
          "computation": { "operation": "difference", "field_a": "prediction-confidence", "field_b": "revised-confidence", "format": "percentage_change" }
        },
        {
          "id": "learning",
          "type": "textarea",
          "label": "What does this tell you about your internal self-image?",
          "placeholder": "How reliable is the image of yourself you construct from how you feel? What does that mean for how you approach social situations?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'video feedback', 'CBT', 'Clark', 'Wells', 'self-image', 'self-focused attention', 'behavioural experiment'],
  20, 2, true, 1
);


-- --------------------------------------------------------
-- PT5: Trigger Discrimination Worksheet (Then vs Now)
-- Slug: trigger-discrimination-then-vs-now (new)
-- Category: PTSD / Trauma
-- --------------------------------------------------------
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Trigger Discrimination Worksheet (Then vs Now)',
  'trigger-discrimination-then-vs-now',
  'Identify triggers that activate trauma memories and systematically compare the original trauma context with the present reality to reduce flashback intensity.',
  'When something triggers a trauma memory, your brain responds as if the danger is happening right now. This worksheet helps you identify the trigger, recall what was happening during the trauma (then), and list all the ways the present moment is different (now). Practising this discrimination helps your brain update the memory so the trigger loses its power over time.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "entries",
      "title": "Trigger Discrimination Records",
      "fields": [
        {
          "id": "discrimination-record",
          "type": "record",
          "label": "Then vs Now",
          "min_records": 1,
          "max_records": 15,
          "groups": [
            {
              "id": "trigger",
              "header": "Trigger",
              "width": "normal",
              "fields": [
                { "id": "date", "type": "text", "placeholder": "Date" },
                { "id": "trigger-description", "type": "textarea", "placeholder": "What triggered the flashback / intrusion? e.g. A loud noise, a particular smell, someone's tone of voice" },
                { "id": "distress-before", "type": "likert", "label": "Distress (0–100)", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "then",
              "header": "THEN (During the Trauma)",
              "width": "normal",
              "fields": [
                { "id": "then-context", "type": "textarea", "placeholder": "What was happening then? What made it dangerous?" },
                { "id": "then-sensory", "type": "textarea", "placeholder": "What could you see, hear, smell, feel then?" }
              ]
            },
            {
              "id": "now",
              "header": "NOW (Present Reality)",
              "width": "normal",
              "fields": [
                { "id": "now-context", "type": "textarea", "placeholder": "What is different now? What makes you safe?" },
                { "id": "now-sensory", "type": "textarea", "placeholder": "What can you see, hear, smell, feel right now that is different from then?" },
                { "id": "now-evidence", "type": "textarea", "placeholder": "What is the strongest evidence that you are here, now, and safe?" }
              ]
            },
            {
              "id": "after",
              "header": "After",
              "width": "narrow",
              "fields": [
                { "id": "distress-after", "type": "likert", "label": "Distress now (0–100)", "min": 0, "max": 100, "step": 5 }
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
        {
          "id": "common-triggers",
          "type": "textarea",
          "label": "What are your most common triggers?",
          "placeholder": "Are there recurring sensory cues (sounds, smells, sights) that activate trauma memories?"
        },
        {
          "id": "key-discriminators",
          "type": "textarea",
          "label": "What are the strongest 'now' cues that help you ground?",
          "placeholder": "Which differences between then and now are most powerful for bringing you back to the present?"
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'trauma', 'trigger discrimination', 'then vs now', 'CBT', 'Ehlers', 'Clark', 'flashbacks', 'grounding'],
  15, 2, true, 1
);


-- ============================================================================
-- DONE. Verify counts.
-- ============================================================================
-- Expected: 21 new rows inserted
-- Categories: Social Anxiety, Health Anxiety, Panic Disorder, PTSD/Trauma,
--             Low Self-Esteem created if not already present
-- Deleted: 6 old worksheet rows (replaced by new versions)

COMMIT;
