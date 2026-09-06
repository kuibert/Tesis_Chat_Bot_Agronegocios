ALTER TABLE "cultivos" DROP CONSTRAINT "uq_cultivos_nombre";--> statement-breakpoint
ALTER TABLE "cultivos" ADD CONSTRAINT "uq_cultivos_fuente_archivo" UNIQUE("fuente_archivo");