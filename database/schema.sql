-- Habilitar extensión pgvector (requerida para columnas tipo vector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla principal de planes de fertilización
CREATE TABLE IF NOT EXISTS fertilization_plans (
    id SERIAL PRIMARY KEY,
    cultivo VARCHAR(100) NOT NULL,
    variedad VARCHAR(100),
    zona VARCHAR(100) NOT NULL,
    dias_cosecha INTEGER,
    formula_npk VARCHAR(100) NOT NULL,
    fuente_potasio VARCHAR(100),
    
    -- Preventivos
    preventivo_insecticida VARCHAR(100),
    preventivo_fungicida VARCHAR(100),
    preventivo_nematicida VARCHAR(100),
    preventivo_activador VARCHAR(100),
    
    observaciones_tecnicas TEXT,
    -- Embedding generado por DistilBERT (768 dimensiones — DistilBERT base hidden_size)
    embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda exacta de texto en cultivo y zona
CREATE INDEX IF NOT EXISTS idx_search_text ON fertilization_plans (cultivo, zona);

-- Índice HNSW para búsqueda semántica eficiente por similitud coseno
-- HNSW es más rápido que IVFFlat para datasets pequeños (~60 registros)
CREATE INDEX IF NOT EXISTS idx_embedding_hnsw
    ON fertilization_plans
    USING hnsw (embedding vector_cosine_ops);

