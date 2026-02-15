-- Tabla principal de planes de fertilización (Simplificada para búsqueda de texto)
CREATE TABLE IF NOT EXISTS fertilization_plans (
    id SERIAL PRIMARY KEY,
    cultivo VARCHAR(100) NOT NULL,
    variedad VARCHAR(100),
    zona VARCHAR(100) NOT NULL,
    dias_cosecha INTEGER,
    formula_npk VARCHAR(100) NOT NULL,
    fuente_potasio VARCHAR(100),
    observaciones_tecnicas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda de texto en cultivo y zona
CREATE INDEX IF NOT EXISTS idx_search_text ON fertilization_plans (cultivo, zona);
