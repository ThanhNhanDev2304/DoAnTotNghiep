import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AdminOnly } from '@/common/decorators/metadata';

@ApiTags('Shift')
@Controller({ path: 'shifts', version: '1' })
export class ShiftController {
  constructor(private readonly service: ShiftService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tạo ca làm việc (Admin)' })
  create(@Body() dto: CreateShiftDto) { return this.service.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Danh sách ca làm việc' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết ca làm việc' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Cập nhật ca làm việc (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Xóa ca làm việc (Admin)' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
