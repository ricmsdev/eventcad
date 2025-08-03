// Importa polyfills primeiro
import './polyfills';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

/**
 * Bootstrap da aplicação EventCAD+
 * Configura segurança, validação, documentação e logging
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Cria a aplicação NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
    const corsOrigin = configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:3001',
    );

    // Configurações de segurança
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    );

    // Compressão de respostas
    app.use(compression());

    // CORS configuration
    app.enableCors({
      origin: corsOrigin.split(',').map((url) => url.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
      credentials: true,
    });

    // Prefixo global das rotas da API
    app.setGlobalPrefix(apiPrefix);

    // Pipe global de validação
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Remove propriedades não definidas no DTO
        forbidNonWhitelisted: true, // Retorna erro se propriedades extras forem enviadas
        transform: true, // Transforma tipos automaticamente
        disableErrorMessages: false, // Mostra mensagens de erro detalhadas
        validateCustomDecorators: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configuração do Swagger/OpenAPI
    const swaggerConfig = new DocumentBuilder()
      .setTitle('EventCAD+ API')
      .setDescription(
        `
        **API completa do EventCAD+ - Sistema de gestão e execução de eventos**
        
        Esta API oferece funcionalidades para:
        - 🔐 Autenticação e autorização (JWT + RBAC)
        - 🏢 Gestão multi-tenant
        - 📋 Gestão de eventos e plantas
        - 🤖 Reconhecimento inteligente (AI)
        - ✅ Compliance automatizado
        - 📊 Relatórios e auditoria
        - 📱 Operação mobile e offline
        
        **Segurança**: Todas as rotas (exceto login/register) requerem autenticação Bearer Token.
        
        **Multi-tenant**: Dados são isolados por tenant automaticamente.
        
        **Rate Limiting**: 100 requests por minuto por IP.
      `,
      )
      .setVersion('1.0.0')
      .setContact('EventCAD+ Team', 'https://eventcad.com', 'api@eventcad.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Token JWT obtido no login',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'Endpoints de autenticação e autorização')
      .addTag('Events', 'Gestão de eventos')
      .addTag('Plants', 'Gestão de plantas e layouts')
      .addTag('AI Recognition', 'Reconhecimento inteligente')
      .addTag('Compliance', 'Compliance e checklists')
      .addTag('Reports', 'Relatórios e exportação')
      .addTag('Users', 'Gestão de usuários')
      .addTag('Tenants', 'Gestão de organizações')
      .addServer(
        configService.get<string>('NODE_ENV') === 'development'
          ? `http://localhost:${port}/${apiPrefix}`
          : `https://api.eventcad.com/${apiPrefix}`,
        configService.get<string>('NODE_ENV') === 'development'
          ? 'Servidor de Desenvolvimento'
          : 'Servidor de Produção',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
      customSiteTitle: 'EventCAD+ API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #1976d2; }
      `,
    });

    // Endpoint de health check
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        uptime: process.uptime(),
      });
    });

    // Inicia o servidor
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 EventCAD+ API iniciada com sucesso!`);
    logger.log(`📍 Servidor rodando em: http://localhost:${port}`);
    logger.log(`📚 Documentação disponível em: http://localhost:${port}/docs`);
    logger.log(`🔍 Health check em: http://localhost:${port}/health`);
    logger.log(`🌍 Ambiente: ${configService.get('NODE_ENV')}`);
    logger.log(
      `🗃️  Banco: PostgreSQL em ${configService.get('DATABASE_HOST')}`,
    );
  } catch (error) {
    logger.error('❌ Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
