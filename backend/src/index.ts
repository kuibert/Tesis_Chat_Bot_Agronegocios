import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { prisma } from './db';
import { embeddingService } from './services/embeddingService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint principal de Chat
app.post('/api/chat', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    try {
        // Búsqueda por palabras clave usando Prisma $queryRaw para mantener la lógica exacta
        const matchedPlans = await prisma.$queryRaw`
            SELECT cultivo, variedad, zona, dias_cosecha, formula_npk, fuente_potasio, observaciones_tecnicas
            FROM fertilization_plans
            WHERE 
                ${question} ILIKE '%' || cultivo || '%' OR 
                ${question} ILIKE '%' || zona || '%'
            LIMIT 3
        ` as any[];

        if (matchedPlans.length === 0) {
            return res.json({
                answer: "Lo siento, no encontré registros históricos que coincidan con tu consulta para esta zona o cultivo."
            });
        }

        // Construir respuesta basada estrictamente en los datos (RAG)
        const bestMatch = matchedPlans[0];
        let answer = `Basado en los registros históricos de ${bestMatch.zona}:\n\n`;
        answer += `• Cultivo: ${bestMatch.cultivo} ${bestMatch.variedad || ''}\n`;
        answer += `• Etapa: ${bestMatch.dias_cosecha} días\n`;
        answer += `• Fórmula Recomendada: ${bestMatch.formula_npk}\n`;
        answer += `• Fuente de Potasio: ${bestMatch.fuente_potasio || 'N/A'}\n\n`;

        if (bestMatch.observaciones_tecnicas) {
            answer += `📝 Observación: ${bestMatch.observaciones_tecnicas}\n`;
        }

        answer += `\n⚠️ Recuerda: Esta recomendación es referencial basada en datos previos.`;

        res.json({ answer });

    } catch (error) {
        console.error('Error en /api/chat:', error);
        res.status(500).json({ error: 'Error procesando la consulta agrícola' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'AgroChat Backend' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de AgroChat corriendo en http://localhost:${PORT}`);
});
