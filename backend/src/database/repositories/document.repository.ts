import { db } from "../db";
import { documentChunks } from "../schema/documentChunk";
import { sql } from "drizzle-orm";

export const findSimilarChunks = async (embedding: number[], limit = 3) => {
  const vectorQuery = `[${embedding.join(',')}]`;
  
  // pgvector uses <=> for cosine distance. 
  // We order by distance, so lower is more similar.
  const result = await db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${vectorQuery})`,
    })
    .from(documentChunks)
    .orderBy(sql`${documentChunks.embedding} <=> ${vectorQuery}`)
    .limit(limit);

  return result;
};
