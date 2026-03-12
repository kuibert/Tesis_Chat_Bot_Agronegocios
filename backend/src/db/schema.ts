import { pgTable, serial, varchar, integer, decimal, timestamp, customType } from 'drizzle-orm/pg-core';

// Definición personalizada para pgvector usando tipado de Drizzle
const vector = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'vector(768)';
    },
    toDriver(value: string) {
        return value;
    },
});

export const fertilization_plans = pgTable('fertilization_plans', {
    id: serial('id').primaryKey(),
    cultivo: varchar('cultivo', { length: 100 }).notNull(),
    variedad: varchar('variedad', { length: 100 }),
    zona: varchar('zona', { length: 100 }).notNull(),
    dias_cosecha: integer('dias_cosecha'),
    formula_npk: varchar('formula_npk', { length: 100 }).notNull(),
    fuente_potasio: varchar('fuente_potasio', { length: 100 }),
    observaciones_tecnicas: varchar('observaciones_tecnicas'),

    // Nuevas columnas de fertilizantes (agregadas por el refactor)
    fosforo_nombre: varchar('fosforo_nombre', { length: 100 }),
    nitrogeno_nombre: varchar('nitrogeno_nombre', { length: 100 }),
    magnesio_nombre: varchar('magnesio_nombre', { length: 100 }),
    calcio_nombre: varchar('calcio_nombre', { length: 100 }),
    boro_nombre: varchar('boro_nombre', { length: 100 }),

    // Análisis de suelos
    suelo_p_ppm: decimal('suelo_p_ppm', { precision: 8, scale: 2 }),
    suelo_k_ppm: decimal('suelo_k_ppm', { precision: 8, scale: 2 }),
    suelo_mg_ppm: decimal('suelo_mg_ppm', { precision: 8, scale: 2 }),
    suelo_ca_ppm: decimal('suelo_ca_ppm', { precision: 8, scale: 2 }),
    suelo_estatus: varchar('suelo_estatus', { length: 50 }),

    // Datos semanales
    semana: integer('semana'),
    ddt_inicio: integer('ddt_inicio'),
    ddt_fin: integer('ddt_fin'),
    dosis_urea_lbs: decimal('dosis_urea_lbs', { precision: 10, scale: 4 }),
    dosis_fosforo_lbs: decimal('dosis_fosforo_lbs', { precision: 10, scale: 4 }),
    dosis_potasio_lbs: decimal('dosis_potasio_lbs', { precision: 10, scale: 4 }),
    dosis_magnesio_lbs: decimal('dosis_magnesio_lbs', { precision: 10, scale: 4 }),
    dosis_calcio_lbs: decimal('dosis_calcio_lbs', { precision: 10, scale: 4 }),
    dosis_boro_g: decimal('dosis_boro_g', { precision: 10, scale: 4 }),
    tipo_registro: varchar('tipo_registro', { length: 20 }),

    // Preventivos
    preventivo_insecticida: varchar('preventivo_insecticida', { length: 255 }),
    preventivo_fungicida: varchar('preventivo_fungicida', { length: 255 }),
    preventivo_nematicida: varchar('preventivo_nematicida', { length: 255 }),
    preventivo_activador: varchar('preventivo_activador', { length: 255 }),

    // Embedding vectorial (768D desde Xenova/distiluse)
    embedding: vector('embedding'),
    created_at: timestamp('created_at').defaultNow(),
});
