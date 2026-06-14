import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PositionService } from './position.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { AdminOnly, Public } from '@/common/decorators/metadata';

@ApiTags('Position')
@Controller({ path: 'positions', version: '1' })
export class PositionController {
  constructor(private readonly service: PositionService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tạo chức vụ (Admin)' })
  create(@Body() dto: CreatePositionDto) { return this.service.create(dto); }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách chức vụ' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết chức vụ' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Cập nhật chức vụ (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdatePositionDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Xóa chức vụ (Admin)' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
