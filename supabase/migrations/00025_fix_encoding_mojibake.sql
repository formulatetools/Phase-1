-- ============================================================================
-- Migration 00025: Fix Mac Roman mojibake encoding
-- ============================================================================
-- When batch SQL 00021-00024 were pasted into the Supabase Dashboard,
-- UTF-8 bytes were interpreted as Mac Roman, producing mojibake.
--
-- This script uses CHR() for ALL non-ASCII characters so it is safe to
-- paste through any encoding pipeline.
--
-- Mojibake mappings (Mac Roman interpretation of UTF-8 bytes):
--   em dash  U+2014  3 bytes E2 80 94  ->  U+201A U+00C4 U+00EE
--   en dash  U+2013  3 bytes E2 80 93  ->  U+201A U+00C4 U+00EC
--   arrow    U+2192  3 bytes E2 86 92  ->  U+201A U+00DC U+00ED
--   division U+00F7  2 bytes C3 B7     ->  U+221A U+2211
--   multiply U+00D7  2 bytes C3 97     ->  U+221A U+00F3
--   gte      U+2265  3 bytes E2 89 A5  ->  U+201A U+00E2 U+2022
-- ============================================================================

BEGIN;

-- Build mojibake patterns and correct replacements via CHR()
-- em dash:   mojibake = CHR(8218)||CHR(196)||CHR(238)   correct = CHR(8212)
-- en dash:   mojibake = CHR(8218)||CHR(196)||CHR(236)   correct = CHR(8211)
-- arrow:     mojibake = CHR(8218)||CHR(220)||CHR(237)   correct = CHR(8594)
-- division:  mojibake = CHR(8730)||CHR(8721)            correct = CHR(247)
-- multiply:  mojibake = CHR(8730)||CHR(243)             correct = CHR(215)
-- gte:       mojibake = CHR(8218)||CHR(226)||CHR(8226)  correct = CHR(8805)

-- ── Fix description column ──────────────────────────────────────────────────
UPDATE worksheets SET description = REPLACE(description, CHR(8218)||CHR(196)||CHR(238), CHR(8212))   WHERE description LIKE '%' || CHR(8218)||CHR(196)||CHR(238) || '%';
UPDATE worksheets SET description = REPLACE(description, CHR(8218)||CHR(196)||CHR(236), CHR(8211))   WHERE description LIKE '%' || CHR(8218)||CHR(196)||CHR(236) || '%';
UPDATE worksheets SET description = REPLACE(description, CHR(8218)||CHR(220)||CHR(237), CHR(8594))   WHERE description LIKE '%' || CHR(8218)||CHR(220)||CHR(237) || '%';
UPDATE worksheets SET description = REPLACE(description, CHR(8730)||CHR(8721),         CHR(247))    WHERE description LIKE '%' || CHR(8730)||CHR(8721) || '%';
UPDATE worksheets SET description = REPLACE(description, CHR(8730)||CHR(243),          CHR(215))    WHERE description LIKE '%' || CHR(8730)||CHR(243) || '%';
UPDATE worksheets SET description = REPLACE(description, CHR(8218)||CHR(226)||CHR(8226), CHR(8805)) WHERE description LIKE '%' || CHR(8218)||CHR(226)||CHR(8226) || '%';

-- ── Fix instructions column ─────────────────────────────────────────────────
UPDATE worksheets SET instructions = REPLACE(instructions, CHR(8218)||CHR(196)||CHR(238), CHR(8212))   WHERE instructions LIKE '%' || CHR(8218)||CHR(196)||CHR(238) || '%';
UPDATE worksheets SET instructions = REPLACE(instructions, CHR(8218)||CHR(196)||CHR(236), CHR(8211))   WHERE instructions LIKE '%' || CHR(8218)||CHR(196)||CHR(236) || '%';
UPDATE worksheets SET instructions = REPLACE(instructions, CHR(8218)||CHR(220)||CHR(237), CHR(8594))   WHERE instructions LIKE '%' || CHR(8218)||CHR(220)||CHR(237) || '%';
UPDATE worksheets SET instructions = REPLACE(instructions, CHR(8730)||CHR(8721),         CHR(247))    WHERE instructions LIKE '%' || CHR(8730)||CHR(8721) || '%';
UPDATE worksheets SET instructions = REPLACE(instructions, CHR(8730)||CHR(243),          CHR(215))    WHERE instructions LIKE '%' || CHR(8730)||CHR(243) || '%';
UPDATE worksheets SET instructions = REPLACE(instructions, CHR(8218)||CHR(226)||CHR(8226), CHR(8805)) WHERE instructions LIKE '%' || CHR(8218)||CHR(226)||CHR(8226) || '%';

-- ── Fix title column ────────────────────────────────────────────────────────
UPDATE worksheets SET title = REPLACE(title, CHR(8218)||CHR(196)||CHR(238), CHR(8212))   WHERE title LIKE '%' || CHR(8218)||CHR(196)||CHR(238) || '%';
UPDATE worksheets SET title = REPLACE(title, CHR(8218)||CHR(196)||CHR(236), CHR(8211))   WHERE title LIKE '%' || CHR(8218)||CHR(196)||CHR(236) || '%';

-- ── Fix schema JSONB (cast to text, replace, cast back) ─────────────────────
UPDATE worksheets SET schema = REPLACE(schema::text, CHR(8218)||CHR(196)||CHR(238), CHR(8212))::jsonb   WHERE schema::text LIKE '%' || CHR(8218)||CHR(196)||CHR(238) || '%';
UPDATE worksheets SET schema = REPLACE(schema::text, CHR(8218)||CHR(196)||CHR(236), CHR(8211))::jsonb   WHERE schema::text LIKE '%' || CHR(8218)||CHR(196)||CHR(236) || '%';
UPDATE worksheets SET schema = REPLACE(schema::text, CHR(8218)||CHR(220)||CHR(237), CHR(8594))::jsonb   WHERE schema::text LIKE '%' || CHR(8218)||CHR(220)||CHR(237) || '%';
UPDATE worksheets SET schema = REPLACE(schema::text, CHR(8730)||CHR(8721),         CHR(247))::jsonb    WHERE schema::text LIKE '%' || CHR(8730)||CHR(8721) || '%';
UPDATE worksheets SET schema = REPLACE(schema::text, CHR(8730)||CHR(243),          CHR(215))::jsonb    WHERE schema::text LIKE '%' || CHR(8730)||CHR(243) || '%';
UPDATE worksheets SET schema = REPLACE(schema::text, CHR(8218)||CHR(226)||CHR(8226), CHR(8805))::jsonb WHERE schema::text LIKE '%' || CHR(8218)||CHR(226)||CHR(8226) || '%';

COMMIT;
