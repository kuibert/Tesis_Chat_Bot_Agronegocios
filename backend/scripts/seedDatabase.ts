import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fertilization_db',
};

async function seedDatabase() {
    console.log('🌱 Iniciando siembra de base de datos desde CSV...');

    const client = new Client(DB_CONFIG);
    const csvPath = path.join(__dirname, '../../data/fertilizacion_honduras.csv');

    try {
        await client.connect();

        // Leer y parsear CSV
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        console.log(`📊 Encontrados ${records.length} registros en el CSV.`);

        for (const record of records) {
            const query = `
                INSERT INTO fertilization_plans (
                    cultivo, variedad, zona, dias_cosecha, formula_npk, fuente_potasio, observaciones_tecnicas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING;
            `;

            const values = [
                record.cultivo,
                record.variedad,
                record.zona,
                parseInt(record.dias_cosecha),
                record.formula_npk,
                record.fuente_potasio,
                record.observaciones_tecnicas
            ];

            await client.query(query, values);
        }

        console.log('✅ Importación de CSV completada.');

    } catch (error) {
        console.error('❌ Error sembrando la base de datos:', error);
    } finally {
        await client.end();
    }
}

seedDatabase();
