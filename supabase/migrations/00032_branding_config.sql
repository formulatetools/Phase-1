-- Admin-configurable PDF branding settings
-- Single global row; admin can tweak watermark style/opacity in real-time via the Tools tab

CREATE TABLE branding_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  free_style TEXT NOT NULL DEFAULT 'footer',          -- 'diagonal' | 'footer'
  free_text TEXT NOT NULL DEFAULT 'Created with Formulate',
  free_opacity INTEGER NOT NULL DEFAULT 50,           -- 0-100
  free_font_size INTEGER NOT NULL DEFAULT 48,         -- pt (used for diagonal watermark)
  free_show_logo BOOLEAN NOT NULL DEFAULT true,
  free_logo_opacity INTEGER NOT NULL DEFAULT 50,      -- 0-100
  paid_show_logo BOOLEAN NOT NULL DEFAULT true,
  paid_logo_opacity INTEGER NOT NULL DEFAULT 30,      -- 0-100
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single global row
INSERT INTO branding_config (id) VALUES ('global');

-- RLS: admin users can read/write; service role bypasses for server-side reads
ALTER TABLE branding_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage branding config"
  ON branding_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
