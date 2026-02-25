-- ============================================================================
-- 00018: Blog System
-- Adds blog_posts, blog_reactions tables and blog digest opt-in on profiles.
-- ============================================================================

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  cover_image_url TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('clinical', 'worksheet-guide', 'practice', 'updates')),
  tags TEXT[] DEFAULT '{}',
  related_worksheet_ids UUID[] DEFAULT '{}',
  reading_time_minutes INT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'published', 'rejected')),
  admin_feedback TEXT,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),
  helpful_count INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_blog_posts_status ON blog_posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_category ON blog_posts(category) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug) WHERE status = 'published' AND deleted_at IS NULL;

-- GIN index for reverse worksheet lookups (find blog posts for a given worksheet)
CREATE INDEX idx_blog_posts_related_worksheets ON blog_posts USING GIN (related_worksheet_ids) WHERE status = 'published' AND deleted_at IS NULL;

-- Blog reactions (one per user per post — "helpful" button)
CREATE TABLE blog_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_blog_reactions_post ON blog_reactions(post_id);
CREATE INDEX idx_blog_reactions_user ON blog_reactions(user_id);

-- Blog digest preference on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_digest_opt_in BOOLEAN NOT NULL DEFAULT false;

-- ── RLS Policies ──────────────────────────────────────────────────────────

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_reactions ENABLE ROW LEVEL SECURITY;

-- Published blog posts are publicly readable (including anon for SEO)
CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Authors can see their own posts (any status)
CREATE POLICY blog_posts_author_read ON blog_posts
  FOR SELECT USING (auth.uid() = author_id AND deleted_at IS NULL);

-- Authors can insert their own drafts
CREATE POLICY blog_posts_author_insert ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Authors can update their own non-published posts
CREATE POLICY blog_posts_author_update ON blog_posts
  FOR UPDATE USING (auth.uid() = author_id AND status NOT IN ('published'))
  WITH CHECK (auth.uid() = author_id);

-- Reactions: authenticated users can insert their own
CREATE POLICY blog_reactions_insert ON blog_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reactions: users can delete their own
CREATE POLICY blog_reactions_delete ON blog_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions: all can read (to show counts / check own reaction)
CREATE POLICY blog_reactions_read ON blog_reactions
  FOR SELECT USING (true);
