import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiSentimentService } from '@/ai/ai-sentiment.service';

@Module({
  imports: [ConfigModule],
  providers: [AiSentimentService],
  exports: [AiSentimentService],
})
export class AiModule {}
