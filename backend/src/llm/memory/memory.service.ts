import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LocalEmbeddingService } from '../embedding/local-embedding.service';

const MEMORY_PARSER_SYS_PROMPT = `Your task is to analyze the user's input and extract his ideas, desires, facts about him, and anything that could be potentially useful in future interactions.
Focus on user-oriented info.

Exclude:
- Well-known facts, general knowledge, or clichés.
- Abstract, ambiguous, or emotional statements without clear context.
- Hypotheticals, opinions on broad topics, or non-personal details.

Format:
Phrase memories in full, descriptive, third-person, standalone statements, no commentary.

Examples:
    Input: "My cat's name's tom."
    -> Output: ["User has a cat named Tom"]

    Input: "Old trees scare me."
    -> Output: ["User can be scared of old trees"]

    Input: "I went to the park yesterday and saw an amazing sunset."
    → Output: ["User went to the park yesterday", "User saw an amazing sunset"]

    Input: "The winter in Berlin can get cold sometimes."
    → Output: [] (general knowledge)

    Input: "I'd like to fly to the moon on my spaceship."
    -> Output: ["User has an interest in space travel, specifically to the moon", "User owns a spaceship"]

---

For the ttl_days, please specify a logical number of days that the information should stay relevant,
after that it will become considered unchecked until refreshed.`

const MEMORY_PARSER_SCHEMA_ZOD = z.object({
  memories: z.array(z.object({
    text: z.string().describe('The text to be embedded, stored and retrieved.'),
    reason: z.string().describe('The logical reason why this memo has been included. In short please.'),
    ttl_days: z.number().describe('In days, For how long this info should be considered relevant?')
  })).describe('Set of memories extracted from the user input'),
  avoidance_reason: z.string().describe('In case no memories were extracted, what is the reason for that? (if memories extracted, leave empty)')
}).strict();
// console.log(zodToJsonSchema(MEMORY_PARSER_SCHEMA_ZOD)) // DEBUG

@Injectable()
export class MemoryService implements OnModuleInit {
  private client: QdrantClient;
  private openai: OpenAI;
  private collectionName: string;
  private qdrantHost: string;

  constructor(private configService: ConfigService, private embeddingService: LocalEmbeddingService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.qdrantHost = this.configService.get('QDRANT_HOST', 'localhost');
  }

  async onModuleInit() {

    const modelInfo = await this.embeddingService.getModelInfo();
    const sanitizedModelName = modelInfo.model_name.split('/').pop();
    this.collectionName = `${this.embeddingService.getProviderName()}_${sanitizedModelName}_${modelInfo.dimension}_memories`

    this.client = new QdrantClient({ host: this.qdrantHost });

    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === this.collectionName,
    );

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: modelInfo.dimension,
          distance: 'Cosine',
        },
      });
    }
  }

  async getRelatedMemories(params: {
    userPrompt: string,
    userId: string,
    sessionId?: string
  }) {
    const { userPrompt, userId, sessionId } = params;
    try {
      const embedding = await this.embeddingService.makeEmbedding(userPrompt);
      return this.getMemoriesFromDB({ userId, queryEmbedding: embedding, excludeSessionId: sessionId });
    } catch (error) {
      console.error('Error getting related memories:', error);
      throw error;
    }
  }

  async storeMemoryEmbedding(
    userId: string,
    sessionId: string,
    memory_text: string,
    embedding: number[],
    metadata: Record<string, any> = {},
  ) {
    const time = performance.now();
    await this.client.upsert(this.collectionName, {
      points: [
        {
          id: randomUUID(),
          vector: embedding,
          payload: {
            userId,
            sessionId,
            memory_text,
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });
    console.log(`Memory storage time: ${performance.now() - time}ms`)
  }

  async getMemoriesFromDB(params: {
    userId: string;
    queryEmbedding: number[];
    limit?: number;
    scoreThreshold?: number;
    excludeSessionId?: string;
  }) {
    const {
      userId,
      queryEmbedding,
      limit = 5,
      scoreThreshold = 0.55,
      excludeSessionId = undefined
    } = params;

    const time = performance.now();

    const result = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit: limit * 3,
      filter: {
        must: [
          {
            key: 'userId',
            match: { value: userId },
          },
        ],
        must_not: [
          ...(excludeSessionId ? [
            {
              key: 'sessionId',
              match: { value: excludeSessionId },
            },
          ] : []),
        ]
      },
    });
    console.log(`Memory search time: ${performance.now() - time}ms`);
    console.log(`Memory search result: ${JSON.stringify(result, null, 2)}`);

    const filtered = result.filter((item) => item.score >= scoreThreshold);
    console.log(`Relevant memories: ${filtered.length}`);

    return filtered.map((item) => ({
      memoryId: item.id,
      memoryText: item.payload?.memory_text as string,
      score: item.score,
    }));
  }

  // Function that takes user input and synthesizes it into memories.
  async parseMemories(userInput: string) {
    console.log("Making memory.. calling gpt for parsing.")
    const time = performance.now();
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system', content: MEMORY_PARSER_SYS_PROMPT
        },
        { role: 'user', content: userInput }
      ],
      n: 1,
      temperature: 0.0, // !
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "memory_parser",
          strict: true,
          schema: zodToJsonSchema(MEMORY_PARSER_SCHEMA_ZOD) // Next versions of OpenAI will add built-in Zod support
        },
      },
      model: 'gpt-4.1-nano',
    });
    console.debug(`Memory parsing time: ${performance.now() - time}ms`);
    if (!completion.choices[0]) {
      console.error('Memory parsing Completion:', completion);
      throw new Error('Failed to generate memory parsing');
    }
    if (!completion.choices[0].message.content) {
      console.error('Memory parsing Completion:', completion);
      throw new Error('Memory didnt generate content');
    }
    console.info('Memory Parser output:', completion.choices[0].message.content);
    try {
      const parsedMems = MEMORY_PARSER_SCHEMA_ZOD.parse(JSON.parse(completion.choices[0].message.content));
      return parsedMems;
    } catch (error) {
      console.error('Memory parsing error:', error);
      throw error;
    }
  }

  async processAndSaveMemory(params: { userId: string, sessionId: string, userInput: string, metadata?: Record<string, unknown> }) {
    const { userId, sessionId, userInput, metadata } = params;
    try {

      const memos = await this.parseMemories(userInput);
      if (!memos.memories || memos.memories.length === 0) {
        console.log(`No memories extracted from input, reason: '${memos.avoidance_reason}'`);
        return;
      }
      for (const memo of memos.memories) {
        const embedding = await this.embeddingService.makeEmbedding(memo.text);
        // Check for duplicates
        const existing = await this.getMemoriesFromDB({ userId: userId, queryEmbedding: embedding, limit: 1, scoreThreshold: 0.99 });
        if (existing.length > 0) {
          console.log(`Memory already exists: ${existing[0].memoryText}`);
          continue;
        }

        await this.storeMemoryEmbedding(
          userId,
          sessionId,
          memo.text,
          embedding,
          { ...metadata, reason: memo.reason, ttl_days: memo.ttl_days }
        )
      }
    } catch (error) {
      console.error('Error processing and saving memory:', error);
      throw error;
    }
  }
}


