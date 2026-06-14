import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Announcement')
@Controller({ path: 'announcements', version: '1' })
export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Đăng thông báo (HR/Admin)' })
  create(@User('id') authorId: string, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(authorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách thông báo' })
  findAll(@Query('type') type?: string) {
    return this.service.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thông báo' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Chỉnh sửa thông báo (HR/Admin)' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateAnnouncementDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Xóa thông báo (HR/Admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
