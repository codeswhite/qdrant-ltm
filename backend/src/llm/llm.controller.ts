import { Body, Controller, Post, Param } from '@nestjs/common';
import { LlmService } from './llm.service';
import { MemoryService } from './memory/memory.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService, private readonly memoryService: MemoryService) { }

  @Post('session')
  createSession(@Body() body: { systemPrompt?: string }) {
    const sessionId = Date.now().toString();
    this.llmService.initSession(sessionId, body.systemPrompt);
    return { sessionId };
  }

  @Post('session/:id/completion')
  async createCompletion(
    @Param('id') sessionId: string,
    @Body() body: { message: string }
  ) {
    console.log(`Creating completion for session ${sessionId}, user message: ${body.message}`);
    const response = await this.llmService.chatCompletion(
      sessionId,
      body.message
    );
    return response;
  }

  @Post('find-related-memories')
  async findRelatedMemories(@Body() body: { user_prompt: string }) {
    return this.memoryService.getRelatedMemories({ userId: '0x0', userPrompt: body.user_prompt });
  }
}
