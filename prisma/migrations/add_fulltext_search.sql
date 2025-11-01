-- Story 5.10: Platform-Wide Search - PostgreSQL Full-Text Search Setup
-- This migration adds tsvector columns and triggers for full-text search
-- across Scholarship, Application, Essay, and Document models

-- ============================================================================
-- Add tsvector columns for full-text search
-- ============================================================================

-- Scholarship: Search on name, provider, description, tags
ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Application: Search on scholarship name, status, notes
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Essay: Search on title, content, associated scholarship
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Document: Search on name, type, description
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- Create GIN indexes for fast full-text search
-- ============================================================================

CREATE INDEX IF NOT EXISTS scholarship_search_idx ON "Scholarship" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS application_search_idx ON "Application" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS essay_search_idx ON "Essay" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS document_search_idx ON "Document" USING GIN (search_vector);

-- ============================================================================
-- Create trigger functions to auto-update search_vector
-- ============================================================================

-- Scholarship search vector update function
CREATE OR REPLACE FUNCTION scholarship_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.provider, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Application search vector update function
-- Note: This will need to join with Scholarship to get the scholarship name
-- For now, we'll create a simpler version that can be updated
CREATE OR REPLACE FUNCTION application_search_vector_update() RETURNS trigger AS $$
DECLARE
  scholarship_name text;
BEGIN
  -- Get scholarship name from related scholarship
  SELECT name INTO scholarship_name FROM "Scholarship" WHERE id = NEW."scholarshipId";

  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(scholarship_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.status::text, '')), 'B');

  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Essay search vector update function
CREATE OR REPLACE FUNCTION essay_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Document search vector update function
CREATE OR REPLACE FUNCTION document_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.type::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create triggers to auto-update search_vector on INSERT/UPDATE
-- ============================================================================

DROP TRIGGER IF EXISTS scholarship_search_update ON "Scholarship";
CREATE TRIGGER scholarship_search_update
  BEFORE INSERT OR UPDATE ON "Scholarship"
  FOR EACH ROW
  EXECUTE FUNCTION scholarship_search_vector_update();

DROP TRIGGER IF EXISTS application_search_update ON "Application";
CREATE TRIGGER application_search_update
  BEFORE INSERT OR UPDATE ON "Application"
  FOR EACH ROW
  EXECUTE FUNCTION application_search_vector_update();

DROP TRIGGER IF EXISTS essay_search_update ON "Essay";
CREATE TRIGGER essay_search_update
  BEFORE INSERT OR UPDATE ON "Essay"
  FOR EACH ROW
  EXECUTE FUNCTION essay_search_vector_update();

DROP TRIGGER IF EXISTS document_search_update ON "Document";
CREATE TRIGGER document_search_update
  BEFORE INSERT OR UPDATE ON "Document"
  FOR EACH ROW
  EXECUTE FUNCTION document_search_vector_update();

-- ============================================================================
-- Update existing records with search vectors
-- ============================================================================

-- Update existing Scholarship records
UPDATE "Scholarship" SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(provider, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'D');

-- Update existing Application records
UPDATE "Application" AS a SET search_vector =
  setweight(to_tsvector('english', coalesce(s.name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(a.status::text, '')), 'B')
FROM "Scholarship" s
WHERE a."scholarshipId" = s.id;

-- Update existing Essay records
UPDATE "Essay" SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'C');

-- Update existing Document records
UPDATE "Document" SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(type::text, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C');

-- ============================================================================
-- Verification queries (uncomment to test)
-- ============================================================================

-- SELECT COUNT(*) AS scholarship_count FROM "Scholarship" WHERE search_vector IS NOT NULL;
-- SELECT COUNT(*) AS application_count FROM "Application" WHERE search_vector IS NOT NULL;
-- SELECT COUNT(*) AS essay_count FROM "Essay" WHERE search_vector IS NOT NULL;
-- SELECT COUNT(*) AS document_count FROM "Document" WHERE search_vector IS NOT NULL;
