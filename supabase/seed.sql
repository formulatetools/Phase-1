-- Formulate: Seed Data
-- 9 categories + 3 example worksheets with full JSONB schemas

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO categories (name, slug, description, icon, display_order) VALUES
  ('Depression', 'depression', 'Evidence-based tools for working with low mood, hopelessness, withdrawal, and depressive thinking patterns.', 'cloud-rain', 1),
  ('Generalised Anxiety (GAD)', 'generalised-anxiety-gad', 'Worksheets targeting chronic worry, intolerance of uncertainty, and generalised anxiety.', 'alert-circle', 2),
  ('Obsessive-Compulsive Disorder (OCD)', 'obsessive-compulsive-disorder-ocd', 'Tools for understanding and treating obsessional thinking and compulsive behaviours via ERP and cognitive approaches.', 'refresh-cw', 3),
  ('Social Anxiety', 'social-anxiety', 'Interventions for fear of negative evaluation, safety behaviours, and self-focused attention in social situations.', 'users', 4),
  ('Health Anxiety', 'health-anxiety', 'Clinical tools for addressing illness worry, body vigilance, reassurance seeking, and catastrophic health cognitions.', 'activity', 5),
  ('Panic Disorder', 'panic-disorder', 'Worksheets for panic cycles, interoceptive exposure, safety behaviour reduction, and catastrophic misinterpretation.', 'zap', 6),
  ('PTSD / Trauma', 'ptsd-trauma', 'Tools for trauma processing, narrative construction, trigger management, and safety planning.', 'shield', 7),
  ('Low Self-Esteem', 'low-self-esteem', 'Interventions for core beliefs, self-critical thinking, and building a more balanced self-view.', 'message-circle', 8),
  ('General CBT Skills', 'general-cbt-skills', 'Foundational cognitive and behavioural tools applicable across presentations.', 'brain', 9);

-- ============================================================================
-- EXAMPLE WORKSHEETS
-- ============================================================================

-- 1. 5-Column Thought Record (General CBT Skills)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order
) VALUES (
  (SELECT id FROM categories WHERE slug = 'general-cbt-skills'),
  '5-Column Thought Record',
  '5-column-thought-record',
  'The classic cognitive restructuring tool. Identify automatic thoughts, evaluate the evidence, and develop more balanced alternatives.',
  'Use this worksheet when you notice a shift in your mood. Work through each column from left to right. Start by describing the situation, then identify the emotion and the automatic thought. Consider the evidence for and against the thought, then write a more balanced perspective.',
  '{
    "version": 1,
    "sections": [
      {
        "id": "context",
        "title": "Situation & Emotion",
        "description": "Describe what was happening when you noticed the mood shift",
        "fields": [
          {
            "id": "situation",
            "type": "textarea",
            "label": "Situation",
            "placeholder": "What were you doing? Where were you? Who were you with?",
            "required": true
          },
          {
            "id": "emotion",
            "type": "text",
            "label": "Emotion",
            "placeholder": "e.g. Anxious, Sad, Angry, Guilty",
            "required": true
          },
          {
            "id": "emotion_intensity",
            "type": "likert",
            "label": "Emotion intensity (0–100)",
            "min": 0,
            "max": 100,
            "step": 5,
            "anchors": {"0": "None", "50": "Moderate", "100": "Extreme"}
          }
        ]
      },
      {
        "id": "thought-record",
        "title": "Thought Record",
        "description": "Identify the automatic thought, evaluate the evidence, and develop a balanced alternative",
        "fields": [
          {
            "id": "thought_table",
            "type": "table",
            "label": "Thought Record",
            "columns": [
              {"id": "thought", "header": "Automatic Thought", "type": "textarea"},
              {"id": "belief_rating", "header": "Belief (%)", "type": "number", "min": 0, "max": 100},
              {"id": "evidence_for", "header": "Evidence For", "type": "textarea"},
              {"id": "evidence_against", "header": "Evidence Against", "type": "textarea"},
              {"id": "balanced_thought", "header": "Balanced Thought", "type": "textarea"},
              {"id": "new_rating", "header": "New Rating (%)", "type": "number", "min": 0, "max": 100}
            ],
            "min_rows": 1,
            "max_rows": 5
          }
        ]
      },
      {
        "id": "outcome",
        "title": "Outcome",
        "fields": [
          {
            "id": "emotion_after",
            "type": "likert",
            "label": "Emotion intensity after completing the record (0–100)",
            "min": 0,
            "max": 100,
            "step": 5,
            "anchors": {"0": "None", "50": "Moderate", "100": "Extreme"}
          },
          {
            "id": "reflection",
            "type": "textarea",
            "label": "What did you learn from this exercise?",
            "placeholder": "Any observations about your thinking patterns..."
          }
        ]
      }
    ]
  }',
  true, true,
  ARRAY['cognitive restructuring', 'thought records', 'CBT', 'automatic thoughts'],
  15, 1
);

