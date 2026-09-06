ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "content_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_documents_content_hash" ON "documents" ("content_hash") WHERE "content_hash" IS NOT NULL;
