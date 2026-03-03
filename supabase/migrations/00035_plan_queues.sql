-- Plan queues: drip-feed homework from a plan one item at a time
-- instead of applying everything at once.

-- 1. plan_queues table
CREATE TABLE plan_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id),
  therapist_id UUID NOT NULL REFERENCES profiles(id),
  template_id UUID REFERENCES workspace_templates(id),
  name TEXT NOT NULL,
  push_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (push_mode IN ('manual', 'time_based', 'completion_based', 'both')),
  auto_push_interval_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed')),
  last_pushed_at TIMESTAMPTZ,
  next_auto_push_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_plan_queues_relationship ON plan_queues(relationship_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_plan_queues_auto_push ON plan_queues(next_auto_push_at)
  WHERE status = 'active' AND next_auto_push_at IS NOT NULL AND deleted_at IS NULL;

-- 2. plan_queue_items table
CREATE TABLE plan_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES plan_queues(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('worksheet', 'resource')),
  worksheet_id UUID REFERENCES worksheets(id),
  expires_in_days INTEGER DEFAULT 7,
  resource_title TEXT,
  resource_url TEXT,
  resource_note TEXT,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'pushed', 'skipped')),
  pushed_at TIMESTAMPTZ,
  assignment_id UUID REFERENCES worksheet_assignments(id),
  shared_resource_id UUID REFERENCES shared_resources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_queue_items_queue ON plan_queue_items(queue_id, position);

-- 3. RLS policies
ALTER TABLE plan_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists manage own queues" ON plan_queues
  FOR ALL USING (therapist_id = auth.uid());

CREATE POLICY "Therapists manage own queue items" ON plan_queue_items
  FOR ALL USING (
    queue_id IN (SELECT id FROM plan_queues WHERE therapist_id = auth.uid())
  );
