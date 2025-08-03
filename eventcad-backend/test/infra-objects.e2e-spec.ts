import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  InfraObjectStatus,
  SafetyCriticality,
} from '../src/common/enums/infra-object.enum';

/**
 * Testes E2E específicos para o módulo InfraObject
 *
 * Cobertura completa:
 * - CRUD de objetos de infraestrutura
 * - Sistema de validação técnica
 * - Edição interativa (mover, redimensionar)
 * - Sistema de anotações
 * - Análise de conflitos
 * - Relatórios e analytics
 * - Fluxos de aprovação
 */
describe('Infrastructure Objects (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  let plantaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Autenticar usuário de teste
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'infratest@eventcad.com',
        password: 'Test123!@#',
        name: 'Infra Test User',
        role: 'engineer',
      });

    accessToken = authResponse.body.access_token;
    tenantId = authResponse.body.user.tenantId;

    // Criar planta de teste
    const plantaResponse = await request(app.getHttpServer())
      .post('/api/v1/plantas/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('plantaTipo', 'planta_baixa')
      .field('description', 'Planta para testes de objetos')
      .attach('file', Buffer.from('mock-dwg-content'), {
        filename: 'test-planta.dwg',
        contentType: 'application/octet-stream',
      });

    plantaId = plantaResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Object Creation and Management', () => {
    let fireExtinguisherId: string;
    let emergencyExitId: string;
    let electricalOutletId: string;

    it('should create fire safety objects with critical classification', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Extintor CO2 001',
          description: 'Extintor de CO2 localizado na entrada principal',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'FIRE_EXTINGUISHER',
          source: 'ai_detection',
          geometry: {
            boundingBox: { x: 100, y: 100, width: 30, height: 50 },
            center: { x: 115, y: 125 },
            rotation: 0,
          },
          properties: {
            type: 'CO2',
            capacity: '5kg',
            pressure: '60bar',
            expiry_date: '2026-03-15',
            certification: 'INMETRO',
          },
          confidence: 0.92,
          criticality: 'critical',
          requiredValidations: ['fire_safety', 'compliance', 'technical'],
        })
        .expect(201);

      fireExtinguisherId = response.body.id;

      expect(response.body.name).toBe('Extintor CO2 001');
      expect(response.body.objectCategory).toBe('FIRE_SAFETY');
      expect(response.body.objectType).toBe('FIRE_EXTINGUISHER');
      expect(response.body.status).toBe(InfraObjectStatus.PENDING_REVIEW);
      expect(response.body.criticality).toBe(SafetyCriticality.CRITICAL);
      expect(response.body.requiresReview).toBe(true);
      expect(response.body.confidence).toBe(0.92);
      expect(response.body.qualityScore).toBeGreaterThan(0);
    });

    it('should create emergency exit with high criticality', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Saída de Emergência Norte',
          description: 'Saída de emergência principal - lado norte',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'EMERGENCY_EXIT',
          source: 'manual_creation',
          geometry: {
            boundingBox: { x: 300, y: 50, width: 120, height: 20 },
            center: { x: 360, y: 60 },
            rotation: 0,
          },
          properties: {
            width: 1.2,
            height: 2.1,
            capacity: 500,
            illuminated: true,
            panic_bar: true,
            exit_sign: true,
          },
          criticality: 'critical',
          requiredValidations: ['fire_safety', 'compliance', 'dimensional'],
        })
        .expect(201);

      emergencyExitId = response.body.id;

      expect(response.body.objectType).toBe('EMERGENCY_EXIT');
      expect(response.body.properties.panic_bar).toBe(true);
      expect(response.body.requiresReview).toBe(true);
    });

    it('should create electrical outlet with medium criticality', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Tomada 220V - Stand 15',
          description: 'Tomada para equipamentos do stand 15',
          plantaId: plantaId,
          objectCategory: 'ELECTRICAL',
          objectType: 'OUTLET',
          source: 'manual_creation',
          geometry: {
            boundingBox: { x: 500, y: 200, width: 10, height: 10 },
            center: { x: 505, y: 205 },
          },
          properties: {
            voltage: 220,
            amperage: 16,
            type: 'industrial',
            grounded: true,
            gfci: false,
          },
          confidence: 1.0,
          criticality: 'medium',
          requiredValidations: ['electrical', 'compliance'],
        })
        .expect(201);

      electricalOutletId = response.body.id;

      expect(response.body.objectType).toBe('OUTLET');
      expect(response.body.criticality).toBe('medium');
      expect(response.body.properties.voltage).toBe(220);
    });

    it('should list objects with advanced filtering', async () => {
      // Busca por categoria
      const fireObjectsResponse = await request(app.getHttpServer())
        .get('/api/v1/infra-objects')
        .query({
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          criticality: 'critical',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(fireObjectsResponse.body.data.length).toBe(2);
      expect(fireObjectsResponse.body.total).toBe(2);

      // Busca por status
      const pendingResponse = await request(app.getHttpServer())
        .get('/api/v1/infra-objects')
        .query({
          plantaId: plantaId,
          status: 'pending_review',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(pendingResponse.body.data.length).toBe(3);

      // Busca por objetos que precisam de atenção
      const attentionResponse = await request(app.getHttpServer())
        .get('/api/v1/infra-objects')
        .query({
          plantaId: plantaId,
          needsAttention: true,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(attentionResponse.body.data.length).toBeGreaterThan(0);
    });

    it('should update object properties', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/infra-objects/${fireExtinguisherId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Extintor de CO2 - Atualizado após inspeção',
          properties: {
            type: 'CO2',
            capacity: '5kg',
            pressure: '58bar', // Pressão atualizada
            expiry_date: '2026-03-15',
            certification: 'INMETRO',
            last_inspection: '2025-01-15',
            inspector: 'João Silva - CREA 12345',
          },
        })
        .expect(200);

      expect(response.body.description).toContain('Atualizado após inspeção');
      expect(response.body.properties.pressure).toBe('58bar');
      expect(response.body.properties.last_inspection).toBe('2025-01-15');
    });
  });

  describe('Interactive Editing', () => {
    let objectId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Mesa de Controle',
          plantaId: plantaId,
          objectCategory: 'FURNITURE',
          objectType: 'TABLE',
          geometry: {
            boundingBox: { x: 200, y: 300, width: 100, height: 60 },
            center: { x: 250, y: 330 },
          },
          properties: {
            material: 'madeira',
            capacity: 4,
          },
        });

      objectId = response.body.id;
    });

    it('should move object to new position', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${objectId}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          x: 300,
          y: 400,
          reason: 'Reposicionamento conforme layout atualizado',
        })
        .expect(200);

      expect(response.body.geometry.center.x).toBe(300);
      expect(response.body.geometry.center.y).toBe(400);
      expect(response.body.geometry.boundingBox.x).toBe(250); // 300 - 50 (metade da largura)
      expect(response.body.geometry.boundingBox.y).toBe(370); // 400 - 30 (metade da altura)
    });

    it('should resize object dimensions', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${objectId}/resize`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          width: 120,
          height: 80,
          reason: 'Ajuste para acomodar mais equipamentos',
        })
        .expect(200);

      expect(response.body.geometry.boundingBox.width).toBe(120);
      expect(response.body.geometry.boundingBox.height).toBe(80);
    });

    it('should track modification history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${objectId}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.history.length).toBeGreaterThan(0);

      const movements = response.body.history.filter(
        (h) => h.action === 'moved',
      );
      const resizes = response.body.history.filter(
        (h) => h.action === 'resized',
      );

      expect(movements.length).toBe(1);
      expect(resizes.length).toBe(1);

      expect(movements[0].reason).toBe(
        'Reposicionamento conforme layout atualizado',
      );
      expect(resizes[0].reason).toBe('Ajuste para acomodar mais equipamentos');
    });
  });

  describe('Annotation System', () => {
    let objectId: string;
    let annotationId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Hidrante 001',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'HYDRANT',
          geometry: {
            boundingBox: { x: 400, y: 400, width: 50, height: 50 },
            center: { x: 425, y: 425 },
          },
          criticality: 'critical',
        });

      objectId = response.body.id;
    });

    it('should add comment annotation', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${objectId}/annotations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'comment',
          text: 'Verificar pressão da rede antes da aprovação final',
          position: { x: 425, y: 425 },
          priority: 'high',
        })
        .expect(201);

      annotationId = response.body.annotationId;
      expect(response.body.object.annotations.length).toBe(1);
    });

    it('should add issue annotation', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${objectId}/annotations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'issue',
          text: 'Falta de sinalização adequada conforme NBR 13434',
          priority: 'critical',
        })
        .expect(201);
    });

    it('should list all annotations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${objectId}/annotations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.annotations.length).toBe(2);
      expect(response.body.annotations[0].type).toBe('comment');
      expect(response.body.annotations[1].type).toBe('issue');
    });

    it('should resolve annotation', async () => {
      const response = await request(app.getHttpServer())
        .post(
          `/api/v1/infra-objects/${objectId}/annotations/${annotationId}/resolve`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const resolvedAnnotation = response.body.annotations.find(
        (a) => a.id === annotationId,
      );
      expect(resolvedAnnotation.resolved).toBe(true);
      expect(resolvedAnnotation.resolvedAt).toBeDefined();
    });

    it('should filter annotations by status', async () => {
      // Não resolvidas
      const unresolvedResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${objectId}/annotations`)
        .query({ resolved: false })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(unresolvedResponse.body.annotations.length).toBe(1);

      // Resolvidas
      const resolvedResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${objectId}/annotations`)
        .query({ resolved: true })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(resolvedResponse.body.annotations.length).toBe(1);
    });
  });

  describe('Technical Validation System', () => {
    let criticalObjectId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Sistema Sprinkler Zona A',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'SPRINKLER',
          geometry: {
            boundingBox: { x: 100, y: 500, width: 20, height: 20 },
            center: { x: 110, y: 510 },
          },
          properties: {
            type: 'wet_pipe',
            coverage_area: 12,
            pressure: '1.2bar',
            temperature_rating: '68°C',
          },
          criticality: 'critical',
          requiredValidations: ['fire_safety', 'technical', 'compliance'],
        });

      criticalObjectId = response.body.id;
    });

    it('should perform fire safety validation', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${criticalObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'fire_safety',
          status: 'passed',
          notes:
            'Sistema sprinkler em conformidade com NFPA 13. Pressão adequada, cobertura conforme projeto.',
          score: 95,
          attachments: ['sprinkler_test_report.pdf', 'pressure_test.jpg'],
        })
        .expect(201);

      expect(response.body.validationResults.length).toBe(1);
      expect(response.body.validationResults[0].type).toBe('fire_safety');
      expect(response.body.validationResults[0].status).toBe('passed');
      expect(response.body.validationResults[0].score).toBe(95);
    });

    it('should perform technical validation', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${criticalObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'technical',
          status: 'passed',
          notes:
            'Especificações técnicas aprovadas. Temperatura de ativação adequada para o ambiente.',
          score: 90,
        })
        .expect(201);
    });

    it('should perform compliance validation', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${criticalObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'compliance',
          status: 'passed',
          notes: 'Conforme NBR 10897 e IT 23/2019. Documentação completa.',
          score: 98,
        })
        .expect(201);
    });

    it('should automatically approve after all validations pass', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${criticalObjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.validationResults.length).toBe(3);
      expect(response.body.manuallyValidated).toBe(true);
      expect(response.body.status).toBe('approved');
      expect(response.body.qualityScore).toBeGreaterThan(90);
    });

    it('should show validation summary', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${criticalObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.validationStatus.total).toBe(3);
      expect(response.body.validationStatus.completed).toBe(3);
      expect(response.body.validationStatus.passed).toBe(3);
      expect(response.body.validationStatus.failed).toBe(0);
      expect(response.body.qualityScore).toBeGreaterThan(90);
    });
  });

  describe('Conflict Analysis', () => {
    let duplicateId1: string;
    let duplicateId2: string;
    let overlapId1: string;
    let overlapId2: string;

    beforeAll(async () => {
      // Criar objetos duplicados
      const duplicate1Response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Extintor PQS A001',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'FIRE_EXTINGUISHER',
          geometry: {
            boundingBox: { x: 600, y: 100, width: 30, height: 50 },
            center: { x: 615, y: 125 },
          },
          confidence: 0.85,
        });

      const duplicate2Response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Extintor PQS A002',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'FIRE_EXTINGUISHER',
          geometry: {
            boundingBox: { x: 605, y: 105, width: 30, height: 50 },
            center: { x: 620, y: 130 }, // Muito próximo
          },
          confidence: 0.75,
        });

      duplicateId1 = duplicate1Response.body.id;
      duplicateId2 = duplicate2Response.body.id;

      // Criar objetos sobrepostos
      const overlap1Response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Mesa Redonda 01',
          plantaId: plantaId,
          objectCategory: 'FURNITURE',
          objectType: 'TABLE',
          geometry: {
            boundingBox: { x: 700, y: 200, width: 80, height: 80 },
            center: { x: 740, y: 240 },
          },
        });

      const overlap2Response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Cadeiras Mesa 01',
          plantaId: plantaId,
          objectCategory: 'FURNITURE',
          objectType: 'CHAIR',
          geometry: {
            boundingBox: { x: 720, y: 220, width: 60, height: 60 },
            center: { x: 750, y: 250 }, // Sobrepõe parcialmente
          },
        });

      overlapId1 = overlap1Response.body.id;
      overlapId2 = overlap2Response.body.id;
    });

    it('should detect duplicate objects', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects/analyze-conflicts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          conflictTypes: ['duplicate'],
          overlapTolerance: 10,
          autoResolve: false,
        })
        .expect(200);

      expect(response.body.conflicts.length).toBeGreaterThan(0);

      const duplicateConflict = response.body.conflicts.find(
        (c) => c.type === 'duplicate',
      );
      expect(duplicateConflict).toBeDefined();
      expect(duplicateConflict.conflictingObjectIds).toContain(duplicateId1);
      expect(duplicateConflict.conflictingObjectIds).toContain(duplicateId2);
      expect(duplicateConflict.autoResolvable).toBe(true); // Confiança < 0.8
    });

    it('should detect overlapping objects', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects/analyze-conflicts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          conflictTypes: ['overlap'],
          overlapTolerance: 5,
          autoResolve: false,
        })
        .expect(200);

      const overlapConflict = response.body.conflicts.find(
        (c) => c.type === 'overlap',
      );
      expect(overlapConflict).toBeDefined();
      expect(overlapConflict.conflictingObjectIds).toContain(overlapId1);
      expect(overlapConflict.conflictingObjectIds).toContain(overlapId2);
      expect(overlapConflict.autoResolvable).toBe(false);
    });

    it('should auto-resolve simple conflicts', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects/analyze-conflicts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          conflictTypes: ['duplicate'],
          autoResolve: true,
        })
        .expect(200);

      expect(response.body.autoResolved).toBeGreaterThan(0);
      expect(response.body.requiresManualReview).toBeGreaterThanOrEqual(0);

      // Verificar que objeto com menor confiança foi removido
      await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${duplicateId2}`) // Menor confiança
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Deve ter sido marcado como inativo
    });
  });

  describe('Analytics and Reports', () => {
    it('should provide statistics overview', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/infra-objects/stats/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('byCategory');
      expect(response.body).toHaveProperty('byCriticality');
      expect(response.body).toHaveProperty('needingReview');
      expect(response.body).toHaveProperty('manuallyValidated');
      expect(response.body).toHaveProperty('avgQualityScore');
      expect(response.body).toHaveProperty('validationRate');

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.avgQualityScore).toBeGreaterThan(0);
    });

    it('should provide filtered statistics by planta', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/infra-objects/stats/overview')
        .query({ plantaId: plantaId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should provide dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/infra-objects/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('needingReview');
      expect(response.body).toHaveProperty('recent');
      expect(response.body).toHaveProperty('critical');
      expect(response.body).toHaveProperty('alerts');

      expect(response.body.alerts).toHaveProperty('pendingValidation');
      expect(response.body.alerts).toHaveProperty('withConflicts');
      expect(response.body.alerts).toHaveProperty('lowQuality');
      expect(response.body.alerts).toHaveProperty('criticalUnvalidated');
    });

    it('should generate comprehensive report', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects/reports/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          categories: ['FIRE_SAFETY', 'ELECTRICAL'],
          statuses: ['approved', 'pending_review'],
          includeDetails: true,
          includeQualityAnalysis: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('byCategory');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('qualityAnalysis');

      expect(response.body.summary.totalObjects).toBeGreaterThan(0);
      expect(response.body.qualityAnalysis).toHaveProperty(
        'qualityDistribution',
      );
      expect(response.body.qualityAnalysis).toHaveProperty('recommendations');
    });
  });

  describe('Available Types and Categories', () => {
    it('should provide all available object types', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/infra-objects/types/available')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ARCHITECTURAL');
      expect(response.body).toHaveProperty('FIRE_SAFETY');
      expect(response.body).toHaveProperty('ELECTRICAL');
      expect(response.body).toHaveProperty('PLUMBING');
      expect(response.body).toHaveProperty('ACCESSIBILITY');
      expect(response.body).toHaveProperty('FURNITURE');
      expect(response.body).toHaveProperty('ANNOTATIONS');

      // Verificar estrutura de cada categoria
      const fireSafety = response.body.FIRE_SAFETY;
      expect(Array.isArray(fireSafety)).toBe(true);
      expect(fireSafety.length).toBeGreaterThan(0);

      const fireExtinguisher = fireSafety.find(
        (type) => type.type === 'FIRE_EXTINGUISHER',
      );
      expect(fireExtinguisher).toBeDefined();
      expect(fireExtinguisher).toHaveProperty('name');
      expect(fireExtinguisher).toHaveProperty('icon');
      expect(fireExtinguisher).toHaveProperty('criticality');
      expect(fireExtinguisher).toHaveProperty('validations');
      expect(fireExtinguisher).toHaveProperty('properties');
    });
  });

  describe('Objects by Planta', () => {
    it('should list all objects from specific planta', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/planta/${plantaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);

      // Todos os objetos devem ser da planta especificada
      response.body.data.forEach((obj) => {
        expect(obj.plantaId).toBe(plantaId);
      });
    });

    it('should filter objects by planta with additional filters', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/planta/${plantaId}`)
        .query({
          criticality: 'critical',
          status: 'approved',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.data.forEach((obj) => {
        expect(obj.plantaId).toBe(plantaId);
        expect(obj.criticality).toBe('critical');
        expect(obj.status).toBe('approved');
      });
    });
  });

  describe('Approval Workflow', () => {
    let workflowObjectId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Detector de Fumaça 001',
          plantaId: plantaId,
          objectCategory: 'FIRE_SAFETY',
          objectType: 'SMOKE_DETECTOR',
          geometry: {
            boundingBox: { x: 800, y: 300, width: 15, height: 15 },
            center: { x: 808, y: 308 },
          },
          properties: {
            type: 'photoelectric',
            sensitivity: 'high',
            coverage_area: 60,
            battery_level: 100,
          },
          confidence: 0.88,
          criticality: 'critical',
          requiredValidations: ['fire_safety', 'technical'],
        });

      workflowObjectId = response.body.id;
    });

    it('should complete validation workflow', async () => {
      // 1. Verificar status inicial
      let objectResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${workflowObjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(objectResponse.body.status).toBe('pending_review');
      expect(objectResponse.body.requiresReview).toBe(true);

      // 2. Adicionar primeira validação
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${workflowObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'fire_safety',
          status: 'passed',
          notes: 'Detector em conformidade com normas de segurança',
          score: 92,
        })
        .expect(201);

      // 3. Verificar que ainda não foi aprovado (falta validação técnica)
      objectResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${workflowObjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(objectResponse.body.status).toBe('pending_review');
      expect(objectResponse.body.manuallyValidated).toBe(false);

      // 4. Adicionar segunda validação
      await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${workflowObjectId}/validations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'technical',
          status: 'passed',
          notes: 'Especificações técnicas adequadas',
          score: 88,
        })
        .expect(201);

      // 5. Verificar aprovação automática
      objectResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${workflowObjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(objectResponse.body.status).toBe('approved');
      expect(objectResponse.body.manuallyValidated).toBe(true);
      expect(objectResponse.body.validatedAt).toBeDefined();
    });

    it('should handle manual approval override', async () => {
      // Criar objeto sem todas as validações necessárias
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Objeto para Aprovação Manual',
          plantaId: plantaId,
          objectCategory: 'FURNITURE',
          objectType: 'CHAIR',
          geometry: {
            boundingBox: { x: 900, y: 400, width: 40, height: 40 },
            center: { x: 920, y: 420 },
          },
          criticality: 'low',
        });

      const objectId = response.body.id;

      // Aprovar manualmente
      const approvalResponse = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${objectId}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(approvalResponse.body.status).toBe('approved');
      expect(approvalResponse.body.manuallyValidated).toBe(true);
    });

    it('should handle object rejection', async () => {
      // Criar objeto para rejeição
      const response = await request(app.getHttpServer())
        .post('/api/v1/infra-objects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Objeto para Rejeição',
          plantaId: plantaId,
          objectCategory: 'ANNOTATIONS',
          objectType: 'TEXT_LABEL',
          geometry: {
            boundingBox: { x: 1000, y: 500, width: 50, height: 20 },
            center: { x: 1025, y: 510 },
          },
          confidence: 0.3, // Baixa confiança
        });

      const objectId = response.body.id;

      // Rejeitar objeto
      const rejectionResponse = await request(app.getHttpServer())
        .post(`/api/v1/infra-objects/${objectId}/reject`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reason: 'Confiança muito baixa, provável falso positivo',
        })
        .expect(200);

      expect(rejectionResponse.body.status).toBe('rejected');

      // Verificar histórico
      const historyResponse = await request(app.getHttpServer())
        .get(`/api/v1/infra-objects/${objectId}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const rejectionHistory = historyResponse.body.history.find(
        (h) => h.action === 'status_changed',
      );
      expect(rejectionHistory.reason).toBe(
        'Confiança muito baixa, provável falso positivo',
      );
    });
  });
});
