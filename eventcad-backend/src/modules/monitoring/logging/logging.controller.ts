import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoggingService, LogEntry } from './logging.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Logging')
@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter logs recentes (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs do sistema' })
  async getLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number,
  ): Promise<LogEntry[]> {
    return this.loggingService.getRecentLogs(level, limit || 100);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar logs com filtros (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs filtrados' })
  async searchLogs(
    @Query('query') query?: string,
    @Query('level') level?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<LogEntry[]> {
    return this.loggingService.searchLogs(query || '', level, from, to);
  }

  @Get('errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter apenas logs de erro (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs de erro' })
  async getErrorLogs(
    @Query('limit') limit?: number,
  ): Promise<LogEntry[]> {
    return this.loggingService.getRecentLogs('error', limit || 50);
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter logs de auditoria (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs de auditoria' })
  async getAuditLogs(
    @Query('limit') limit?: number,
  ): Promise<LogEntry[]> {
    // Buscar logs que contêm "AUDIT" na mensagem
    return this.loggingService.searchLogs('AUDIT', 'info', undefined, undefined);
  }

  @Get('security')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter logs de segurança (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs de segurança' })
  async getSecurityLogs(
    @Query('limit') limit?: number,
  ): Promise<LogEntry[]> {
    // Buscar logs que contêm "SECURITY" na mensagem
    return this.loggingService.searchLogs('SECURITY', 'warn', undefined, undefined);
  }

  @Get('performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter logs de performance (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs de performance' })
  async getPerformanceLogs(
    @Query('limit') limit?: number,
  ): Promise<LogEntry[]> {
    // Buscar logs que contêm "PERFORMANCE" na mensagem
    return this.loggingService.searchLogs('PERFORMANCE', 'info', undefined, undefined);
  }

  @Get('business')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter logs de negócio (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Logs de negócio' })
  async getBusinessLogs(
    @Query('limit') limit?: number,
  ): Promise<LogEntry[]> {
    // Buscar logs que contêm "BUSINESS" na mensagem
    return this.loggingService.searchLogs('BUSINESS', 'info', undefined, undefined);
  }
} 