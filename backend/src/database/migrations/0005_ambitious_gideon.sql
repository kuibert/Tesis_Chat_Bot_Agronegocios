CREATE TABLE "controles_preventivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cultivo_id" uuid NOT NULL,
	"tipo_control" text NOT NULL,
	"producto" text NOT NULL,
	"precio" real,
	"dosis_por_hectarea" real,
	"unidades" text
);
--> statement-breakpoint
CREATE TABLE "cultivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"variedad" text,
	"tipo_riego" text DEFAULT 'no_especificado' NOT NULL,
	"ciclo_dias" integer,
	"es_perenne" integer DEFAULT 0,
	"fuente_archivo" text,
	"advertencias_ingesta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cultivos_nombre" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "fertilizantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"formula" text,
	"precio_referencia" real,
	"unidad" text NOT NULL,
	"n" real DEFAULT 0,
	"p2o5" real DEFAULT 0,
	"k2o" real DEFAULT 0,
	"mgo" real DEFAULT 0,
	"cao" real DEFAULT 0,
	"so3" real DEFAULT 0,
	"b" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fertilizantes_nombre" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "fuente_fertilizante_cultivo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cultivo_id" uuid NOT NULL,
	"elemento" text NOT NULL,
	"fertilizante_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requerimiento_elemental" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cultivo_id" uuid NOT NULL,
	"fase" text,
	"dia_despues_siembra" integer NOT NULL,
	"semana" integer,
	"n" real DEFAULT 0 NOT NULL,
	"p2o5" real DEFAULT 0 NOT NULL,
	"k2o" real DEFAULT 0 NOT NULL,
	"mgo" real DEFAULT 0,
	"ca" real DEFAULT 0,
	"b_gramos_ha" real DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "controles_preventivos" ADD CONSTRAINT "controles_preventivos_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuente_fertilizante_cultivo" ADD CONSTRAINT "fuente_fertilizante_cultivo_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuente_fertilizante_cultivo" ADD CONSTRAINT "fuente_fertilizante_cultivo_fertilizante_id_fertilizantes_id_fk" FOREIGN KEY ("fertilizante_id") REFERENCES "public"."fertilizantes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requerimiento_elemental" ADD CONSTRAINT "requerimiento_elemental_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_preventivos_cultivo" ON "controles_preventivos" USING btree ("cultivo_id");--> statement-breakpoint
CREATE INDEX "idx_cultivos_nombre" ON "cultivos" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "idx_fertilizantes_nombre" ON "fertilizantes" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "idx_fuente_cultivo_elemento" ON "fuente_fertilizante_cultivo" USING btree ("cultivo_id","elemento");--> statement-breakpoint
CREATE INDEX "idx_requerimiento_cultivo_dia" ON "requerimiento_elemental" USING btree ("cultivo_id","dia_despues_siembra");--> statement-breakpoint
CREATE INDEX "idx_document_chunks_frecuencia" ON "document_chunks" USING btree ((metadata->>'frecuencia_riego'));--> statement-breakpoint
CREATE INDEX "idx_document_chunks_cultivo" ON "document_chunks" USING btree ((metadata->>'cultivo'));