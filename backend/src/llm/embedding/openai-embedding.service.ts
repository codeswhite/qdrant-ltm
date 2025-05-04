import OpenAI from "openai";
import { EmbeddingProvider } from "./embedding.provider";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

/**
 * Embeddings via OpenAI API
 * ## Pros: 
 * - Easy to use
 * ## Cons: 
 * - Costly
 * - Slower than local embeddings
 */
@Injectable()
export class OpenAIEmbeddingService implements EmbeddingProvider {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
        });
    }

    OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002'; // or 'text-embedding-3-small',
    OPENAI_EMBEDDING_DIMENSION = 1536;

    getProviderName(): string {
        return 'openai';
    }

    async makeEmbedding(text: string): Promise<number[]> {
        console.log("Making embedding.. calling OpenAI.")
        const time = performance.now()
        const embeddings = await this.openai.embeddings.create({
            input: text,
            model: this.OPENAI_EMBEDDING_MODEL
            // dimensions: OPENAI_EMBEDDING_DIMENSION
        });
        console.log(`Embedding time: ${performance.now() - time}ms`);
        console.log(`Embedding result length: ${embeddings.data[0].embedding.length}`);
        return embeddings.data[0].embedding;
    }

    makeEmbeddings(texts: string[]): Promise<number[][]> {
        throw new Error("Not implemented")
    }

    getModelInfo(): Promise<{ dimension: number, model_name: string }> {
        return Promise.resolve({
            dimension: this.OPENAI_EMBEDDING_DIMENSION,
            model_name: this.OPENAI_EMBEDDING_MODEL
        });
    }
}