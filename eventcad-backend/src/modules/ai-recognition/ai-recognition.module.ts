import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIRecognitionService } from './ai-recognition.service';
import { AIRecognitionController } from './ai-recognition.controller';
import { AIJob } from './entities/ai-job.entity';
import { Planta } from '../planta/entities/planta.entity';

/**
 * Módulo de AI Recognition do EventCAD+
 *
 * Funcionalidades incluídas:
 * - Gestão de jobs de processamento de IA
 * - Integração com serviços externos Python/FastAPI
 * - Queue de processamento assíncrono com retry
 * - Suporte a 15+ modelos de IA especializados
 * - Monitoramento em tempo real
 * - Relatórios e analytics avançados
 * - Sistema de prioridades e agendamento
 * - Webhook e callbacks para notificações
 *
 * Modelos suportados:
 * - YOLO v8 (geral e especializado CAD)
 * - Detectron2 (Facebook e especializado)
 * - OCR (Tesseract, PaddleOCR, EasyOCR)
 * - Analisadores especializados (Fire Safety, Electrical, etc.)
 * - Parser CAD nativo
 * - Compliance automático
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AIJob, Planta]),
    ConfigModule, // Para configurações de serviços externos
  ],
  controllers: [AIRecognitionController],
  providers: [AIRecognitionService],
  exports: [AIRecognitionService],
})
export class AIRecognitionModule {}
