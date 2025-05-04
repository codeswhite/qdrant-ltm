import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { MemoryService } from './memory/memory.service';
import { LocalEmbeddingService } from './embedding/local-embedding.service';
import { OpenAIEmbeddingService } from './embedding/openai-embedding.service';

@Module({
  imports: [ConfigModule],
  controllers: [LlmController],
  providers: [LlmService, MemoryService, OpenAIEmbeddingService, LocalEmbeddingService],
  exports: [LlmService],
})
export class LlmModule {}
