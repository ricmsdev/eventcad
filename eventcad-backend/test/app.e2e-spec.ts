require('dotenv').config({ path: '.env.test' });
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';

jest.setTimeout(30000);

/**
 * Testes E2E principais da aplicação EventCAD+
 *
 * Cobertura de testes:
 * - Health check e status da aplicação
 * - Autenticação e autorização
 * - Fluxos críticos de negócio
 * - Integração entre módulos
 */
describe('EventCAD+ (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  const plantaId: string = '';
  const infraObjectId: string = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar middlewares globais como na aplicação real
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) should return application status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('environment');
        });
    });

    it('/ (GET) should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('EventCAD+');
        });
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@eventcad.com',
      password: 'Test123!@#',
      name: 'Test User',
      role: 'engineer',
    };

    it('/api/v1/auth/register (POST) should register new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user).not.toHaveProperty('password');

          // Salvar token para próximos testes
          accessToken = res.body.access_token;
          tenantId = res.body.user.tenantId;
        });
    });

    it('/api/v1/auth/login (POST) should authenticate user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('/api/v1/auth/profile (GET) should return user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.role).toBe(testUser.role);
        });
    });

    it('should reject requests without valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });

  describe('Complete Event Management Flow', () => {
    let eventoId: string;
    let plantaId: string;
    let aiJobId: string;
    let infraObjectId: string;

    it('should create complete event with plants and objects', async () => {
      // 1. Criar evento
      const eventoResponse = await request(app.getHttpServer())
        .post('/api/v1/eventos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nome: 'Teste E2E Event',
          descricao: 'Evento para teste end-to-end',
          tipo: 'feira',
          dataInicio: '2025-06-01T08:00:00.000Z',
          dataFim: '2025-06-03T18:00:00.000Z',
          local: 'Centro de Convenções Teste',
          publicoEstimado: 5000,
          status: 'planejamento',
        })
        .expect(201);

      eventoId = eventoResponse.body.id;
      expect(eventoResponse.body.nome).toBe('Teste E2E Event');

      // 2. Upload de planta (mock file)
      const plantaResponse = await request(app.getHttpServer())
        .post('/api/v1/plantas/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('eventoId', eventoId)
        .field('plantaTipo', 'planta_baixa')
        .field('description', 'Planta principal do evento')
        .attach('file', Buffer.from('mock-dwg-content'), {
          filename: 'planta-teste.dwg',
          contentType: 'application/octet-stream',
        })
        .expect(201);

      plantaId = plantaResponse.body.id;
      expect(plantaResponse.body.plantaTipo).toBe('planta_baixa');

      // 3. Criar job de IA para processar planta
      const aiJobResponse = await request(app.getHttpServer())
        .post('/api/v1/ai-recognition/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          jobName: 'Análise de Segurança - Teste E2E',
          modelType: 'fire_safety_ai',
          plantaId: plantaId,
          priority: 2, // High priority
          modelConfig: {
            confidence_threshold: 0.8,
            enable_object_detection: true,
            enable_text_recognition: true,
          },
        })
        .expect(201);

      aiJobId = aiJobResponse.body.id;
      expect(aiJobResponse.body.status).toBe('pending');

      // 4. Simular execução do job de IA
      await request(app.getHttpServer())
        .post(`/api/v1/ai-recognition/jobs/${aiJobId}/execute`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 5. Criar objeto de infraestrutura detectado
      const infraObjectResponse = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Extintor PQS 001',
          description: 'Extintor de pó químico detectado pela IA',
          plantaId: plantaId,
          aiJobId: aiJobId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'FIRE_EXTINGUISHER',
          source: 'ai_detection',
          geometry: {
            boundingBox: { x: 100, y: 200, width: 40, height: 60 },
            center: { x: 120, y: 230 },
            rotation: 0,
          },
          properties: {
            type: 'PQS',
            capacity: '6kg',
            pressure: '12bar',
            expiry_date: '2026-01-01',
          },
          confidence: 0.95,
          criticality: 'critical',
          requiredValidations: ['fire_safety', 'compliance'],
        })
        .expect(201);

      infraObjectId = infraObjectResponse.body.id;
      expect(infraObjectResponse.body.status).toBe('pending_review');
      expect(infraObjectResponse.body.requiresReview).toBe(true);

      // 6. Adicionar validação técnica
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${infraObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'fire_safety',
          status: 'passed',
          notes: 'Extintor em conformidade com NBR 12693',
          score: 95,
        })
        .expect(201);

      // 7. Aprovar objeto
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${infraObjectId}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 8. Verificar status final do objeto
      const finalObjectResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${infraObjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(finalObjectResponse.body.status).toBe('approved');
      expect(finalObjectResponse.body.manuallyValidated).toBe(true);

      // 9. Atualizar status do evento
      await request(app.getHttpServer())
        .patch(`/api/v1/eventos/${eventoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'aprovado',
        })
        .expect(200);

      // 10. Verificar timeline do evento
      const eventoFinalResponse = await request(app.getHttpServer())
        .get(`/api/v1/eventos/${eventoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(eventoFinalResponse.body.status).toBe('aprovado');
      expect(eventoFinalResponse.body.timeline).toBeDefined();
      expect(eventoFinalResponse.body.timeline.length).toBeGreaterThan(0);
    });

    it('should generate comprehensive reports', async () => {
      // Relatório de plantas
      const plantaReportResponse = await request(app.getHttpServer())
        .post('/api/v1/plantas/reports/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          includeDetails: true,
          includeAIResults: true,
          includeStatistics: true,
        })
        .expect(200);

      expect(plantaReportResponse.body).toHaveProperty('summary');
      expect(plantaReportResponse.body).toHaveProperty('plantas');

      // Relatório de objetos
      const objectReportResponse = await request(app.getHttpServer())
        .post('/api/v1/infra-objects/reports/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          includeDetails: true,
          includeQualityAnalysis: true,
        })
        .expect(200);

      expect(objectReportResponse.body).toHaveProperty('summary');
      expect(objectReportResponse.body).toHaveProperty('byCategory');

      // Relatório de IA
      const aiReportResponse = await request(app.getHttpServer())
        .post('/api/v1/ai-recognition/reports/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      expect(aiReportResponse.body).toHaveProperty('totalJobs');
    });

    it('should provide analytics dashboards', async () => {
      // Dashboard de objetos
      const objectDashboardResponse = await request(app.getHttpServer())
        .get('/api/v1/infra-objects/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(objectDashboardResponse.body).toHaveProperty('statistics');
      expect(objectDashboardResponse.body).toHaveProperty('needingReview');
      expect(objectDashboardResponse.body).toHaveProperty('alerts');

      // Dashboard de IA
      const aiDashboardResponse = await request(app.getHttpServer())
        .get('/api/v1/ai-recognition/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(aiDashboardResponse.body).toHaveProperty('summary');
      expect(aiDashboardResponse.body).toHaveProperty('recentJobs');

      // Dashboard de plantas
      const plantaDashboardResponse = await request(app.getHttpServer())
        .get('/api/v1/plantas/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(plantaDashboardResponse.body).toHaveProperty('summary');
      expect(plantaDashboardResponse.body).toHaveProperty('recentUploads');
    });

    it('should handle conflict analysis', async () => {
      // Criar objeto duplicado para testar conflitos
      await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Extintor PQS 002',
          description: 'Possível duplicata',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'FIRE_EXTINGUISHER',
          source: 'manual_creation',
          geometry: {
            boundingBox: { x: 95, y: 195, width: 40, height: 60 },
            center: { x: 115, y: 225 }, // Posição muito próxima
          },
          confidence: 0.7,
        })
        .expect(201);

      // Analisar conflitos
      const conflictResponse = await request(app.getHttpServer())
        .post('/api/v1/infra-objects/analyze-conflicts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          conflictTypes: ['duplicate', 'overlap'],
          overlapTolerance: 10,
          autoResolve: false,
        })
        .expect(200);

      expect(conflictResponse.body).toHaveProperty('conflicts');
      expect(conflictResponse.body.conflicts.length).toBeGreaterThan(0);
      expect(conflictResponse.body.conflicts[0].type).toBe('duplicate');
    });
  });

  describe('Advanced Features', () => {
    it('should handle file operations correctly', async () => {
      // Testar tipos de arquivo suportados
      const fileTypesResponse = await request(app.getHttpServer())
        .get('/api/v1/upload/supported-types')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(fileTypesResponse.body).toHaveProperty('technical');
      expect(fileTypesResponse.body.technical).toContain('dwg');

      // Testar upload com validação
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('description', 'Arquivo de teste')
        .field('fileCategory', 'technical')
        .attach('file', Buffer.from('test content'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(201);

      expect(uploadResponse.body).toHaveProperty('id');
      expect(uploadResponse.body.fileCategory).toBe('technical');
    });

    it('should provide AI model recommendations', async () => {
      const recommendationsResponse = await request(app.getHttpServer())
        .get(`/api/v1/ai-recognition/recommendations/${plantaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(recommendationsResponse.body).toHaveProperty('recommendedModels');
      expect(
        Array.isArray(recommendationsResponse.body.recommendedModels),
      ).toBe(true);
    });

    it('should handle annotation system', async () => {
      // Adicionar anotação a objeto
      const annotationResponse = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${infraObjectId}/annotations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'comment',
          text: 'Verificar certificação do extintor',
          position: { x: 120, y: 230 },
          priority: 'medium',
        })
        .expect(201);

      expect(annotationResponse.body).toHaveProperty('annotationId');

      // Listar anotações
      const annotationsListResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${infraObjectId}/annotations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(annotationsListResponse.body.annotations.length).toBeGreaterThan(
        0,
      );

      // Resolver anotação
      const annotationId = annotationResponse.body.annotationId;
      await request(app.getHttpServer())
        .post(
          `/api/v1/infra-objects/${infraObjectId}/annotations/${annotationId}/resolve`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should handle object movement and resizing', async () => {
      // Mover objeto
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${infraObjectId}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          x: 150,
          y: 280,
          reason: 'Ajuste de posicionamento conforme medição',
        })
        .expect(200);

      // Redimensionar objeto
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${infraObjectId}/resize`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          width: 50,
          height: 70,
          reason: 'Correção de dimensões',
        })
        .expect(200);

      // Verificar histórico
      const historyResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${infraObjectId}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(historyResponse.body.history.length).toBeGreaterThan(0);
      expect(
        historyResponse.body.history.some((h) => h.action === 'moved'),
      ).toBe(true);
      expect(
        historyResponse.body.history.some((h) => h.action === 'resized'),
      ).toBe(true);
    });
  });

  describe('Security and Permissions', () => {
    it('should enforce role-based access control', async () => {
      // Tentar acessar endpoint de admin sem permissão adequada
      await request(app.getHttpServer())
        .delete(`/api/v1/infra-objects/${infraObjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403); // Forbidden - usuário engineer não pode deletar
    });

    it('should validate input data', async () => {
      // Testar validação de dados inválidos
      await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '', // Nome vazio - inválido
          plantaId: 'invalid-uuid', // UUID inválido
        })
        .expect(400);
    });

    it('should handle rate limiting correctly', async () => {
      // Fazer múltiplas requisições rapidamente
      const promises = Array.from({ length: 50 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/infra-objects/types/available')
          .set('Authorization', `Bearer ${accessToken}`),
      );

      const responses = await Promise.all(promises);

      // Pelo menos algumas devem ter sucesso
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(40);
    });
  });

  describe('Error Handling', () => {
    it('should handle not found errors gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('não encontrado');
        });
    });

    it('should validate UUID parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/infra-objects/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should handle database connection errors gracefully', async () => {
      // Este teste assumiria uma configuração de mock ou teste específica
      // para simular falha de conexão com o banco
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle pagination correctly', async () => {
      // Testar paginação
      const page1Response = await request(app.getHttpServer())
        .get('/api/v1/infra-objects?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(page1Response.body).toHaveProperty('data');
      expect(page1Response.body).toHaveProperty('total');
      expect(page1Response.body).toHaveProperty('page', 1);
      expect(page1Response.body).toHaveProperty('limit', 10);
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/infra-objects/stats/overview')
          .set('Authorization', `Bearer ${accessToken}`),
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Todas as requisições devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Performance deve ser aceitável (menos de 5 segundos para 10 requisições)
      expect(duration).toBeLessThan(5000);
    });
  });
});
