import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { Evento } from './entities/evento.entity';

/**
 * Módulo de gestão de eventos do EventCAD+
 *
 * Funcionalidades incluídas:
 * - CRUD completo de eventos
 * - Workflow e gestão de status
 * - Timeline e marcos
 * - Análise de riscos
 * - Gestão de documentos
 * - Compliance e aprovações
 * - Estatísticas e relatórios
 */
@Module({
  imports: [TypeOrmModule.forFeature([Evento])],
  controllers: [EventoController],
  providers: [EventoService],
  exports: [EventoService],
})
export class EventoModule {}
