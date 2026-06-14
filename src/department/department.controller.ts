import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AdminOnly, Public } from '@/common/decorators/metadata';

@ApiTags('Department')
@Controller({ path: 'departments', version: '1' })
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tạo phòng ban mới (Admin)' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách phòng ban' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết phòng ban' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Cập nhật phòng ban (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Xóa phòng ban (Admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
