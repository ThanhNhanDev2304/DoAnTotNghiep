import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatDto } from './dto/chat.dto';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Gửi tin nhắn đến AI Chatbot HR' })
  async chat(@Body() dto: ChatDto, @User('id') _userId: string) {
    const reply = await this.chatbotService.chat(dto.message, dto.history ?? []);
    return { statusCode: 200, message: 'OK', data: { reply } };
  }
}
