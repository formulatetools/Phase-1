-- ============================================================================
-- FORMULATE — Batch 3: Priority B (~47 Worksheets)
-- ============================================================================
-- Run AFTER Batches 1 & 2 are live. Single transaction.
-- ============================================================================

BEGIN;

-- ============================================================================
-- CONSOLIDATION DECISIONS (9 worksheets eliminated)
-- ============================================================================
--
-- SKIPPED (absorbed by Batch 1 transdiagnostic tools):
--   P7  (Panic Blueprint)        → T6 relapse-prevention-plan with panic context
--   O7  (OCD Blueprint)          → T6 with OCD context
--   H7  (Health Anxiety Blueprint)→ T6 with health anxiety context
--   E11 (ED Blueprint)           → T6 with eating disorder context
--   Ps4 (Staying Well Plan)      → T6 + T11 combined
--   D6  (BA Values Planning)     → T12 Values & Activity Alignment (this batch)
--   CP5 (Pain Values Goals)      → T12 with chronic pain context
--   PD6 (Schema BE)              → T1 behavioural-experiment-planner with schema context
--   Ps3 (CBTp BE)                → T1 with psychosis context
--
-- REMAINING: 47 worksheets (all new slugs)
-- ============================================================================


-- ============================================================================
-- 1. NEW CATEGORIES
-- ============================================================================

INSERT INTO categories (id, name, slug, icon, display_order)
VALUES
  (gen_random_uuid(), 'Body Dysmorphic Disorder (BDD)', 'bdd', 'eye', 14),
  (gen_random_uuid(), 'Chronic Pain', 'chronic-pain', 'thermometer', 15),
  (gen_random_uuid(), 'Psychosis (CBTp)', 'psychosis-cbtp', 'cloud', 16)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 2. TRANSDIAGNOSTIC (T12, T13, T14, T15)
-- ============================================================================

