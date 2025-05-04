import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomConfigModule } from './config/config.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [CustomConfigModule, LlmModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
