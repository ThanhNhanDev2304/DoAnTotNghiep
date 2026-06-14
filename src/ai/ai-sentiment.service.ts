import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { IAiSentimentResult, IAiSentimentService, IMonthlyReportData } from './interfaces/ai.interface';

@Injectable()
export class AiSentimentService implements IAiSentimentService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger(AiSentimentService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required');
    this.client = new Anthropic({ apiKey });
    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
  }

  async analyzeSentiment(text: string): Promise<IAiSentimentResult> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Phân tích cảm xúc của đoạn phản hồi sau từ người lao động tại nhà máy:

"${text}"

Trả lời theo JSON format sau (không có markdown):
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "score": 0.0-1.0,
  "reasoning": "giải thích ngắn gọn bằng tiếng Việt",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"]
}`,
          },
        ],
      });

      const raw = (response.content[0] as any).text.trim();
      const parsed = JSON.parse(raw);
      return {
        sentiment: parsed.sentiment ?? 'NEUTRAL',
        score: parsed.score ?? 0.5,
        reasoning: parsed.reasoning ?? '',
        keywords: parsed.keywords ?? [],
      };
    } catch (e: any) {
      this.logger.error(`Sentiment analysis failed: ${e.message}`);
      return { sentiment: 'NEUTRAL', score: 0.5, reasoning: 'Không thể phân tích', keywords: [] };
    }
  }

  async generateMonthlyReport(data: IMonthlyReportData): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Bạn là chuyên gia phân tích nhân sự của UMC Electronics Vietnam. Hãy tạo báo cáo tổng hợp ngắn gọn bằng tiếng Việt dựa trên dữ liệu sau:

Tháng: ${data.month}/${data.year}
Tổng phản hồi: ${data.totalFeedbacks}
Cảm xúc: Tích cực ${data.sentimentBreakdown.positive}, Tiêu cực ${data.sentimentBreakdown.negative}, Trung lập ${data.sentimentBreakdown.neutral}
Vấn đề nổi bật: ${data.topIssues.join(', ')}
Điểm sức khỏe phòng ban: ${data.departmentScores.map((d) => `${d.name}: ${d.score}/100`).join(', ')}

Hãy viết báo cáo theo cấu trúc:
1. Tóm tắt tổng quan
2. Điểm nổi bật tháng này
3. Vấn đề cần chú ý
4. Khuyến nghị cải thiện`,
          },
        ],
      });
      return (response.content[0] as any).text;
    } catch (e: any) {
      this.logger.error(`Monthly report generation failed: ${e.message}`);
      return 'Không thể tạo báo cáo tự động. Vui lòng thử lại.';
    }
  }
}