-- 2. Behavioural Activation Activity Schedule (Depression)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order
) VALUES (
  (SELECT id FROM categories WHERE slug = 'depression'),
  'Behavioural Activation Activity Schedule',
  'behavioural-activation-schedule',
  'A structured weekly planner for scheduling activities that provide pleasure and mastery, combating the withdrawal cycle in depression.',
  'Plan activities for each day of the week. After completing each activity, rate your sense of Pleasure (P) from 0–10 and Mastery (M) from 0–10. The goal is to gradually increase the number and variety of activities, paying attention to what gives you a sense of achievement or enjoyment.',
  '{
    "version": 1,
    "sections": [
      {
        "id": "schedule",
        "title": "Weekly Activity Schedule",
        "description": "Plan and rate activities for each day. P = Pleasure (0–10), M = Mastery (0–10)",
        "fields": [
          {
            "id": "activities",
            "type": "table",
            "label": "Activity Schedule",
            "columns": [
              {"id": "day", "header": "Day", "type": "text"},
              {"id": "time", "header": "Time", "type": "text"},
              {"id": "planned_activity", "header": "Planned Activity", "type": "textarea"},
              {"id": "actual_activity", "header": "Actual Activity", "type": "textarea"},
              {"id": "pleasure", "header": "P (0–10)", "type": "number", "min": 0, "max": 10},
              {"id": "mastery", "header": "M (0–10)", "type": "number", "min": 0, "max": 10}
            ],
            "min_rows": 7,
            "max_rows": 21
          }
        ]
      },
      {
        "id": "review",
        "title": "Weekly Review",
        "fields": [
          {
            "id": "highest_pleasure",
            "type": "textarea",
            "label": "Which activities gave you the most pleasure this week?"
          },
          {
            "id": "highest_mastery",
            "type": "textarea",
            "label": "Which activities gave you the greatest sense of mastery?"
          },
          {
            "id": "mood_change",
            "type": "likert",
            "label": "Overall mood this week (0–10)",
            "min": 0,
            "max": 10,
            "step": 1,
            "anchors": {"0": "Very low", "5": "Moderate", "10": "Very good"}
          },
          {
            "id": "next_week",
            "type": "textarea",
            "label": "What activities will you prioritise next week?"
          }
        ]
      }
    ]
  }',
  true, true,
  ARRAY['behavioural activation', 'depression', 'activity scheduling', 'pleasure', 'mastery'],
  20, 1
);

-- 3. ERP Hierarchy Builder (OCD)
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order
) VALUES (
  (SELECT id FROM categories WHERE slug = 'obsessive-compulsive-disorder-ocd'),
  'ERP Hierarchy Builder',
  'erp-hierarchy-builder',
  'Build a graded exposure hierarchy for Exposure and Response Prevention therapy. List anxiety-provoking situations, rate them, and plan structured exposures.',
  'List situations related to your OCD that cause anxiety. Rate each with a SUDS score (Subjective Units of Distress, 0–100). Arrange from least to most distressing. Plan specific exposure tasks for each level, starting with lower SUDS items and progressing upward.',
  '{
    "version": 1,
    "sections": [
      {
        "id": "obsession",
        "title": "Target Obsession",
        "description": "Describe the obsessional theme you are working on",
        "fields": [
          {
            "id": "obsession_description",
            "type": "textarea",
            "label": "Describe the obsession or feared outcome",
            "placeholder": "e.g. Fear of contamination from public surfaces",
            "required": true
          },
          {
            "id": "compulsions",
            "type": "textarea",
            "label": "What compulsions or avoidance do you currently use?",
            "placeholder": "e.g. Handwashing, avoiding door handles, using sleeves to touch things"
          }
        ]
      },
      {
        "id": "hierarchy",
        "title": "Exposure Hierarchy",
        "description": "List situations from least to most anxiety-provoking",
        "fields": [
          {
            "id": "hierarchy_table",
            "type": "table",
            "label": "Hierarchy Items",
            "columns": [
              {"id": "situation", "header": "Situation / Trigger", "type": "textarea"},
              {"id": "suds_predicted", "header": "Predicted SUDS (0–100)", "type": "number", "min": 0, "max": 100},
              {"id": "exposure_plan", "header": "Planned Exposure", "type": "textarea"},
              {"id": "suds_actual", "header": "Actual SUDS (0–100)", "type": "number", "min": 0, "max": 100},
              {"id": "notes", "header": "Notes / What happened", "type": "textarea"}
            ],
            "min_rows": 5,
            "max_rows": 15
          }
        ]
      },
      {
        "id": "response-prevention",
        "title": "Response Prevention Plan",
        "fields": [
          {
            "id": "rp_plan",
            "type": "textarea",
            "label": "What compulsions will you resist during exposures?",
            "placeholder": "Be specific about which rituals you will delay or prevent"
          },
          {
            "id": "coping_strategies",
            "type": "checklist",
            "label": "Coping strategies to use during exposures",
            "options": [
              {"id": "mindfulness", "label": "Mindful awareness of anxiety (observe without reacting)"},
              {"id": "acceptance", "label": "Accept uncertainty (\"I can tolerate not knowing\")"},
              {"id": "surfing", "label": "Urge surfing (ride the wave of discomfort)"},
              {"id": "values", "label": "Connect to values (why am I doing this?)"},
              {"id": "self_compassion", "label": "Self-compassion (this is hard and I am brave)"}
            ]
          }
        ]
      }
    ]
  }',
  true, true,
  ARRAY['ERP', 'exposure', 'OCD', 'hierarchy', 'response prevention', 'SUDS'],
  25, 1
);
