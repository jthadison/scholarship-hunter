-- Story 4.4: Update Recommendation model for letter coordination
-- This migration updates the Recommendation table with new fields

-- Rename columns
ALTER TABLE "Recommendation" RENAME COLUMN "name" TO "recommenderName";
ALTER TABLE "Recommendation" RENAME COLUMN "email" TO "recommenderEmail";

-- Add new columns
ALTER TABLE "Recommendation" ADD COLUMN "personalMessage" TEXT;
ALTER TABLE "Recommendation" ADD COLUMN "reminderCount" INTEGER NOT NULL DEFAULT 0;

-- Update default for requestedAt to ensure it's set
ALTER TABLE "Recommendation" ALTER COLUMN "requestedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Make documentId unique (if not already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Recommendation_documentId_key'
    ) THEN
        ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_documentId_key" UNIQUE ("documentId");
    END IF;
END $$;

-- Add index on recommenderEmail for faster queries
CREATE INDEX IF NOT EXISTS "Recommendation_recommenderEmail_idx" ON "Recommendation"("recommenderEmail");
