-- Homework Plans: add is_example flag + seed Depression Starter Pack
-- for every therapist (existing + new).

-- 1. Add is_example column
ALTER TABLE workspace_templates
  ADD COLUMN is_example BOOLEAN NOT NULL DEFAULT false;

-- 2. Reusable function to seed the example template for one therapist
CREATE OR REPLACE FUNCTION seed_example_template(p_therapist_id UUID)
RETURNS VOID AS $$
DECLARE
  v_ws1 UUID; -- Activity & Mood Diary with Mastery/Pleasure
  v_ws2 UUID; -- Pleasure Predicting Experiment
  v_ws3 UUID; -- Compassionate Letter to Self
BEGIN
  -- Look up curated worksheet IDs by slug (safe across environments)
  SELECT id INTO v_ws1 FROM worksheets
    WHERE slug = 'behavioural-activation-schedule' AND is_curated = true LIMIT 1;
  SELECT id INTO v_ws2 FROM worksheets
    WHERE slug = 'pleasure-predicting-experiment' AND is_curated = true LIMIT 1;
  SELECT id INTO v_ws3 FROM worksheets
    WHERE slug = 'compassionate-letter-to-self' AND is_curated = true LIMIT 1;

  -- Only seed if this therapist doesn't already have an example
  IF NOT EXISTS (
    SELECT 1 FROM workspace_templates
    WHERE therapist_id = p_therapist_id AND is_example = true AND deleted_at IS NULL
  ) THEN
    INSERT INTO workspace_templates (
      therapist_id, name, description,
      assignment_specs, resource_specs,
      default_expires_in_days, is_example
    ) VALUES (
      p_therapist_id,
      'Depression Starter Pack',
      'A ready-made homework bundle for clients experiencing low mood. Includes core CBT worksheets and two psychoeducation videos.',
      jsonb_build_array(
        jsonb_build_object('worksheet_id', v_ws1, 'expires_in_days', 7),
        jsonb_build_object('worksheet_id', v_ws2, 'expires_in_days', 7),
        jsonb_build_object('worksheet_id', v_ws3, 'expires_in_days', 7)
      ),
      jsonb_build_array(
        jsonb_build_object(
          'title', 'I Had a Black Dog, His Name Was Depression (WHO)',
          'url',   'https://www.youtube.com/watch?v=XiCrniLQGYc',
          'note',  'A short animated video about understanding depression — good psychoeducation for early sessions.'
        ),
        jsonb_build_object(
          'title', 'Dropping Anchor – Russ Harris (ACT)',
          'url',   'https://www.youtube.com/watch?v=BnHBFfDq_MA',
          'note',  'A quick grounding exercise your client can use when feeling overwhelmed.'
        )
      ),
      7,
      true
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Seed for every existing therapist
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE role = 'therapist' LOOP
    PERFORM seed_example_template(r.id);
  END LOOP;
END $$;

-- 4. Update the profile-creation trigger so new users also get it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, subscription_status, subscription_tier,
    monthly_download_count, download_count_reset_at
  ) VALUES (
    NEW.id, NEW.email, 'therapist', 'free', 'free',
    0, now() + INTERVAL '1 month'
  );

  -- Seed example homework plan for new therapist
  PERFORM seed_example_template(NEW.id);

  RETURN NEW;
END;
$$;
