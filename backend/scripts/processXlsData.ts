import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fertilization_db',
};

// Ruta a la carpeta de calendarios
const DATA_DIR = path.join(__dirname, '../../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion');

async function processXLSFiles() {
    console.log('🚀 Iniciando escaneo de archivos XLS...');

    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Carpeta no encontrada: ${DATA_DIR}`);
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.xls'));
    console.log(`📂 Encontrados ${files.length} archivos para procesar.`);

    const client = new Client(DB_CONFIG);
    await client.connect();

    try {
        for (const file of files) {
            console.log(`📄 Procesando: ${file}`);
            const filePath = path.join(DATA_DIR, file);

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convertir a JSON para inspeccionar estructura
            const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Extraer metadatos del nombre del archivo (ej: Aguacate_Año-1-a-4)
            const cultivoInfo = file.split('_')[0];
            const metaInfo = file.replace(`${cultivoInfo}_`, '').replace('.xls', '').replace(/_/g, ' ');

            // IMPORTANTE: Dado que los archivos XLS tienen estructuras muy variables (EDA/MCA),
            // por ahora extraeremos filas que parezcan tener fórmulas NPK.
            // En una segunda fase, ajustaremos este parser según la estructura visual de tus archivos.

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowString = JSON.stringify(row);

                // Buscar filas que mencionen "Semana", "Día" o fórmulas NPK
                if (rowString.match(/\b\d{1,2}-\d{1,2}-\d{1,2}\b/) || rowString.includes('Semana') || rowString.includes('Etapa')) {

                    const query = `
                        INSERT INTO fertilization_plans (
                            cultivo, variedad, zona, dias_cosecha, formula_npk, fuente_potasio, observaciones_tecnicas
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT DO NOTHING;
                    `;

                    // Mapeo básico: trataremos de extraer la fórmula si existe
                    const formulaMatch = rowString.match(/\d{1,2}-\d{1,2}-\d{1,2}/);
                    const formula = formulaMatch ? formulaMatch[0] : 'Consultar XLS';

                    await client.query(query, [
                        cultivoInfo,
                        metaInfo,
                        'Honduras (General)', // Por defecto si no se extrae la zona
                        0, // Días cosecha (se actualizará con lógica de semanas)
                        formula,
                        'Ver archivo original',
                        `Datos extraídos de: ${file}. Contexto: ${rowString.substring(0, 200)}`
                    ]);
                }
            }
        }
        console.log('✅ Carga masiva de archivos XLS completada.');
    } catch (err) {
        console.error('❌ Error procesando XLS:', err);
    } finally {
        await client.end();
    }
}

processXLSFiles();
