import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { MemoryService } from './memory/memory.service';

type ChatMessage = OpenAI.ChatCompletionMessageParam;
interface Session {
  userId: string;
  messages: ChatMessage[];
  lastActivity: number;
  relevantMemories: { memoryId: string | number }[];
}

/**
 * A service for handling LLM interactions
 */
@Injectable()
export class LlmService {
  private openai: OpenAI;
  private sessions: Map<string, Session> = new Map();
  // private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in ms

  constructor(private configService: ConfigService, private memoryService: MemoryService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  initSession(sessionId: string, systemPrompt?: string): void {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    this.sessions.set(sessionId, {
      userId: '0x0',
      messages,
      lastActivity: Date.now(),
      relevantMemories: []
    });
  }

  async chatCompletion(
    sessionId: string,
    userMessage: string,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found, please create a new session`);
    }

    // TODO Validate user's message!

    session.messages.push({ role: 'user', content: userMessage });

    // Load relevant user memories:
    const memories = await this.memoryService.getRelatedMemories({ userPrompt: userMessage, userId: session.userId, sessionId });

    // Deduplicate memories
    const newMemories = memories.filter((memory) => !session.relevantMemories.some(m => m.memoryId === memory.memoryId));
    if (newMemories) {
      session.relevantMemories = [...session.relevantMemories, ...newMemories.map(m => ({ memoryId: m.memoryId }))];
    }
    console.log(`Fetched ${memories.length} relevant user memories, ${newMemories.length} new memories in session:`, newMemories);

    // Add memories to context
    session.messages.push({ role: 'system', content: 'Relevant memories about the user:\n' + newMemories.map(m => '- ' + m.memory?.memory_text).join('\n') });

    // Async: Process and store memories
    this.memoryService.processAndSaveMemory({ userId: session.userId, sessionId, userInput: userMessage, metadata: { timestamp: new Date().toISOString() } });

    // Call LLM for response
    try {
      const completion = await this.openai.chat.completions.create({
        messages: session.messages,
        model: 'gpt-4.1-nano',
      });

      const assistantMessage = completion.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('Failed to generate assistant response');
      }
      session.messages.push({ role: 'assistant', content: assistantMessage });
      return { assistantMessage, newFetchedMemories: newMemories };
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  getSessions(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }

  getSessionHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.messages;
    }
    return [];
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