-- T12: Values & Activity Alignment
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Values & Activity Alignment',
  'values-activity-alignment',
  'Identify your core values and assess how well your current activities align with them — then plan changes to close the gap.',
  'When we''re struggling, we often drift away from the things that matter most. This worksheet helps you identify your values across life domains, rate how well you''re currently living in line with each, and plan specific activities to close the gap. It''s useful in depression, eating disorders, chronic pain, and schema work.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "values",
      "title": "My Values",
      "fields": [
        {
          "id": "values-table",
          "type": "table",
          "label": "Rate how important each domain is and how well you're living it",
          "columns": [
            { "id": "domain", "header": "Life Domain", "type": "text" },
            { "id": "value", "header": "What Matters to Me Here", "type": "textarea" },
            { "id": "importance", "header": "Importance (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "current", "header": "Current Alignment (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 5,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "gaps",
      "title": "Closing the Gap",
      "fields": [
        { "id": "biggest-gap", "type": "textarea", "label": "Where is the biggest gap between importance and current alignment?", "placeholder": "Which domains score high on importance but low on alignment?" },
        {
          "id": "actions-table",
          "type": "table",
          "label": "Specific activities to better align with your values",
          "columns": [
            { "id": "domain", "header": "Domain", "type": "text" },
            { "id": "activity", "header": "Activity I Could Do", "type": "textarea" },
            { "id": "when", "header": "When", "type": "text" },
            { "id": "barrier", "header": "Potential Barrier", "type": "textarea" }
          ],
          "min_rows": 3,
          "max_rows": 8
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['values', 'behavioural activation', 'CBT', 'depression', 'chronic pain', 'eating disorders', 'alignment'],
  15, 19, true, 1
);


-- T13: Continuum / Scaling Work
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Continuum Thinking Worksheet',
  'continuum-thinking-worksheet',
  'Challenge all-or-nothing thinking by placing beliefs, qualities, or experiences on a continuum rather than in black-and-white categories.',
  'All-or-nothing thinking is common across many difficulties. This worksheet helps you take any quality, belief, or judgement and place it on a scale from 0 to 100 rather than seeing it as one extreme or the other. Plot examples and evidence at various points to build a more nuanced picture.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "setup",
      "title": "The Belief to Scale",
      "fields": [
        { "id": "all-or-nothing", "type": "textarea", "label": "What all-or-nothing belief are you working on?", "placeholder": "e.g. I'm either a success or a failure, People either like me or they don't, I'm completely boring", "required": true },
        { "id": "low-end", "type": "textarea", "label": "What does 0% look like?", "placeholder": "Describe the extreme negative end concretely" },
        { "id": "high-end", "type": "textarea", "label": "What does 100% look like?", "placeholder": "Describe the extreme positive end concretely" },
        { "id": "initial-rating", "type": "likert", "label": "Where do you currently place yourself?", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "evidence",
      "title": "Evidence Along the Scale",
      "fields": [
        {
          "id": "evidence-table",
          "type": "table",
          "label": "Plot examples at various points",
          "columns": [
            { "id": "example", "header": "Example / Evidence", "type": "textarea" },
            { "id": "rating", "header": "Where? (0–100)", "type": "number", "min": 0, "max": 100, "suffix": "%" }
          ],
          "min_rows": 5,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "revised-rating", "type": "likert", "label": "Revised self-rating", "min": 0, "max": 100, "step": 5 },
        { "id": "learning", "type": "textarea", "label": "What does the evidence on the continuum suggest?", "placeholder": "Is reality more nuanced than the all-or-nothing version?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['continuum', 'all-or-nothing', 'CBT', 'core beliefs', 'cognitive restructuring', 'scaling'],
  15, 20, true, 1
);


-- T14: Activity Pacing Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Activity Pacing Worksheet',
  'activity-pacing-worksheet',
  'Plan a paced approach to activity — balancing rest and engagement to avoid boom-bust cycles in chronic pain, CFS, or depression.',
  'Pacing means doing activities at a sustainable level rather than pushing through and crashing. This worksheet helps you identify your baseline tolerance, plan paced increases, and track your adherence. It''s essential for chronic pain, CFS/ME, and depression where energy management is key.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "baseline",
      "title": "My Current Baseline",
      "fields": [
        { "id": "activity", "type": "textarea", "label": "What activity are you pacing?", "placeholder": "e.g. Walking, housework, computer use, socialising", "required": true },
        { "id": "current-tolerance", "type": "textarea", "label": "What is your current sustainable level?", "placeholder": "How long can you do this before symptoms flare? e.g. 10 minutes walking, 20 minutes computer" },
        { "id": "target", "type": "textarea", "label": "What is your target level?", "placeholder": "Where would you like to get to? Be realistic." }
      ]
    },
    {
      "id": "plan",
      "title": "Pacing Plan",
      "fields": [
        {
          "id": "pacing-table",
          "type": "table",
          "label": "Graded pacing schedule",
          "columns": [
            { "id": "week", "header": "Week", "type": "text", "width": "narrow" },
            { "id": "planned-amount", "header": "Planned Amount", "type": "text" },
            { "id": "actual-amount", "header": "Actual Amount", "type": "text" },
            { "id": "symptom-level", "header": "Symptom Level (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "notes", "header": "Notes", "type": "textarea" }
          ],
          "min_rows": 4,
          "max_rows": 12
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "learning", "type": "textarea", "label": "What are you learning about your pacing?", "placeholder": "Is your baseline accurate? Are increases sustainable?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['pacing', 'chronic pain', 'CFS', 'depression', 'CBT', 'activity management', 'boom-bust'],
  10, 21, true, 1
);


-- T15: Imagery Rescripting Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  'Imagery Rescripting Worksheet',
  'imagery-rescripting-worksheet',
  'Prepare for and process an imagery rescripting session — recording the original image, its meaning, and the rescripted version.',
  'Imagery rescripting involves revisiting a distressing memory or image and changing it in imagination so that a different, more helpful outcome occurs. This worksheet captures the original image, its emotional impact and meaning, the rescripted version, and how your feelings change afterwards. Complete with your therapist.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "original-image",
      "title": "The Original Image / Memory",
      "fields": [
        { "id": "description", "type": "textarea", "label": "Briefly describe the image or memory", "placeholder": "Just enough to identify it — you don't need detail", "required": true },
        { "id": "emotion", "type": "text", "label": "Primary emotion", "placeholder": "e.g. Shame, fear, helplessness" },
        { "id": "emotion-intensity", "type": "likert", "label": "Emotion intensity (0–100)", "min": 0, "max": 100, "step": 5 },
        { "id": "meaning", "type": "textarea", "label": "What does this image mean about you?", "placeholder": "e.g. I'm powerless, I'm disgusting, I'm in danger" },
        { "id": "belief-strength", "type": "likert", "label": "Belief strength (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "rescript",
      "title": "The Rescripted Image",
      "fields": [
        { "id": "rescript-description", "type": "textarea", "label": "What happened in the rescripted version?", "placeholder": "How did the image change? Who intervened? What did you do differently?" },
        { "id": "new-meaning", "type": "textarea", "label": "What does the new version mean about you?", "placeholder": "e.g. I am safe now, I have power, I deserved protection" }
      ]
    },
    {
      "id": "after",
      "title": "After Rescripting",
      "fields": [
        { "id": "emotion-after", "type": "likert", "label": "Emotion intensity now (0–100)", "min": 0, "max": 100, "step": 5 },
        { "id": "belief-after", "type": "likert", "label": "Belief in original meaning now (0–100%)", "min": 0, "max": 100, "step": 5 },
        { "id": "emotion-change", "type": "computed", "label": "Emotion change", "computation": { "operation": "difference", "field_a": "emotion-intensity", "field_b": "emotion-after", "format": "percentage_change" } },
        { "id": "learning", "type": "textarea", "label": "What was the most important shift?", "placeholder": "What changed in how you see yourself or the event?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['imagery rescripting', 'CBT', 'PTSD', 'social anxiety', 'schema', 'imagery', 'memory'],
  20, 22, true, 1
);


-- ============================================================================
-- 3. DEPRESSION (D5, D7)
-- ============================================================================

-- D5: Core Belief Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Core Belief Worksheet',
  'core-belief-worksheet',
  'Identify a core belief, rate its conviction, gather evidence for and against, and develop a more balanced alternative.',
  'Core beliefs are deeply held assumptions about yourself, others, or the world. This worksheet helps you examine one specific belief systematically: how strongly you hold it, what supports it, what contradicts it, and what a more balanced version might look like.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "belief",
      "title": "The Core Belief",
      "fields": [
        { "id": "belief", "type": "textarea", "label": "What is the core belief?", "placeholder": "e.g. I'm worthless, I'm unlovable, I'm a failure", "required": true },
        { "id": "conviction", "type": "likert", "label": "How strongly do you believe this? (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "evidence",
      "title": "Examining the Evidence",
      "fields": [
        { "id": "evidence-for", "type": "textarea", "label": "Evidence that supports this belief", "placeholder": "Be specific — what experiences or facts support it?" },
        { "id": "evidence-against", "type": "textarea", "label": "Evidence that contradicts this belief", "placeholder": "What experiences don't fit? What would others say?" },
        { "id": "biases", "type": "textarea", "label": "Am I applying any thinking biases to the evidence?", "placeholder": "e.g. Discounting positives, overgeneralising from one event, emotional reasoning" }
      ]
    },
    {
      "id": "alternative",
      "title": "More Balanced Belief",
      "fields": [
        { "id": "balanced", "type": "textarea", "label": "What is a more balanced version of this belief?", "placeholder": "Not the opposite extreme — a nuanced view that accounts for all the evidence" },
        { "id": "revised-conviction", "type": "likert", "label": "How strongly do you believe the original now? (0–100%)", "min": 0, "max": 100, "step": 5 },
        { "id": "change", "type": "computed", "label": "Conviction change", "computation": { "operation": "difference", "field_a": "conviction", "field_b": "revised-conviction", "format": "percentage_change" } }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['core beliefs', 'depression', 'CBT', 'cognitive restructuring', 'evidence'],
  15, 5, true, 1
);


-- D7: Rumination Log / Functional Analysis
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Rumination Functional Analysis',
  'rumination-functional-analysis',
  'Track rumination episodes and analyse their triggers, content, function, and consequences — to understand why you ruminate and what alternatives might work.',
  'Rumination feels like problem-solving but rarely produces solutions. This worksheet helps you step back and examine each episode: what triggered it, what you were going over, what function it served (or seemed to), and what it actually cost you. This builds awareness that rumination is a process, not a useful activity.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "log",
      "title": "Rumination Episodes",
      "fields": [
        {
          "id": "rumination-table",
          "type": "table",
          "label": "Track each rumination episode",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "trigger", "header": "Trigger", "type": "textarea" },
            { "id": "content", "header": "What Were You Going Over?", "type": "textarea" },
            { "id": "function", "header": "What Did It Seem to Achieve?", "type": "textarea" },
            { "id": "actual-cost", "header": "What Did It Actually Cost?", "type": "textarea" },
            { "id": "alternative", "header": "What Could You Do Instead?", "type": "textarea" }
          ],
          "min_rows": 1,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Common triggers? Does rumination ever actually solve the problem? What are the recurring costs?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['rumination', 'depression', 'CBT', 'functional analysis', 'metacognitive', 'thought processes'],
  10, 6, true, 1
);


-- ============================================================================
-- 4. GAD (G6, G7, G8, G9, G10)
-- ============================================================================

-- G6: GAD Intolerance of Uncertainty Formulation (Dugas)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Intolerance of Uncertainty Formulation (Dugas)',
  'intolerance-uncertainty-formulation',
  'A formulation based on Dugas'' intolerance of uncertainty model — mapping IU, positive beliefs about worry, negative problem orientation, and cognitive avoidance.',
  'This model proposes that worry is driven by difficulty tolerating uncertainty. Four components maintain the problem: intolerance of uncertainty itself, positive beliefs about worry, negative problem orientation (feeling overwhelmed), and cognitive avoidance (using worry to avoid emotional imagery). Work through each component with your therapist.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "iu",
      "title": "Intolerance of Uncertainty",
      "fields": [
        { "id": "iu-beliefs", "type": "textarea", "label": "What are your beliefs about uncertainty?", "placeholder": "e.g. I can't cope with not knowing, Uncertainty means something bad will happen, I need to be certain before I can act" },
        { "id": "iu-rating", "type": "likert", "label": "How much does uncertainty distress you? (0–100)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "positive-worry-beliefs",
      "title": "Positive Beliefs About Worry",
      "fields": [
        { "id": "positive-beliefs", "type": "textarea", "label": "What do you believe worry does for you?", "placeholder": "e.g. Worrying prepares me, Worrying shows I care, Worrying prevents bad things" }
      ]
    },
    {
      "id": "problem-orientation",
      "title": "Negative Problem Orientation",
      "fields": [
        { "id": "orientation", "type": "textarea", "label": "How do you typically approach problems?", "placeholder": "e.g. I feel overwhelmed, I doubt my ability to solve problems, Problems feel threatening, I avoid dealing with them" }
      ]
    },
    {
      "id": "cognitive-avoidance",
      "title": "Cognitive Avoidance",
      "fields": [
        { "id": "avoidance", "type": "textarea", "label": "How do you use abstract worry to avoid emotional content?", "placeholder": "e.g. I worry in words rather than imagining the outcome, I jump between worries to avoid sitting with any one" }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "key-factor", "type": "textarea", "label": "Which component feels most relevant to your worry?", "placeholder": "Where should therapy focus?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['GAD', 'intolerance of uncertainty', 'Dugas', 'formulation', 'CBT', 'worry'],
  20, 6, true, 1
);


-- G7: ATT Practice Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Attention Training Practice Log',
  'attention-training-practice-log',
  'Track Attention Training Technique (ATT) practice sessions with focus ratings and observations.',
  'ATT is a structured exercise to strengthen flexible attention control. Practise daily for 12 minutes: selective attention (focus on one sound), attention switching (move between sounds), and divided attention (hold multiple sounds). Rate your focus after each session.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "log",
      "title": "ATT Practice Sessions",
      "fields": [
        {
          "id": "att-table",
          "type": "table",
          "label": "Daily practice log",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "selective", "header": "Selective Focus (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "switching", "header": "Switching Focus (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "divided", "header": "Divided Focus (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "self-focus-before", "header": "Self-Focus Before (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "self-focus-after", "header": "Self-Focus After (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 7,
          "max_rows": 14
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Reflection",
      "fields": [
        { "id": "progress", "type": "textarea", "label": "What changes are you noticing?", "placeholder": "Is it getting easier? Are you more aware of when attention drifts to self-focus?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['ATT', 'attention training', 'metacognitive', 'Wells', 'GAD', 'social anxiety', 'self-focused attention'],
  5, 7, true, 1
);


-- G8: Detached Mindfulness Practice Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Detached Mindfulness Practice Log',
  'detached-mindfulness-practice-log',
  'Track detached mindfulness practice — learning to observe thoughts and worries without engaging with or trying to control them.',
  'Detached mindfulness means noticing a thought or worry without engaging with it, analysing it, or trying to push it away. It''s like watching clouds pass. Rate how well you managed to observe without engaging after each practice.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "log",
      "title": "Practice Log",
      "fields": [
        {
          "id": "dm-table",
          "type": "table",
          "label": "Detached mindfulness practice sessions",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "trigger", "header": "Thought / Worry Noticed", "type": "textarea" },
            { "id": "engagement", "header": "Engagement Level (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "detachment", "header": "Detachment Achieved (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "what-helped", "header": "What Helped?", "type": "textarea" }
          ],
          "min_rows": 1,
          "max_rows": 14
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "learning", "type": "textarea", "label": "What are you learning about your relationship with thoughts?", "placeholder": "What happens to the thought when you don't engage with it?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['detached mindfulness', 'metacognitive', 'Wells', 'GAD', 'CBT', 'thought observation'],
  5, 8, true, 1
);


-- G9: Uncertainty Exposure Hierarchy
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Uncertainty Exposure Hierarchy',
  'uncertainty-exposure-hierarchy',
  'Build a hierarchy of situations involving uncertainty, ranked by distress, to guide graded exposure to tolerating not knowing.',
  'If intolerance of uncertainty drives your worry, deliberately practising tolerating uncertainty is key. List situations where you would need to sit with uncertainty (e.g. not checking, not asking for reassurance, making a decision without being sure), rate the distress, and work up from the bottom.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "hierarchy",
      "title": "Uncertainty Exposure Hierarchy",
      "fields": [
        {
          "id": "uncertainty-ladder",
          "type": "hierarchy",
          "label": "Situations involving uncertainty",
          "columns": [
            { "id": "situation", "header": "Uncertainty Situation", "type": "textarea" },
            { "id": "distress", "header": "Distress (0–100)", "type": "number", "min": 0, "max": 100 },
            { "id": "completed", "header": "Done?", "type": "text" }
          ],
          "sort_by": "distress",
          "sort_direction": "desc",
          "min_rows": 5,
          "max_rows": 15,
          "visualisation": "gradient_bar",
          "gradient": { "low": "#e8f5e9", "mid": "#e4a930", "high": "#dc2626" }
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['uncertainty', 'exposure hierarchy', 'GAD', 'Dugas', 'CBT', 'intolerance of uncertainty'],
  15, 9, true, 1
);


-- G10: Applied Relaxation Practice Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'generalised-anxiety-gad'),
  'Applied Relaxation Practice Log',
  'applied-relaxation-practice-log',
  'Track applied relaxation practice through the stages: progressive muscle relaxation, release-only, cue-controlled, differential, and rapid relaxation.',
  'Applied relaxation is a skills-based approach where you gradually learn to relax quickly and on cue. Track your practice through each stage and rate how relaxed you feel before and after each session.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "log",
      "title": "Practice Log",
      "fields": [
        {
          "id": "ar-table",
          "type": "table",
          "label": "Applied relaxation practice",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "stage", "header": "Stage", "type": "text" },
            { "id": "duration", "header": "Duration (mins)", "type": "number", "min": 0 },
            { "id": "tension-before", "header": "Tension Before (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "tension-after", "header": "Tension After (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "notes", "header": "Notes", "type": "textarea" }
          ],
          "min_rows": 7,
          "max_rows": 14
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['applied relaxation', 'Ost', 'GAD', 'CBT', 'progressive muscle relaxation', 'anxiety management'],
  5, 10, true, 1
);


-- ============================================================================
-- 5. PANIC (P6)
-- ============================================================================

-- P6: Belief Survey Tool
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'panic-disorder'),
  'Belief Survey Tool',
  'belief-survey-tool',
  'Gather normalising evidence by surveying others about whether they experience the same body sensations and fears — challenging the belief that your experience is abnormal.',
  'Ask people you trust whether they ever experience the sensations you fear (e.g. heart racing, dizziness, breathlessness) and what they think causes them. This provides normalising evidence that these sensations are common and not a sign of catastrophe.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "target",
      "title": "What I Want to Find Out",
      "fields": [
        { "id": "sensation", "type": "textarea", "label": "Which sensation or experience do you want to ask about?", "placeholder": "e.g. Does your heart ever race? Do you ever feel dizzy for no reason?", "required": true },
        { "id": "prediction", "type": "textarea", "label": "What do you predict most people will say?", "placeholder": "e.g. Nobody else experiences this; they'll think I'm weird for asking" }
      ]
    },
    {
      "id": "survey",
      "title": "Survey Results",
      "fields": [
        {
          "id": "survey-table",
          "type": "table",
          "label": "What people said",
          "columns": [
            { "id": "person", "header": "Person", "type": "text" },
            { "id": "response", "header": "Their Response", "type": "textarea" },
            { "id": "surprised", "header": "Surprised You?", "type": "text", "width": "narrow" }
          ],
          "min_rows": 3,
          "max_rows": 8
        }
      ]
    },
    {
      "id": "reflection",
      "title": "What Does This Tell You?",
      "fields": [
        { "id": "learning", "type": "textarea", "label": "What did you learn from the survey?", "placeholder": "How common are these sensations? What does this mean for your catastrophic interpretation?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['panic', 'belief survey', 'CBT', 'normalising', 'Clark', 'behavioural experiment'],
  15, 5, true, 1
);


-- ============================================================================
-- 6. SOCIAL ANXIETY (S5, S6, S7)
-- ============================================================================

-- S5: Attention Refocusing Experiment Log
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Attention Refocusing Experiment Log',
  'attention-refocusing-experiment',
  'Compare the effects of self-focused attention vs external focus during social situations to test whether self-focus makes anxiety worse.',
  'This experiment tests a key prediction: when you focus on yourself, anxiety increases; when you focus outward (on the conversation, the environment, the other person), anxiety decreases. Try each mode in similar situations and compare.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "experiments",
      "title": "Attention Experiments",
      "fields": [
        {
          "id": "attention-table",
          "type": "table",
          "label": "Compare self-focused vs external focus",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "situation", "header": "Social Situation", "type": "textarea" },
            { "id": "focus-mode", "header": "Focus Mode", "type": "text" },
            { "id": "anxiety", "header": "Anxiety (0–100)", "type": "number", "min": 0, "max": 100 },
            { "id": "performance", "header": "Performance (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "self-image", "header": "Self-Image Negative? (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 4,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "comparison", "type": "textarea", "label": "What difference did you notice between self-focused and externally focused situations?", "placeholder": "Did anxiety, performance, or the self-image change?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'attention', 'self-focused attention', 'CBT', 'Clark', 'Wells', 'behavioural experiment'],
  10, 5, true, 1
);


-- S6: Social Self-Belief Updating Worksheet
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Social Belief Updating Worksheet',
  'social-belief-updating',
  'Track changes in a specific social belief across multiple experiments — building cumulative evidence for an updated view of yourself in social situations.',
  'Pick one core social belief and track how it changes across experiments, video feedback, and real-life experiences. Rate conviction before and after each piece of evidence.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "target-belief",
      "title": "Target Belief",
      "fields": [
        { "id": "belief", "type": "textarea", "label": "The social belief I'm updating:", "placeholder": "e.g. People think I'm boring, I always come across as anxious", "required": true },
        { "id": "initial-conviction", "type": "likert", "label": "Current conviction (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "evidence",
      "title": "Cumulative Evidence",
      "fields": [
        {
          "id": "evidence-table",
          "type": "table",
          "label": "Evidence that updates this belief",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "source", "header": "Source of Evidence", "type": "textarea" },
            { "id": "what-happened", "header": "What Happened", "type": "textarea" },
            { "id": "conviction-after", "header": "Conviction After (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" }
          ],
          "min_rows": 3,
          "max_rows": 12
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Updated View",
      "fields": [
        { "id": "updated-belief", "type": "textarea", "label": "What is a more accurate belief based on the evidence?", "placeholder": "Rewrite the belief in a way that fits the accumulated evidence" },
        { "id": "final-conviction", "type": "likert", "label": "Conviction in original belief now (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'belief updating', 'CBT', 'encapsulated beliefs', 'evidence accumulation'],
  10, 6, true, 1
);


-- S7: Pre-Post Belief Ratings
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'social-anxiety'),
  'Session Belief Ratings Tracker',
  'session-belief-ratings-tracker',
  'Track key belief conviction ratings before and after each therapy session to measure progress across treatment.',
  'Rate your key beliefs at the start and end of each session. This provides a simple visual record of whether beliefs are shifting over the course of therapy.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "beliefs",
      "title": "Beliefs to Track",
      "fields": [
        { "id": "belief-1", "type": "textarea", "label": "Belief 1:", "placeholder": "e.g. People think I'm boring" },
        { "id": "belief-2", "type": "textarea", "label": "Belief 2:", "placeholder": "e.g. I'll humiliate myself" },
        { "id": "belief-3", "type": "textarea", "label": "Belief 3 (optional):", "placeholder": "e.g. I'm visibly anxious" }
      ]
    },
    {
      "id": "ratings",
      "title": "Session Ratings",
      "fields": [
        {
          "id": "ratings-table",
          "type": "table",
          "label": "Before and after each session",
          "columns": [
            { "id": "session", "header": "Session #", "type": "text", "width": "narrow" },
            { "id": "b1-before", "header": "B1 Before (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "b1-after", "header": "B1 After (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "b2-before", "header": "B2 Before (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "b2-after", "header": "B2 After (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "b3-before", "header": "B3 Before (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "b3-after", "header": "B3 After (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" }
          ],
          "min_rows": 4,
          "max_rows": 20
        }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['social anxiety', 'belief ratings', 'CBT', 'session tracking', 'progress monitoring'],
  5, 7, true, 1
);


-- ============================================================================
-- 7. OCD (O5)
-- ============================================================================

-- O5: TAF Behavioural Experiment
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'),
  'Thought-Action Fusion Experiment',
  'thought-action-fusion-experiment',
  'Test the belief that thinking something makes it more likely to happen (likelihood TAF) or that thinking something is morally equivalent to doing it (moral TAF).',
  'Thought-action fusion is the belief that your thoughts have power — that thinking about something bad makes it happen, or that thinking something bad is as wrong as doing it. These experiments help you test whether thoughts actually influence events or define your character.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "taf-type",
      "title": "The TAF Belief",
      "fields": [
        { "id": "intrusion", "type": "textarea", "label": "What intrusive thought are you having?", "placeholder": "e.g. What if I push someone onto the tracks", "required": true },
        { "id": "taf-belief", "type": "textarea", "label": "What do you believe about having this thought?", "placeholder": "e.g. Having this thought makes it more likely to happen / Having this thought makes me a bad person" },
        { "id": "conviction", "type": "likert", "label": "Conviction (0–100%)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "experiment",
      "title": "Testing the Belief",
      "fields": [
        { "id": "experiment-plan", "type": "textarea", "label": "What experiment will you do?", "placeholder": "e.g. Deliberately think about a specific neutral event happening (e.g. your therapist wearing a red shirt) and see if it occurs" },
        { "id": "result", "type": "textarea", "label": "What happened?", "placeholder": "Did the thought make the event happen?" },
        { "id": "moral-test", "type": "textarea", "label": "If moral TAF: would you judge a friend for having the same thought?", "placeholder": "Does having the thought actually make them a bad person?" }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "revised-conviction", "type": "likert", "label": "Conviction in TAF belief now (0–100%)", "min": 0, "max": 100, "step": 5 },
        { "id": "learning", "type": "textarea", "label": "What did you learn about the power of thoughts?", "placeholder": "Can thoughts cause events? Does thinking something make you that kind of person?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['OCD', 'thought-action fusion', 'TAF', 'CBT', 'behavioural experiment', 'intrusions'],
  15, 5, true, 1
);


-- ============================================================================
-- 8. PTSD (PT7, PT8, PT9)
-- ============================================================================

-- PT7: Site Visit Planning and Reflection
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Site Visit Planning & Reflection',
  'site-visit-planning-reflection',
  'Prepare for a visit to the trauma site, record predictions, and process the experience afterwards to update the trauma memory.',
  'Site visits help update the trauma memory by providing new, present-day information about the location. Plan the visit carefully with your therapist, record your predictions, and afterwards note what was different from your expectations.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "planning",
      "title": "Before the Visit",
      "fields": [
        { "id": "location", "type": "textarea", "label": "Where are you visiting?", "required": true },
        { "id": "predictions", "type": "textarea", "label": "What do you predict you will feel or experience?", "placeholder": "e.g. I'll be overwhelmed, It will look exactly as I remember, I won't be able to cope" },
        { "id": "distress-prediction", "type": "likert", "label": "Predicted distress (0–100)", "min": 0, "max": 100, "step": 5 },
        { "id": "safety-plan", "type": "textarea", "label": "What is your plan if distress becomes too high?", "placeholder": "Grounding techniques, companion, ability to leave, phone your therapist" }
      ]
    },
    {
      "id": "during",
      "title": "During the Visit",
      "fields": [
        { "id": "observations", "type": "textarea", "label": "What do you notice that is DIFFERENT from the trauma?", "placeholder": "What has changed? What is the same? What new information does this give you?" },
        { "id": "actual-distress", "type": "likert", "label": "Actual peak distress (0–100)", "min": 0, "max": 100, "step": 5 }
      ]
    },
    {
      "id": "after",
      "title": "After the Visit",
      "fields": [
        { "id": "comparison", "type": "textarea", "label": "How did the experience compare to your predictions?", "placeholder": "Was it as bad as you expected? What surprised you?" },
        { "id": "updated-meaning", "type": "textarea", "label": "What new information does this give you about the trauma and your safety now?", "placeholder": "What does visiting the site tell you about then vs now?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'site visit', 'CT-PTSD', 'Ehlers', 'Clark', 'trauma', 'stimulus discrimination'],
  15, 7, true, 1
);


-- PT8: Reclaiming Life Activity Plan
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Reclaiming Life Activity Plan',
  'reclaiming-life-activity-plan',
  'Identify valued activities lost to PTSD and plan a graded return to engagement with life.',
  'PTSD often leads to giving up activities that once mattered. This worksheet helps you identify what you''ve lost, rate the importance of reclaiming each activity, and plan a graded return.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "lost-activities",
      "title": "Activities Lost to PTSD",
      "fields": [
        {
          "id": "activities-table",
          "type": "table",
          "label": "What have you given up or reduced since the trauma?",
          "columns": [
            { "id": "activity", "header": "Activity", "type": "textarea" },
            { "id": "importance", "header": "Importance (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "barrier", "header": "What Stops You?", "type": "textarea" },
            { "id": "first-step", "header": "Smallest First Step", "type": "textarea" }
          ],
          "min_rows": 3,
          "max_rows": 10
        }
      ]
    },
    {
      "id": "plan",
      "title": "This Week's Plan",
      "fields": [
        { "id": "chosen-activity", "type": "textarea", "label": "Which activity will you start with?", "placeholder": "Pick the one with the best balance of importance and achievability" },
        { "id": "when", "type": "textarea", "label": "When and how will you do it?", "placeholder": "Be specific" },
        { "id": "outcome", "type": "textarea", "label": "How did it go?", "placeholder": "What was it like? What did you learn?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'reclaiming life', 'behavioural activation', 'trauma', 'CBT', 'valued activities'],
  15, 8, true, 1
);


-- PT9: Impact Statement Worksheet (CPT)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'ptsd-trauma'),
  'Trauma Impact Statement',
  'trauma-impact-statement-cpt',
  'Write a structured impact statement exploring how the trauma has affected your beliefs about safety, trust, power, esteem, and intimacy.',
  'Write freely about how the trauma has changed the way you see yourself, others, and the world. Focus especially on the five CPT themes: safety, trust, power/control, esteem, and intimacy. This is not a factual account of what happened — it''s about meaning and impact.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "impact",
      "title": "Impact Statement",
      "fields": [
        { "id": "overall-impact", "type": "textarea", "label": "How has the trauma affected your life?", "placeholder": "Write freely about the overall impact — on your daily life, relationships, sense of self, view of the future" },
        { "id": "safety", "type": "textarea", "label": "Safety: How has it affected your sense of safety?", "placeholder": "Do you feel safe? In what situations do you feel unsafe?" },
        { "id": "trust", "type": "textarea", "label": "Trust: How has it affected your ability to trust?", "placeholder": "Do you trust others? Yourself? Institutions?" },
        { "id": "power", "type": "textarea", "label": "Power/Control: How has it affected your sense of control?", "placeholder": "Do you feel in control of your life? Helpless? Powerless?" },
        { "id": "esteem", "type": "textarea", "label": "Esteem: How has it affected how you see yourself?", "placeholder": "Your self-worth, self-respect, confidence" },
        { "id": "intimacy", "type": "textarea", "label": "Intimacy: How has it affected closeness and relationships?", "placeholder": "Emotional and physical closeness, vulnerability, connection" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['PTSD', 'impact statement', 'CPT', 'trauma', 'beliefs', 'safety', 'trust', 'esteem'],
  30, 9, true, 1
);


-- ============================================================================
-- 9. HEALTH ANXIETY (H5, H6)
-- ============================================================================

-- H5: Health Behaviour Cost-Benefit
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'health-anxiety'),
  'Health Behaviour Cost-Benefit Analysis',
  'health-behaviour-cost-benefit',
  'Weigh up the costs and benefits of specific health anxiety behaviours — checking, Googling, reassurance-seeking — to build motivation for change.',
  'Apply the cost-benefit framework specifically to your health anxiety safety behaviours. What does each behaviour give you in the short term? What does it cost in the long term?',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "behaviours",
      "title": "Health Anxiety Behaviours",
      "fields": [
        {
          "id": "behaviour-record",
          "type": "record",
          "label": "Behaviour Analysis",
          "min_records": 1,
          "max_records": 5,
          "groups": [
            {
              "id": "behaviour",
              "header": "Behaviour",
              "width": "normal",
              "fields": [
                { "id": "what", "type": "textarea", "placeholder": "e.g. Googling symptoms, checking body, asking partner for reassurance" }
              ]
            },
            {
              "id": "benefits",
              "header": "Benefits",
              "width": "normal",
              "fields": [
                { "id": "short-term", "type": "textarea", "placeholder": "Short-term: what does it give you?" },
                { "id": "long-term-benefit", "type": "textarea", "placeholder": "Long-term: any lasting benefit?" }
              ]
            },
            {
              "id": "costs",
              "header": "Costs",
              "width": "normal",
              "fields": [
                { "id": "short-term-cost", "type": "textarea", "placeholder": "Short-term: time, distress, reassurance wearing off?" },
                { "id": "long-term-cost", "type": "textarea", "placeholder": "Long-term: maintaining anxiety, reducing tolerance for uncertainty?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Overall",
      "fields": [
        { "id": "verdict", "type": "textarea", "label": "Looking at the full picture, are these behaviours serving you?", "placeholder": "Do the costs outweigh the benefits?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['health anxiety', 'cost-benefit', 'CBT', 'checking', 'reassurance', 'motivation'],
  10, 5, true, 1
);


-- H6: Health Checking Response Prevention Diary
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'health-anxiety'),
  'Health Checking Reduction Diary',
  'health-checking-reduction-diary',
  'Track gradual reduction in body checking behaviours — setting targets, monitoring frequency, and recording what happens when you check less.',
  'Set a target for reducing a specific checking behaviour each week. Record how often you checked, whether you met the target, and what happened to your anxiety. Build evidence that reducing checking doesn''t lead to the feared outcome.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "target",
      "title": "This Week's Target",
      "fields": [
        { "id": "behaviour", "type": "textarea", "label": "Which checking behaviour are you reducing?", "placeholder": "e.g. Checking lymph nodes, Googling symptoms, examining skin", "required": true },
        { "id": "current-frequency", "type": "text", "label": "Current frequency:", "placeholder": "e.g. 10 times per day" },
        { "id": "target-frequency", "type": "text", "label": "This week's target:", "placeholder": "e.g. Maximum 5 times per day" }
      ]
    },
    {
      "id": "log",
      "title": "Daily Log",
      "fields": [
        {
          "id": "checking-table",
          "type": "table",
          "label": "Daily checking record",
          "columns": [
            { "id": "day", "header": "Day", "type": "text", "width": "narrow" },
            { "id": "checks", "header": "Times Checked", "type": "number", "min": 0 },
            { "id": "met-target", "header": "Met Target?", "type": "text", "width": "narrow" },
            { "id": "anxiety", "header": "Avg Anxiety (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "feared-outcome", "header": "Did Feared Outcome Occur?", "type": "text", "width": "narrow" }
          ],
          "min_rows": 7,
          "max_rows": 7
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Weekly Review",
      "fields": [
        { "id": "learning", "type": "textarea", "label": "What happened when you checked less?", "placeholder": "Did anxiety pass? Did the feared illness materialise?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['health anxiety', 'checking reduction', 'response prevention', 'CBT', 'graded reduction'],
  5, 6, true, 1
);


-- ============================================================================
-- 10. BDD (BD1, BD2, BD3)
-- ============================================================================

-- BD1: BDD Formulation (Veale)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'bdd'),
  'BDD Formulation (Veale)',
  'bdd-formulation-veale',
  'A formulation based on the cognitive-behavioural model of BDD — mapping self-focused processing, distorted self-image, rumination, and safety behaviours.',
  'BDD is maintained by a cycle of self-focused attention on appearance, a distorted mental image of the perceived flaw, rumination about its meaning, and safety behaviours (checking, camouflaging, avoiding). Map each component with your therapist.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "formulation",
      "title": "BDD Maintenance Cycle",
      "fields": [{
        "id": "diagram",
        "type": "formulation",
        "label": "BDD Model (Veale)",
        "layout": "cycle",
        "formulation_config": { "title": "BDD Cognitive-Behavioural Model (Veale)", "show_title": true },
        "nodes": [
          { "id": "trigger", "slot": "top", "label": "Trigger", "domain_colour": "#6366f1", "fields": [{ "id": "trigger-content", "type": "textarea", "placeholder": "e.g. Seeing reflection, social situation, comment about appearance, photograph" }] },
          { "id": "self-image", "slot": "top-right", "label": "Distorted Self-Image", "domain_colour": "#dc2626", "fields": [{ "id": "image-content", "type": "textarea", "placeholder": "What do you 'see'? How does the flaw appear in your mind? (usually more extreme than reality)" }] },
          { "id": "self-focus", "slot": "right", "label": "Self-Focused Attention", "domain_colour": "#f97316", "fields": [{ "id": "focus-content", "type": "textarea", "placeholder": "e.g. Monitoring the flaw, comparing with others, zooming in on the feature" }] },
          { "id": "rumination", "slot": "bottom-right", "label": "Rumination & Negative Appraisal", "domain_colour": "#eab308", "fields": [{ "id": "rumination-content", "type": "textarea", "placeholder": "e.g. I look disgusting, Everyone can see it, I'll never be accepted, My life is ruined" }] },
          { "id": "emotions", "slot": "bottom", "label": "Distress", "domain_colour": "#ef4444", "fields": [{ "id": "emotion-content", "type": "textarea", "placeholder": "e.g. Shame, disgust, anxiety, depression, anger" }] },
          { "id": "safety", "slot": "left", "label": "Safety Behaviours", "domain_colour": "#a855f7", "fields": [{ "id": "safety-content", "type": "textarea", "placeholder": "e.g. Mirror checking, camouflage (makeup, clothing), avoidance of photos/social events, seeking reassurance, skin picking" }] }
        ],
        "connections": [
          { "from": "trigger", "to": "self-image", "style": "arrow", "direction": "one_way" },
          { "from": "self-image", "to": "self-focus", "style": "arrow", "direction": "one_way" },
          { "from": "self-focus", "to": "rumination", "style": "arrow", "direction": "one_way" },
          { "from": "rumination", "to": "emotions", "style": "arrow", "direction": "one_way" },
          { "from": "emotions", "to": "safety", "style": "arrow", "direction": "one_way" },
          { "from": "safety", "to": "self-image", "style": "arrow_dashed", "direction": "one_way", "label": "Reinforces" }
        ]
      }]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "key-insight", "type": "textarea", "label": "What role do safety behaviours play in maintaining your distress?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['BDD', 'body dysmorphic disorder', 'formulation', 'Veale', 'CBT', 'self-image', 'appearance'],
  25, 1, true, 1
);


-- BD2: BDD Monitoring Diary
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'bdd'),
  'BDD Monitoring Diary',
  'bdd-monitoring-diary',
  'Track BDD episodes — triggers, preoccupation with the perceived flaw, rituals, and mood impact.',
  'Record each episode of significant preoccupation with your appearance. Note the trigger, what you were focused on, what you did about it, and how it affected your mood.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "diary",
      "title": "BDD Episode Log",
      "fields": [
        {
          "id": "bdd-table",
          "type": "table",
          "label": "Track preoccupation episodes",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "trigger", "header": "Trigger", "type": "textarea" },
            { "id": "focus", "header": "What Were You Focused On?", "type": "textarea" },
            { "id": "duration", "header": "Duration (mins)", "type": "number", "min": 0 },
            { "id": "ritual", "header": "Ritual / Safety Behaviour", "type": "textarea" },
            { "id": "distress", "header": "Distress (0–100)", "type": "number", "min": 0, "max": 100 }
          ],
          "min_rows": 1,
          "max_rows": 14
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Patterns",
      "fields": [
        { "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Common triggers? How much time is spent on rituals?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['BDD', 'monitoring', 'diary', 'CBT', 'appearance', 'preoccupation'],
  10, 2, true, 1
);


-- BD3: Mirror Retraining Protocol
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order,
  is_curated, schema_version
) VALUES (
  (SELECT id FROM categories WHERE slug = 'bdd'),
  'Mirror Retraining Protocol',
  'mirror-retraining-protocol',
  'Practise using mirrors differently — shifting from selective, critical zooming to a full, descriptive, non-judgemental observation of your whole body.',
  'Mirror retraining replaces the BDD mirror checking habit (zoomed-in, critical, judgemental) with a new approach: standing at a normal distance, describing your whole body from top to bottom using neutral, descriptive language (like describing a friend). Practise regularly.',
  $schema${
  "version": 1,
  "sections": [
    {
      "id": "practice",
      "title": "Mirror Retraining Sessions",
      "fields": [
        {
          "id": "mirror-table",
          "type": "table",
          "label": "Practice log",
          "columns": [
            { "id": "date", "header": "Date", "type": "text", "width": "narrow" },
            { "id": "duration", "header": "Duration (mins)", "type": "number", "min": 0 },
            { "id": "distance", "header": "Distance", "type": "text" },
            { "id": "descriptions", "header": "Neutral Descriptions Used", "type": "textarea" },
            { "id": "urge-to-zoom", "header": "Urge to Zoom In (0–10)", "type": "number", "min": 0, "max": 10 },
            { "id": "distress", "header": "Distress (0–10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 1,
          "max_rows": 14
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        { "id": "learning", "type": "textarea", "label": "What are you noticing about the difference between checking and retraining?", "placeholder": "How does describing yourself neutrally compare to the critical checking?" }
      ]
    }
  ]
}$schema$::jsonb,
  true, false,
  ARRAY['BDD', 'mirror retraining', 'CBT', 'Veale', 'appearance', 'body image'],
  10, 3, true, 1
);


-- ============================================================================
-- 11. EATING DISORDERS (E5, E6, E7, E8, E9)
-- ============================================================================

-- E5: Body Checking / Avoidance Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Body Checking & Avoidance Diary', 'body-checking-avoidance-diary',
  'Track body checking and body avoidance behaviours, their triggers, and function.',
  'Body checking (pinching skin, measuring, mirror gazing) and body avoidance (refusing to look, baggy clothes) both maintain preoccupation with shape and weight. Log each behaviour to build awareness.',
  $schema${ "version": 1, "sections": [{ "id": "log", "title": "Body Checking / Avoidance Log", "fields": [{ "id": "checking-table", "type": "table", "label": "Daily record", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "behaviour", "header": "Checking or Avoidance Behaviour", "type": "textarea" }, { "id": "trigger", "header": "Trigger", "type": "textarea" }, { "id": "function", "header": "What Was It Trying to Achieve?", "type": "textarea" }, { "id": "mood-after", "header": "Mood After (0–10)", "type": "number", "min": 0, "max": 10 }], "min_rows": 1, "max_rows": 14 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Does checking/avoidance improve or worsen your mood?" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'body checking', 'body avoidance', 'CBT-E', 'body image'], 10, 5, true, 1
);

-- E6: Dietary Rule Testing Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Dietary Rule Testing Worksheet', 'dietary-rule-testing',
  'Identify rigid dietary rules and design experiments to test what happens when you break them.',
  'Eating disorders are maintained by strict rules about what, when, and how much to eat. This worksheet helps you identify a specific rule, predict what will happen if you break it, and then test it. Most people discover the feared outcome doesn''t happen.',
  $schema${ "version": 1, "sections": [{ "id": "rule", "title": "The Dietary Rule", "fields": [{ "id": "rule", "type": "textarea", "label": "What is the rule?", "placeholder": "e.g. I must not eat after 6pm, I can't eat carbs, I must eat under X calories", "required": true }, { "id": "prediction", "type": "textarea", "label": "What do you predict will happen if you break it?", "placeholder": "e.g. I'll gain weight immediately, I'll binge, I'll feel disgusting" }, { "id": "conviction", "type": "likert", "label": "Conviction in prediction (0–100%)", "min": 0, "max": 100, "step": 5 }] }, { "id": "experiment", "title": "The Experiment", "fields": [{ "id": "what-did", "type": "textarea", "label": "What did you do to test the rule?", "placeholder": "Be specific" }, { "id": "what-happened", "type": "textarea", "label": "What actually happened?", "placeholder": "Describe the actual outcome" }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "revised-conviction", "type": "likert", "label": "Conviction in prediction now (0–100%)", "min": 0, "max": 100, "step": 5 }, { "id": "learning", "type": "textarea", "label": "What did you learn?", "placeholder": "Was the prediction accurate?" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'dietary rules', 'CBT-E', 'behavioural experiment', 'food rules'], 15, 6, true, 1
);

-- E7: Weight Monitoring Chart
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Weekly Weight Monitoring', 'weekly-weight-monitoring',
  'Track weekly weight to observe natural fluctuation and reduce the power of daily weighing.',
  'Weigh yourself once per week at the same time under the same conditions. Plot the trend over time. This replaces daily or multiple-daily weighing and helps you see that weight naturally fluctuates without meaning you''ve "gained weight."',
  $schema${ "version": 1, "sections": [{ "id": "weight-log", "title": "Weight Log", "fields": [{ "id": "weight-table", "type": "table", "label": "Weekly weight record", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "weight", "header": "Weight (kg)", "type": "number", "min": 0, "step": 0.1 }, { "id": "reaction", "header": "My Reaction", "type": "textarea" }, { "id": "balanced-view", "header": "Balanced View", "type": "textarea" }], "min_rows": 4, "max_rows": 16 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "trend", "type": "textarea", "label": "What does the overall trend show?", "placeholder": "Is it relatively stable? Can you see natural fluctuation?" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'weight monitoring', 'CBT-E', 'weekly weighing'], 5, 7, true, 1
);

-- E8: Shape/Weight Belief Experiment
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Shape & Weight Belief Experiment', 'shape-weight-belief-experiment',
  'Test specific predictions about the consequences of changes in shape, weight, or eating.',
  'Many eating disorder beliefs make specific predictions: "If I eat normally, I''ll gain 5kg in a week" or "If I stop exercising, my body will completely change shape." Test these predictions systematically.',
  $schema${ "version": 1, "sections": [{ "id": "prediction", "title": "Prediction", "fields": [{ "id": "belief", "type": "textarea", "label": "What do you predict?", "placeholder": "e.g. If I eat X, I'll gain Y weight / If I stop Z, my body will change", "required": true }, { "id": "conviction", "type": "likert", "label": "Conviction (0–100%)", "min": 0, "max": 100, "step": 5 }] }, { "id": "experiment", "title": "Experiment & Result", "fields": [{ "id": "what-did", "type": "textarea", "label": "What did you do?" }, { "id": "result", "type": "textarea", "label": "What actually happened?" }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "revised", "type": "likert", "label": "Conviction now (0–100%)", "min": 0, "max": 100, "step": 5 }, { "id": "learning", "type": "textarea", "label": "What does this tell you?" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'shape', 'weight', 'CBT-E', 'behavioural experiment'], 15, 8, true, 1
);

-- E9: Perfectionism Formulation and Experiment
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'eating-disorders'), 'Perfectionism Module Worksheet', 'perfectionism-module-worksheet',
  'Explore clinical perfectionism as a maintaining mechanism — mapping the cycle and testing perfectionist rules.',
  'Clinical perfectionism maintains eating disorders by making self-worth contingent on meeting impossible standards. Map your perfectionist cycle and test what happens when you deliberately lower your standards in a specific area.',
  $schema${ "version": 1, "sections": [{ "id": "cycle", "title": "Perfectionism Cycle", "fields": [{ "id": "standards", "type": "textarea", "label": "What unrealistic standards do you hold?", "placeholder": "e.g. I must get 100% in everything, My body must look perfect, I must never make mistakes" }, { "id": "consequences-meeting", "type": "textarea", "label": "What happens when you meet the standard?", "placeholder": "e.g. Raise the bar higher, discount the achievement, feel temporary relief then set a harder target" }, { "id": "consequences-failing", "type": "textarea", "label": "What happens when you fail to meet it?", "placeholder": "e.g. Self-criticism, compensatory behaviours, restricting, binge, purge" }] }, { "id": "experiment", "title": "Testing Perfectionism", "fields": [{ "id": "rule-to-test", "type": "textarea", "label": "Which perfectionist rule will you test?", "placeholder": "e.g. I must exercise for exactly 1 hour — what if I do 30 minutes?" }, { "id": "prediction", "type": "textarea", "label": "What do you predict?", "placeholder": "What's the worst that could happen?" }, { "id": "result", "type": "textarea", "label": "What happened?", "placeholder": "Was the outcome as bad as predicted?" }] }] }$schema$::jsonb,
  true, false, ARRAY['eating disorder', 'perfectionism', 'CBT-E', 'maintaining mechanism', 'standards'], 15, 9, true, 1
);


-- ============================================================================
-- 12. INSOMNIA (I5, I6, I7)
-- ============================================================================

-- I5: Stimulus Control Instruction Sheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'), 'Stimulus Control Instructions', 'stimulus-control-instructions',
  'The core stimulus control rules for CBT-I — rebuilding the association between bed and sleep.',
  'Stimulus control re-establishes the bed as a cue for sleep rather than wakefulness. Follow these rules consistently. Track your adherence and note what''s hardest.',
  $schema${ "version": 1, "sections": [{ "id": "rules", "title": "Stimulus Control Rules", "fields": [{ "id": "rules-checklist", "type": "checklist", "label": "Tick each rule you followed this week", "options": [{ "id": "bed-sleepy", "label": "Only go to bed when sleepy (not just tired)" }, { "id": "bed-sleep-only", "label": "Use the bed only for sleep (and intimacy) — no phone, TV, reading, worrying" }, { "id": "leave-bed", "label": "If not asleep within ~15 mins, get up and do something calm in another room" }, { "id": "return-sleepy", "label": "Only return to bed when sleepy again" }, { "id": "same-wake", "label": "Get up at the same time every morning regardless of sleep quality" }, { "id": "no-naps", "label": "No daytime naps" }] }] }, { "id": "tracking", "title": "Weekly Adherence", "fields": [{ "id": "adherence-table", "type": "table", "label": "How well did you follow the rules?", "columns": [{ "id": "day", "header": "Day", "type": "text", "width": "narrow" }, { "id": "rules-followed", "header": "Rules Followed (/6)", "type": "number", "min": 0, "max": 6 }, { "id": "hardest", "header": "Hardest Rule", "type": "textarea" }, { "id": "sleep-quality", "header": "Sleep Quality (0–10)", "type": "number", "min": 0, "max": 10 }], "min_rows": 7, "max_rows": 7 }] }] }$schema$::jsonb,
  true, false, ARRAY['insomnia', 'stimulus control', 'CBT-I', 'sleep hygiene', 'bed-sleep association'], 5, 5, true, 1
);

-- I6: Sleep Hygiene Checklist
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'), 'Sleep Hygiene Assessment', 'sleep-hygiene-assessment',
  'Assess current sleep hygiene practices and identify areas for improvement.',
  'Review your current sleep habits and identify which might be contributing to poor sleep. This is a starting point — sleep hygiene alone rarely fixes insomnia, but poor hygiene can undermine other interventions.',
  $schema${ "version": 1, "sections": [{ "id": "assessment", "title": "Sleep Hygiene Checklist", "fields": [{ "id": "hygiene-table", "type": "table", "label": "Rate each area", "columns": [{ "id": "area", "header": "Sleep Hygiene Area", "type": "text" }, { "id": "current", "header": "Current Practice", "type": "textarea" }, { "id": "rating", "header": "How Good? (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "change", "header": "What Could You Change?", "type": "textarea" }], "min_rows": 6, "max_rows": 10 }] }, { "id": "plan", "title": "Changes to Make", "fields": [{ "id": "priorities", "type": "textarea", "label": "Which 2–3 changes will you prioritise?", "placeholder": "Focus on the ones most likely to make a difference" }] }] }$schema$::jsonb,
  true, false, ARRAY['insomnia', 'sleep hygiene', 'CBT-I', 'sleep habits', 'assessment'], 10, 6, true, 1
);

-- I7: Sleep Belief Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'insomnia-sleep'), 'Unhelpful Sleep Beliefs Worksheet', 'unhelpful-sleep-beliefs',
  'Identify and challenge dysfunctional beliefs about sleep that fuel insomnia-related anxiety and arousal.',
  'Beliefs like "I need 8 hours or I can''t function" or "If I don''t sleep tonight, I''ll collapse" create anxiety that makes sleep harder. Identify your beliefs, examine the evidence, and develop more helpful alternatives.',
  $schema${ "version": 1, "sections": [{ "id": "beliefs", "title": "My Sleep Beliefs", "fields": [{ "id": "beliefs-table", "type": "table", "label": "Identify and challenge unhelpful sleep beliefs", "columns": [{ "id": "belief", "header": "Unhelpful Belief", "type": "textarea" }, { "id": "conviction", "header": "Conviction (%)", "type": "number", "min": 0, "max": 100, "suffix": "%" }, { "id": "evidence-against", "header": "Evidence Against", "type": "textarea" }, { "id": "alternative", "header": "More Helpful Belief", "type": "textarea" }], "min_rows": 3, "max_rows": 8 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "learning", "type": "textarea", "label": "How might these beliefs be maintaining your insomnia?", "placeholder": "What happens when you believe you MUST sleep?" }] }] }$schema$::jsonb,
  true, false, ARRAY['insomnia', 'sleep beliefs', 'CBT-I', 'cognitive restructuring', 'dysfunctional beliefs'], 15, 7, true, 1
);


-- ============================================================================
-- 13. CHRONIC PAIN (CP1, CP2, CP3, CP4, CP6)
-- ============================================================================

-- CP1: Chronic Pain Formulation
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Chronic Pain Formulation', 'chronic-pain-formulation',
  'A biopsychosocial formulation for chronic pain — mapping biological, psychological, and social maintaining factors.',
  'Chronic pain is maintained by the interaction of biological factors (the body), psychological factors (thoughts, emotions, behaviours), and social factors (relationships, work, role changes). Map each component with your therapist.',
  $schema${ "version": 1, "layout": "formulation_cross_sectional", "sections": [{ "id": "situation", "domain": "situation", "fields": [{ "id": "pain-description", "type": "textarea", "label": "Pain Experience", "placeholder": "Describe your pain: location, quality, intensity patterns, duration" }] }, { "id": "thoughts", "domain": "thoughts", "fields": [{ "id": "pain-thoughts", "type": "textarea", "label": "Thoughts About Pain", "placeholder": "e.g. This will never get better, Something is seriously damaged, I can't cope, I'll end up in a wheelchair" }] }, { "id": "emotions", "domain": "emotions", "fields": [{ "id": "pain-emotions", "type": "textarea", "label": "Emotional Impact", "placeholder": "e.g. Frustration, anger, sadness, anxiety, hopelessness, grief for lost abilities" }] }, { "id": "physical", "domain": "physical", "fields": [{ "id": "physical-response", "type": "textarea", "label": "Physical Responses", "placeholder": "e.g. Muscle tension, guarding, deconditioning, fatigue, sleep disruption" }] }, { "id": "behaviour", "domain": "behaviour", "fields": [{ "id": "pain-behaviours", "type": "textarea", "label": "Behaviours", "placeholder": "e.g. Avoidance of activity, boom-bust cycles, medication overuse, withdrawal, excessive rest" }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'formulation', 'biopsychosocial', 'CBT', 'pain management'], 20, 1, true, 1
);

-- CP2: Pain Monitoring Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Pain Monitoring Diary', 'pain-monitoring-diary',
  'Track pain levels alongside activity, mood, and coping strategies to identify patterns.',
  'Record pain levels, activity, mood, and what you did to cope at regular intervals. This reveals patterns — which activities help, which aggravate, and how mood and pain interact.',
  $schema${ "version": 1, "sections": [{ "id": "diary", "title": "Pain Diary", "fields": [{ "id": "pain-table", "type": "table", "label": "Daily pain record", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "time", "header": "Time", "type": "text", "width": "narrow" }, { "id": "pain", "header": "Pain (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "activity", "header": "Activity", "type": "textarea" }, { "id": "mood", "header": "Mood (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "coping", "header": "Coping Used", "type": "textarea" }], "min_rows": 1, "max_rows": 28 }, { "id": "avg-pain", "type": "computed", "label": "Average pain", "computation": { "operation": "average", "field": "pain-table.pain" } }] }, { "id": "reflection", "title": "Patterns", "fields": [{ "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Pain-activity-mood connections?" }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'pain diary', 'CBT', 'monitoring', 'pain management'], 10, 2, true, 1
);

-- CP3: Boom-Bust Cycle Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Boom-Bust Cycle Worksheet', 'boom-bust-cycle-worksheet',
  'Identify and break the boom-bust pattern — doing too much on good days and crashing on bad days.',
  'The boom-bust cycle is one of the main barriers to recovery: on a good day you overdo it (boom), which causes a flare-up the next day (bust), leading to rest, recovery, and then another boom. This worksheet helps you spot the pattern and plan a more sustainable, paced approach.',
  $schema${ "version": 1, "sections": [{ "id": "pattern", "title": "My Boom-Bust Pattern", "fields": [{ "id": "boom", "type": "textarea", "label": "What happens on a 'boom' day?", "placeholder": "e.g. Do all the housework, exercise too much, push through pain to finish a project" }, { "id": "bust", "type": "textarea", "label": "What happens on the 'bust' that follows?", "placeholder": "e.g. Pain flare, can't get out of bed, cancel plans, feel defeated" }, { "id": "example", "type": "textarea", "label": "Describe a recent example:", "placeholder": "Last time you overdid it — what happened and what were the consequences?" }] }, { "id": "alternative", "title": "A Paced Alternative", "fields": [{ "id": "paced-plan", "type": "textarea", "label": "What would a paced version look like?", "placeholder": "How could you spread the activity evenly across days?" }, { "id": "stopping-rule", "type": "textarea", "label": "What will your 'stopping rule' be?", "placeholder": "e.g. Stop after 20 minutes regardless of how I feel, take a 10-minute break every hour" }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'boom-bust', 'pacing', 'CBT', 'activity management', 'CFS'], 10, 3, true, 1
);

-- CP4: Graded Activity Scheduler
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Graded Activity Scheduler', 'graded-activity-scheduler-pain',
  'Plan a gradual, time-based increase in activity from a sustainable baseline — not guided by pain, but by a pre-set schedule.',
  'Graded activity means starting from a baseline you can always manage (even on a bad day) and increasing gradually by time, not by how you feel. Track your planned amount, actual amount, and pain level to show that gradual increases are sustainable.',
  $schema${ "version": 1, "sections": [{ "id": "baseline", "title": "Baseline", "fields": [{ "id": "activity", "type": "textarea", "label": "Activity:", "placeholder": "e.g. Walking", "required": true }, { "id": "baseline-amount", "type": "text", "label": "Baseline (sustainable on a bad day):", "placeholder": "e.g. 5 minutes" }, { "id": "target", "type": "text", "label": "Target:", "placeholder": "e.g. 30 minutes" }, { "id": "increment", "type": "text", "label": "Weekly increase:", "placeholder": "e.g. +2 minutes per week" }] }, { "id": "tracking", "title": "Weekly Tracking", "fields": [{ "id": "grading-table", "type": "table", "label": "Track progress", "columns": [{ "id": "week", "header": "Week", "type": "text", "width": "narrow" }, { "id": "planned", "header": "Planned Amount", "type": "text" }, { "id": "actual", "header": "Actual Amount", "type": "text" }, { "id": "pain-during", "header": "Pain During (0–10)", "type": "number", "min": 0, "max": 10 }, { "id": "pain-after", "header": "Pain After (0–10)", "type": "number", "min": 0, "max": 10 }], "min_rows": 4, "max_rows": 12 }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'graded activity', 'pacing', 'CBT', 'exercise', 'deconditioning'], 10, 4, true, 1
);

-- CP6: Pain Flare-Up Management Plan
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'chronic-pain'), 'Pain Flare-Up Management Plan', 'pain-flare-up-plan',
  'Create a plan for managing pain flare-ups — covering prevention, early action, and what to do at each level of severity.',
  'Flare-ups are inevitable with chronic pain, but having a plan makes them manageable. Identify your warning signs, what helps at each stage, and when to seek additional support.',
  $schema${ "version": 1, "sections": [{ "id": "prevention", "title": "Prevention", "fields": [{ "id": "triggers", "type": "textarea", "label": "What typically triggers flare-ups?", "placeholder": "e.g. Overdoing activity, stress, poor sleep, weather changes" }, { "id": "prevention-strategies", "type": "textarea", "label": "What helps prevent them?", "placeholder": "e.g. Pacing, regular movement, sleep hygiene, stress management" }] }, { "id": "action-plan", "title": "Stepped Action Plan", "fields": [{ "id": "mild", "type": "textarea", "label": "🟢 Mild flare (manageable increase):", "placeholder": "e.g. Reduce activity slightly, use relaxation, gentle movement, don't catastrophise" }, { "id": "moderate", "type": "textarea", "label": "🟡 Moderate flare (significant increase):", "placeholder": "e.g. Short-term activity reduction (not bed rest), pain management techniques, contact GP if needed" }, { "id": "severe", "type": "textarea", "label": "🔴 Severe flare (crisis level):", "placeholder": "e.g. Emergency pain management, contact pain team, avoid complete bed rest, use coping statements" }] }] }$schema$::jsonb,
  true, false, ARRAY['chronic pain', 'flare-up', 'management plan', 'CBT', 'self-management'], 15, 6, true, 1
);


-- ============================================================================
-- 14. PSYCHOSIS / CBTp (Ps1, Ps2)
-- ============================================================================

-- Ps1: CBTp Formulation
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'psychosis-cbtp'), 'CBTp Formulation', 'cbtp-formulation',
  'A maintenance-focused formulation for psychosis — mapping triggers, experiences, appraisals, emotions, and coping responses.',
  'This formulation maps how psychotic experiences are maintained by a cycle of triggers, the experience itself, the meaning you give it, the emotions it produces, and the coping strategies you use. It doesn''t assume the experience is or isn''t real — it focuses on the distress and what maintains it.',
  $schema${ "version": 1, "layout": "formulation_cross_sectional", "sections": [{ "id": "situation", "domain": "situation", "fields": [{ "id": "trigger", "type": "textarea", "label": "Trigger / Context", "placeholder": "What was happening when the experience occurred? Stress, isolation, sleep deprivation, substance use?" }] }, { "id": "thoughts", "domain": "thoughts", "fields": [{ "id": "appraisal", "type": "textarea", "label": "Appraisal / Meaning", "placeholder": "What do you make of the experience? e.g. The voices mean I'm being punished, The paranoia means people are plotting against me" }] }, { "id": "emotions", "domain": "emotions", "fields": [{ "id": "emotions", "type": "textarea", "label": "Emotional Response", "placeholder": "e.g. Fear, shame, anger, confusion, hopelessness" }] }, { "id": "physical", "domain": "physical", "fields": [{ "id": "physical", "type": "textarea", "label": "Physical / Sensory Experience", "placeholder": "e.g. Voices (describe), visual experiences, unusual body sensations, hypervigilance" }] }, { "id": "behaviour", "domain": "behaviour", "fields": [{ "id": "coping", "type": "textarea", "label": "Coping Strategies / Behaviours", "placeholder": "e.g. Withdrawal, compliance with voices, safety behaviours, avoidance, substance use, checking" }] }] }$schema$::jsonb,
  true, false, ARRAY['psychosis', 'CBTp', 'formulation', 'maintenance', 'voices', 'paranoia'], 20, 1, true, 1
);

-- Ps2: Voice Power Differential Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'psychosis-cbtp'), 'Voice Power Differential Worksheet', 'voice-power-differential',
  'Examine beliefs about the power of voices — challenging omniscience, omnipotence, and the need to comply.',
  'Distress from voices is often related to beliefs about how powerful they are, not the voices themselves. This worksheet helps you examine your beliefs about the voice''s power, knowledge, and control — and test whether these beliefs are accurate.',
  $schema${ "version": 1, "sections": [{ "id": "beliefs", "title": "Beliefs About the Voice", "fields": [{ "id": "power", "type": "likert", "label": "How powerful is the voice? (0–100)", "min": 0, "max": 100, "step": 5, "anchors": { "0": "No power", "50": "Some power", "100": "All-powerful" } }, { "id": "knowledge", "type": "likert", "label": "How much does the voice know about you? (0–100)", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Nothing", "50": "Some things", "100": "Everything" } }, { "id": "control", "type": "likert", "label": "How much control does the voice have over you? (0–100)", "min": 0, "max": 100, "step": 5, "anchors": { "0": "None", "50": "Some", "100": "Complete" } }, { "id": "compliance", "type": "likert", "label": "How much must you obey the voice? (0–100)", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Not at all", "50": "Sometimes", "100": "Always" } }] }, { "id": "challenging", "title": "Testing These Beliefs", "fields": [{ "id": "evidence-power", "type": "textarea", "label": "What evidence is there that the voice is NOT all-powerful?", "placeholder": "Has the voice ever been wrong? Have its threats ever not come true?" }, { "id": "evidence-knowledge", "type": "textarea", "label": "What evidence is there that the voice does NOT know everything?", "placeholder": "Has it ever got something wrong about your thoughts or what will happen?" }, { "id": "evidence-control", "type": "textarea", "label": "What evidence is there that you have some control?", "placeholder": "Have you ever not obeyed and nothing happened? Can you sometimes ignore it?" }] }, { "id": "reflection", "title": "Revised View", "fields": [{ "id": "revised-power", "type": "likert", "label": "Revised power rating (0–100)", "min": 0, "max": 100, "step": 5 }, { "id": "learning", "type": "textarea", "label": "What does this tell you about the relationship between you and the voice?" }] }] }$schema$::jsonb,
  true, false, ARRAY['psychosis', 'CBTp', 'voices', 'power differential', 'beliefs about voices', 'Chadwick'], 20, 2, true, 1
);


-- ============================================================================
-- 15. BIPOLAR (Bi1, Bi2, Bi5)
-- ============================================================================

-- Bi1: Bipolar Longitudinal Formulation
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bipolar-disorder'), 'Bipolar Longitudinal Formulation', 'bipolar-longitudinal-formulation',
  'A longitudinal formulation for bipolar disorder — mapping life events, episode patterns, and maintaining factors across time.',
  'This formulation maps your bipolar journey over time: vulnerability factors, life events that triggered episodes, the pattern of your episodes, and the factors that maintain mood instability. It helps you and your therapist see the bigger picture.',
  $schema${ "version": 1, "layout": "formulation_longitudinal", "sections": [{ "id": "early_experiences", "title": "Vulnerability Factors", "fields": [{ "id": "vulnerability", "type": "textarea", "label": "What factors make you vulnerable to mood episodes?", "placeholder": "e.g. Family history, early life stress, temperament, personality traits" }] }, { "id": "core_beliefs", "title": "Core Beliefs About Self & Mood", "highlight": "amber", "fields": [{ "id": "beliefs", "type": "textarea", "label": "What do you believe about yourself and your mood?", "placeholder": "e.g. I can't trust my own feelings, I'm broken, Highs mean I'm finally being myself, I'll always be unstable" }] }, { "id": "rules_assumptions", "title": "Episode Triggers & Patterns", "fields": [{ "id": "triggers", "type": "textarea", "label": "What typically triggers episodes?", "placeholder": "e.g. Sleep disruption, life stress, relationship changes, seasonal patterns, medication changes" }, { "id": "pattern", "type": "textarea", "label": "What is the typical pattern of your episodes?", "placeholder": "Duration, severity, which pole comes first, frequency, seasonal pattern" }] }, { "id": "maintenance_cycle", "title": "Maintaining Factors", "layout": "four_quadrant", "fields": [{ "id": "cycle_thoughts", "type": "textarea", "label": "Thoughts", "domain": "thoughts", "placeholder": "Mood-congruent thinking: depressed = hopeless, elevated = grandiose" }, { "id": "cycle_emotions", "type": "textarea", "label": "Emotions", "domain": "emotions", "placeholder": "Emotional dysregulation, mood reactivity" }, { "id": "cycle_physical", "type": "textarea", "label": "Physical / Sleep", "domain": "physical", "placeholder": "Sleep disruption, circadian rhythm changes, energy fluctuations" }, { "id": "cycle_behaviour", "type": "textarea", "label": "Behaviours", "domain": "behaviour", "placeholder": "Overactivity in highs, withdrawal in lows, substance use, medication non-adherence" }] }] }$schema$::jsonb,
  true, false, ARRAY['bipolar', 'formulation', 'longitudinal', 'CBT', 'mood episodes', 'vulnerability'], 25, 2, true, 1
);

-- Bi2: Bipolar Mood Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bipolar-disorder'), 'Bipolar Mood Diary', 'bipolar-mood-diary',
  'Track daily mood on a depression-euthymia-hypomania/mania scale alongside sleep, medication, and key events.',
  'Rate your mood daily on a scale from -5 (severely depressed) through 0 (euthymic/stable) to +5 (severely manic). Also record hours slept and any significant events. This builds a picture of your mood pattern over time.',
  $schema${ "version": 1, "sections": [{ "id": "diary", "title": "Daily Mood Log", "fields": [{ "id": "mood-table", "type": "table", "label": "Track mood, sleep, and events", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "mood", "header": "Mood (-5 to +5)", "type": "number", "min": -5, "max": 5 }, { "id": "sleep-hours", "header": "Hours Slept", "type": "number", "min": 0, "max": 24, "step": 0.5 }, { "id": "medication", "header": "Medication Taken?", "type": "text", "width": "narrow" }, { "id": "events", "header": "Key Events / Stressors", "type": "textarea" }, { "id": "notes", "header": "Notes", "type": "textarea" }], "min_rows": 7, "max_rows": 31 }] }, { "id": "reflection", "title": "Monthly Reflection", "fields": [{ "id": "patterns", "type": "textarea", "label": "What patterns do you notice?", "placeholder": "Mood-sleep connections? Event-mood triggers? Stability vs instability periods?" }] }] }$schema$::jsonb,
  true, false, ARRAY['bipolar', 'mood diary', 'CBT', 'mood monitoring', 'sleep', 'euthymia', 'mania', 'depression'], 5, 3, true, 1
);

-- Bi5: Social Rhythm / Routine Monitoring
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'bipolar-disorder'), 'Social Rhythm & Routine Monitoring', 'social-rhythm-routine-monitoring',
  'Track daily routine stability — wake time, meals, activity, social contact, and bedtime — as routine disruption is a key trigger for mood episodes.',
  'Routine stability is protective in bipolar disorder. Track your key daily anchors: wake time, meals, activity, social contact, and bedtime. Rate how consistent your routine was each day. Disruptions to social rhythms can trigger episodes.',
  $schema${ "version": 1, "sections": [{ "id": "routine", "title": "Daily Routine Log", "fields": [{ "id": "routine-table", "type": "table", "label": "Track daily routine anchors", "columns": [{ "id": "date", "header": "Date", "type": "text", "width": "narrow" }, { "id": "wake", "header": "Wake Time", "type": "text", "width": "narrow" }, { "id": "meals", "header": "Meals Regular?", "type": "text", "width": "narrow" }, { "id": "activity", "header": "Main Activity", "type": "textarea" }, { "id": "social", "header": "Social Contact", "type": "textarea" }, { "id": "bed", "header": "Bed Time", "type": "text", "width": "narrow" }, { "id": "regularity", "header": "Routine (0–10)", "type": "number", "min": 0, "max": 10 }], "min_rows": 7, "max_rows": 14 }] }, { "id": "reflection", "title": "Reflection", "fields": [{ "id": "disruptions", "type": "textarea", "label": "What disrupted your routine this week?", "placeholder": "What threw off your schedule? How did it affect your mood?" }] }] }$schema$::jsonb,
  true, false, ARRAY['bipolar', 'social rhythm', 'routine', 'IPSRT', 'CBT', 'circadian', 'sleep-wake cycle'], 5, 4, true, 1
);


-- ============================================================================
-- 16. PERSONALITY & SCHEMA (PD4, PD5, PD7, PD8, PD9)
-- ============================================================================

-- PD4: Schema Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'), 'Schema Diary', 'schema-diary',
  'Track schema activations — when old patterns get triggered, what mode you went into, and what you could do differently.',
  'Notice when a schema is activated: what triggered it, what you felt, which coping mode you went into, and what the consequences were. Then consider what a healthier response would have been.',
  $schema${ "version": 1, "sections": [{ "id": "diary", "title": "Schema Activation Log", "fields": [{ "id": "schema-record", "type": "record", "label": "Schema Activation", "min_records": 1, "max_records": 10, "groups": [{ "id": "trigger", "header": "Trigger", "width": "normal", "fields": [{ "id": "date", "type": "text", "placeholder": "Date" }, { "id": "situation", "type": "textarea", "placeholder": "What happened?" }] }, { "id": "schema", "header": "Schema Activated", "width": "normal", "fields": [{ "id": "which-schema", "type": "textarea", "placeholder": "Which schema was triggered? e.g. Abandonment, Defectiveness, Failure" }, { "id": "emotion", "type": "text", "placeholder": "Primary emotion" }] }, { "id": "mode", "header": "Coping Mode", "width": "normal", "fields": [{ "id": "mode", "type": "textarea", "placeholder": "What did you do? e.g. Surrendered, avoided, overcompensated" }, { "id": "consequence", "type": "textarea", "placeholder": "What was the consequence?" }] }, { "id": "alternative", "header": "Healthy Alternative", "width": "normal", "fields": [{ "id": "alternative", "type": "textarea", "placeholder": "What could you do differently next time?" }] }] }] }] }$schema$::jsonb,
  true, false, ARRAY['schema', 'diary', 'CBT', 'personality', 'schema activation', 'coping modes'], 10, 4, true, 1
);

-- PD5: Historical Evidence Review
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'), 'Historical Evidence Review', 'historical-evidence-review',
  'Review evidence for and against a core belief across different life periods — childhood, adolescence, and adulthood.',
  'Core beliefs feel true partly because we selectively attend to confirming evidence and discount disconfirming evidence across our whole lives. This worksheet helps you systematically review each life period for evidence both for AND against the belief.',
  $schema${ "version": 1, "sections": [{ "id": "belief", "title": "Core Belief", "fields": [{ "id": "belief", "type": "textarea", "label": "Core belief to examine:", "placeholder": "e.g. I'm unlovable", "required": true }, { "id": "conviction", "type": "likert", "label": "Current conviction (0–100%)", "min": 0, "max": 100, "step": 5 }] }, { "id": "review", "title": "Evidence by Life Period", "fields": [{ "id": "evidence-table", "type": "table", "label": "Evidence for and against across your life", "columns": [{ "id": "period", "header": "Life Period", "type": "text" }, { "id": "evidence-for", "header": "Evidence FOR the Belief", "type": "textarea" }, { "id": "evidence-against", "header": "Evidence AGAINST the Belief", "type": "textarea" }, { "id": "reinterpretation", "header": "Could the 'For' Evidence Be Seen Differently?", "type": "textarea" }], "min_rows": 3, "max_rows": 6 }] }, { "id": "reflection", "title": "Revised View", "fields": [{ "id": "revised-conviction", "type": "likert", "label": "Conviction in core belief now (0–100%)", "min": 0, "max": 100, "step": 5 }, { "id": "learning", "type": "textarea", "label": "What does the full historical picture suggest?", "placeholder": "Is the belief as absolute as it felt?" }] }] }$schema$::jsonb,
  true, false, ARRAY['schema', 'historical evidence', 'core beliefs', 'CBT', 'personality', 'life review'], 20, 5, true, 1
);

-- PD7: Chain Analysis Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'), 'Chain Analysis Worksheet', 'chain-analysis-worksheet',
  'Trace a problem behaviour back through the chain of vulnerability factors, events, thoughts, emotions, and actions that led to it — then identify intervention points.',
  'Chain analysis maps the full sequence from vulnerability factors through to the problem behaviour and its consequences. Once the chain is visible, you can identify links where a different response could break the chain next time.',
  $schema${ "version": 1, "sections": [{ "id": "chain", "title": "The Chain", "fields": [{ "id": "target-behaviour", "type": "textarea", "label": "Problem behaviour:", "placeholder": "e.g. Self-harm, binge, angry outburst", "required": true }, { "id": "vulnerability", "type": "textarea", "label": "Vulnerability factors:", "placeholder": "e.g. Poor sleep, skipped meals, conflict earlier, emotional exhaustion" }, { "id": "prompting-event", "type": "textarea", "label": "Prompting event:", "placeholder": "What set the chain in motion?" }, { "id": "links", "type": "textarea", "label": "Chain of thoughts, emotions, and body sensations:", "placeholder": "Step by step — what thought led to what feeling led to what action?" }, { "id": "behaviour", "type": "textarea", "label": "The problem behaviour:", "placeholder": "What exactly did you do?" }, { "id": "consequences", "type": "textarea", "label": "Consequences:", "placeholder": "Short-term and long-term consequences" }] }, { "id": "intervention", "title": "Breaking the Chain", "fields": [{ "id": "links-to-break", "type": "textarea", "label": "Which links could you break next time?", "placeholder": "Where in the chain could a different response change the outcome?" }, { "id": "skills", "type": "textarea", "label": "What skills could you use at those points?", "placeholder": "e.g. Distress tolerance, opposite action, interpersonal effectiveness, mindfulness" }] }] }$schema$::jsonb,
  true, false, ARRAY['chain analysis', 'DBT', 'personality', 'self-harm', 'functional analysis', 'CBT'], 20, 6, true, 1
);

-- PD8: Schema Maintenance Cost-Benefit
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'), 'Schema Coping Cost-Benefit', 'schema-coping-cost-benefit',
  'Weigh up the costs and benefits of maintaining a schema-driven coping pattern vs changing it.',
  'Schema-driven coping (avoidance, surrender, overcompensation) served a purpose once. But does it still? This worksheet helps you weigh up what the pattern gives you vs what it costs you, and whether changing is worth the discomfort.',
  $schema${ "version": 1, "sections": [{ "id": "pattern", "title": "The Pattern", "fields": [{ "id": "schema", "type": "textarea", "label": "Which schema and coping pattern are you analysing?", "placeholder": "e.g. Abandonment schema → clinginess / avoiding closeness", "required": true }] }, { "id": "analysis", "title": "Cost-Benefit Analysis", "layout": "four_quadrant", "fields": [{ "id": "benefits-keeping", "type": "textarea", "label": "Benefits of Keeping the Pattern", "placeholder": "What does it protect you from? What familiar comfort does it provide?", "domain": "thoughts" }, { "id": "costs-keeping", "type": "textarea", "label": "Costs of Keeping the Pattern", "placeholder": "What does it cost you in relationships, wellbeing, opportunities?", "domain": "emotions" }, { "id": "benefits-changing", "type": "textarea", "label": "Benefits of Changing", "placeholder": "What could you gain?", "domain": "thoughts" }, { "id": "costs-changing", "type": "textarea", "label": "Costs of Changing", "placeholder": "What discomfort or risk would you face?", "domain": "emotions" }] }, { "id": "decision", "title": "Decision", "fields": [{ "id": "verdict", "type": "textarea", "label": "On balance, is the pattern worth maintaining?", "placeholder": "What does the full picture suggest?" }] }] }$schema$::jsonb,
  true, false, ARRAY['schema', 'cost-benefit', 'coping patterns', 'CBT', 'personality', 'motivation'], 15, 7, true, 1
);

-- PD9: Interpersonal Pattern Worksheet
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order, is_curated, schema_version) VALUES (
  (SELECT id FROM categories WHERE slug = 'personality-schema-work'), 'Interpersonal Pattern Worksheet', 'interpersonal-pattern-worksheet',
  'Identify recurring patterns across relationships — mapping what triggers the pattern, what you expect, what you do, and the outcome.',
  'Many relational difficulties follow a predictable pattern driven by schemas. This worksheet helps you map a specific pattern across multiple relationships to see the common thread, making it easier to recognise and interrupt in real time.',
  $schema${ "version": 1, "sections": [{ "id": "pattern", "title": "The Pattern", "fields": [{ "id": "description", "type": "textarea", "label": "Describe the recurring relational pattern:", "placeholder": "e.g. I get close to someone, then push them away before they can reject me", "required": true }] }, { "id": "examples", "title": "Examples Across Relationships", "fields": [{ "id": "examples-table", "type": "table", "label": "How does this pattern play out?", "columns": [{ "id": "relationship", "header": "Relationship / Person", "type": "text" }, { "id": "trigger", "header": "What Triggers It", "type": "textarea" }, { "id": "expectation", "header": "What I Expect Will Happen", "type": "textarea" }, { "id": "my-response", "header": "What I Do", "type": "textarea" }, { "id": "outcome", "header": "Outcome", "type": "textarea" }], "min_rows": 3, "max_rows": 6 }] }, { "id": "reflection", "title": "Breaking the Pattern", "fields": [{ "id": "common-thread", "type": "textarea", "label": "What is the common thread?", "placeholder": "What schema drives this?" }, { "id": "alternative", "type": "textarea", "label": "What would a different response look like?", "placeholder": "What could you do at the trigger point instead?" }] }] }$schema$::jsonb,
  true, false, ARRAY['interpersonal', 'relational patterns', 'schema', 'CBT', 'personality', 'relationships'], 20, 8, true, 1
);


-- ============================================================================
-- DONE.
-- ============================================================================
-- Expected: 47 new rows inserted
-- 9 worksheets eliminated through consolidation
-- New categories: BDD, Chronic Pain, Psychosis (CBTp)
-- No overwrites in this batch — all new slugs

COMMIT;
