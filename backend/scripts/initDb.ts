import { Client } from 'pg';

async function setup() {
    const rootConfig = {
        connectionString: 'postgresql://postgres:root@localhost:5432/postgres'
    };

    const dbConfig = {
        connectionString: 'postgresql://postgres:root@localhost:5432/fertilization_db'
    };

    const rootClient = new Client(rootConfig);

    try {
        console.log('🔗 Conectando a PostgreSQL...');
        await rootClient.connect();

        try {
            await rootClient.query('CREATE DATABASE fertilization_db');
            console.log('✅ Base de datos "fertilization_db" creada.');
        } catch (e: any) {
            if (e.code === '42P04') {
                console.log('ℹ️ La base de datos ya existe.');
            } else {
                throw e;
            }
        }
    } catch (err) {
        console.error('❌ Error creando la base de datos:', err);
    } finally {
        await rootClient.end();
    }

    const dbClient = new Client(dbConfig);
    try {
        await dbClient.connect();
        console.log('🔗 Configurando tablas...');

        // Eliminamos la tabla si existía con estructura vieja para asegurar la nueva
        await dbClient.query('DROP TABLE IF EXISTS fertilization_plans');

        await dbClient.query(`
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
            )
        `);
        console.log('✅ Tabla "fertilization_plans" lista.');

    } catch (err) {
        console.error('❌ Error configurando las tablas:', err);
    } finally {
        await dbClient.end();
    }
}

setup();
