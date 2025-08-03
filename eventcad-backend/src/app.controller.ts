import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Mensagem de boas-vindas',
    description: 'Endpoint público que retorna informações básicas da API',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem de boas-vindas e informações da API',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        version: { type: 'string' },
        documentation: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Status da aplicação',
    description: 'Endpoint público para verificar status e saúde da aplicação',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da aplicação',
  })
  getStatus() {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  }
}
