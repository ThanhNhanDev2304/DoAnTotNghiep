import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '@/prisma/prisma.service';
import { ChatHistoryItemDto } from './dto/chat.dto';

@Injectable()
export class ChatbotService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required');
    this.client = new Anthropic({ apiKey });
    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
  }

  async chat(message: string, history: ChatHistoryItemDto[] = []): Promise<string> {
    try {
      // RAG: lấy thông báo nội bộ gần nhất
      const announcements = await this.prisma.announcement.findMany({
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 15,
        select: { title: true, content: true, type: true, createdAt: true },
      });

      // RAG: lấy Q&A đã được HR trả lời
      const qnaList = await this.prisma.qnA.findMany({
        where: { status: 'ANSWERED', answers: { some: {} } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          question: true,
          category: true,
          answers: { select: { content: true }, orderBy: { createdAt: 'asc' }, take: 1 },
        },
      });

      const announcementCtx = announcements.length
        ? announcements.map((a) => `[${a.type}] ${a.title}:\n${a.content.slice(0, 400)}`).join('\n---\n')
        : 'Chưa có thông báo nào.';

      const qnaCtx = qnaList.length
        ? qnaList.map((q) => `Hỏi: ${q.question}\nĐáp: ${q.answers[0]?.content ?? ''}`).join('\n---\n')
        : 'Chưa có hỏi đáp nào.';

      const systemPrompt = `Bạn là trợ lý HR thông minh của UMC Electronics Vietnam, tên là "UMC AI". Nhiệm vụ: hỗ trợ nhân viên giải đáp thắc mắc về chính sách, quy định, thông báo nội bộ và các vấn đề nhân sự.

=== THÔNG BÁO NỘI BỘ GẦN ĐÂY ===
${announcementCtx}

=== HỎI ĐÁP ĐÃ ĐƯỢC GIẢI ĐÁP ===
${qnaCtx}

=== HƯỚNG DẪN ===
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Ưu tiên dùng thông tin trên để trả lời chính xác
- Nếu không có thông tin liên quan, hướng dẫn nhân viên liên hệ HR trực tiếp hoặc gửi câu hỏi qua mục Hỏi đáp
- Giữ câu trả lời ngắn gọn, rõ ràng (tối đa 250 từ)
- Không bịa đặt thông tin không có trong dữ liệu
- Khi cần thiết có thể dùng danh sách gạch đầu dòng cho rõ ràng`;

      const messages: Anthropic.MessageParam[] = [
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      return (response.content[0] as Anthropic.TextBlock).text;
    } catch (e: any) {
      this.logger.error(`Chatbot error: ${e.message}`);
      return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ HR trực tiếp.';
    }
  }
}
