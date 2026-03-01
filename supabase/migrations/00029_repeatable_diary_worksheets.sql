-- Enable multi-entry (diary) mode for worksheets that are naturally
-- filled in repeatedly over days, sessions, or episodes.
-- Sets schema.repeatable = true and schema.max_entries = 7 (one week's worth).
--
-- Criteria: diaries, logs, monitoring records, practice records, experiment records.
-- Excluded: formulations, safety plans, hierarchies, assessments, one-off exercises.

-- Helper: updates the JSONB schema to add repeatable + max_entries
-- Only touches rows where repeatable is not already set.

UPDATE worksheets
SET schema = schema || '{"repeatable": true, "max_entries": 7}'::jsonb
WHERE id IN (
  -- Thought Records
  '63c509a5-451c-463e-a2a1-e8c40b93aa30', -- 5-Column Thought Record
  'b3bd4bf7-b7c5-4811-b88e-06380e9d8fc2', -- 7-Column Thought Record

  -- Activity & Behavioural
  'e49843c8-46ce-4c69-9e4c-47bb48a5b177', -- Activity Monitoring Diary
  '0389b467-4c86-49a2-99be-ede051e6a29c', -- Behavioural Activation Schedule
  '146c5774-73bf-4bb5-bbcb-b22533cc1b62', -- Behavioural Experiment Worksheet

  -- Practice Logs
  '179b64a5-2ace-4924-85dc-f3d0bd9ce6a1', -- Applied Relaxation Practice Log
  'a4ea4fb4-dc1b-40e9-be29-ed488ae750a0', -- Attention Refocusing Experiment Log
  '75dee936-a235-4e40-9ef4-dd32e000c7ea', -- Attention Training Practice Log
  '12d77400-a2d8-42c0-9f4c-684db8b6dfa8', -- Coping Strategy Enhancement Log
  '5602fed8-ce99-42e4-bd7c-2550b46656ae', -- Detached Mindfulness Practice Log

  -- BDD
  '2849bc40-6f86-43c3-a957-e703dbbcb7fe', -- BDD Monitoring Diary
  '3cb79bf3-de4e-4493-9e19-fdafd5831633', -- Body Checking & Avoidance Diary
  'ac17a416-4628-4919-bae5-5a4566a56570', -- Body Image Diary

  -- Mood & Bipolar
  'c4cfe93b-4f01-4a0d-8d5f-58af23af5f06', -- Bipolar Mood Diary

  -- Eating
  '7aa90984-6e7b-4e79-bb4a-e49d1503828a', -- Food, Mood & Context Diary

  -- Health Anxiety
  '88770607-e323-4658-b757-4a965d5d0301', -- Health Anxiety Monitoring Diary
  'dadb125b-c5e7-49df-a7cb-183612e3c6b5', -- Health Checking Reduction Diary

  -- OCD / ERP
  '054525cd-543f-4306-9472-27a16c6be56d', -- OCD Monitoring Diary
  'f0fc0029-c5a2-4708-b5f4-aa08fc207c04', -- Mental Compulsion Monitoring Log
  '8642244a-119d-4137-b23d-a00fc4dbe2f4', -- ERP Practice Record
  '13af5a2c-f2b2-4fed-b3fb-7793a9e94ce9', -- Exposure Practice Record
  '798f8c39-d2b6-4cfe-a583-f164d3881bde', -- Interoceptive Exposure Record
  'd35f16f4-e2fe-4a03-84fe-b6410e4484bd', -- Reassurance-Seeking Reduction Log

  -- Pain
  'c1b17c53-c43f-4c88-8cd5-94715afad5e0', -- Pain Monitoring Diary

  -- Panic
  'd8498086-a6b6-4fc3-aae9-2f4586597105', -- Panic Diary

  -- PTSD
  '98d23814-da4e-4376-8811-1e104aa93b2e', -- PTSD Symptom Diary

  -- Positive / Self-Esteem
  '2b6495ea-93b9-403c-8273-89fb4975a12e', -- Positive Data Log
  'd4789902-7681-4d11-a801-ace498f33452', -- Strengths & Qualities Log

  -- Schema Therapy
  '561062cc-eddc-4cb9-a1b7-b2bfb2774f2f', -- Schema Diary

  -- Sleep
  '0720a764-da44-4fe3-891b-de5a98a56448', -- Sleep Diary
  '19e7d0a1-4a9a-45b2-92bc-2d2126a9c830', -- Sleep Diary (duplicate)
  '0294485e-8b4f-4c7f-935e-33898e04d9df', -- Sleep Efficiency Tracker

  -- Social
  '5aedf3d8-c9c8-4204-987d-59cb52078627', -- Social Rhythm & Routine Monitoring
  'e599f47e-7282-4fac-a096-9139d1dee59d', -- Social Situation Record
  '5be2b4b9-eaf7-449b-b830-1fbad786abbb', -- Post-Event Processing Log

  -- Experiments
  '4f31c95c-4ff6-41c5-9332-27e371f29f71', -- Pleasure Predicting Experiment

  -- Session Tracking
  'e669df1d-fdbd-48b8-be64-dea49319e8a6', -- Session Belief Ratings Tracker

  -- Weight Monitoring
  'f217c26e-f577-4193-8e79-9caf91467203', -- Weekly Weight Monitoring

  -- Worry
  'f9f2eeb7-a0f4-47c1-9c27-3c1a881febda'  -- Worry Diary with Postponement Log
)
AND (schema->>'repeatable' IS NULL OR schema->>'repeatable' = 'false');
