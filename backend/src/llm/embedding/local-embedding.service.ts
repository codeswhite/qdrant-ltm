import { ConfigService } from "@nestjs/config";
import { EmbeddingProvider } from "./embedding.provider";
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalEmbeddingService implements EmbeddingProvider {

    private embedderUrl: string;

    constructor(private configService: ConfigService) {
        this.embedderUrl = this.configService.get('EMBEDDER_URL', 'http://127.0.0.1:3002');
    }

    getProviderName(): string {
        return 'local';
    }

    getModelInfo(): Promise<{ dimension: number, model_name: string }> {
        return fetch(this.embedderUrl + '/info').then(res => res.json());
    }

    async makeEmbeddings(texts: string[]): Promise<number[][]> {
        const time = performance.now();
        console.log(`Embedding ${texts.length} texts...`);
        const embeddings = await fetch(this.embedderUrl + '/embed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texts }),
        }).then(res => res.json());
        console.log(`Embedding time: ${performance.now() - time}ms`);
        return embeddings.embeddings;
    }

    makeEmbedding(text: string): Promise<number[]> {
        return this.makeEmbeddings([text]).then(embeddings => embeddings[0]);
    }
}
