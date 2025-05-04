import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomConfigModule } from './config/config.module';
import { LlmModule } from './llm/llm.module';
import { AppController } from './app.controller';

@Module({
  imports: [CustomConfigModule, LlmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
