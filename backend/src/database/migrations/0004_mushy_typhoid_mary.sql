ALTER TABLE "document_chunks" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "metadata" jsonb;