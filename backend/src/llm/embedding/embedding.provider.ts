export interface EmbeddingProvider {
    getProviderName(): string
    makeEmbeddings(texts: string[]): Promise<number[][]>
    makeEmbedding(text: string): Promise<number[]>
    getModelInfo(): Promise<{dimension: number, model_name: string}>
}