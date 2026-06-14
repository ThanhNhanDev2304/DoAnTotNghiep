import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Proposal')
@Controller({ path: 'proposals', version: '1' })
export class ProposalController {
  constructor(private readonly service: ProposalService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi kiến nghị (Employee)' })
  create(@User('id') userId: string, @Body() dto: CreateProposalDto) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Kiến nghị của tôi' })
  findMy(@User('id') userId: string) {
    return this.service.findMy(userId);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tất cả kiến nghị (HR/Admin)' })
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Cập nhật trạng thái kiến nghị (HR/Admin)' })
  updateStatus(@Param('id') id: string, @User('id') hrId: string, @Body() dto: UpdateProposalStatusDto) {
    return this.service.updateStatus(id, hrId, dto);
  }
}
