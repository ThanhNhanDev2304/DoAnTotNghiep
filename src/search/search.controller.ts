import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { User } from '@/common/decorators/user.decorator';
import type { ISanitizedUser } from '@/auth/interfaces/auth.interface';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm toàn cục' })
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') q: string, @User() user: ISanitizedUser) {
    const data = await this.searchService.search(q || '', user.id, user.roleName);
    return { statusCode: 200, message: 'OK', data };
  }
}
