import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfraObjectService } from './infra-object.service';
import { InfraObjectController } from './infra-object.controller';
import { InfraObject } from './entities/infra-object.entity';
import { Planta } from '../planta/entities/planta.entity';

/**
 * Módulo de Objetos de Infraestrutura do EventCAD+
 *
 * Funcionalidades incluídas:
 * - CRUD completo de objetos detectados pela IA ou criados manualmente
 * - Sistema avançado de revisão e aprovação por engenheiros
 * - Edição interativa de geometria e propriedades
 * - Validação técnica especializada por tipo de objeto
 * - Detecção automática de conflitos e duplicatas
 * - Sistema de anotações e comentários colaborativos
 * - Analytics avançados e relatórios de qualidade
 * - Integração nativa com resultados de IA
 * - Classificação por criticidade de segurança
 *
 * Tipos de objetos suportados:
 * - Arquitetônicos (portas, janelas, paredes, escadas, elevadores)
 * - Segurança contra incêndio (extintores, saídas, sprinklers, detectores)
 * - Instalações elétricas (tomadas, interruptores, quadros, luminárias)
 * - Instalações hidráulicas (vasos, pias, chuveiros, ralos)
 * - Acessibilidade (rampas, vagas PCD, barras de apoio, piso tátil)
 * - Mobiliário e equipamentos (mesas, cadeiras, palcos, stands)
 * - Dimensões e anotações (cotas, etiquetas, números de ambiente)
 *
 * Sistema de validação:
 * - Validação visual (verificação de existência)
 * - Validação dimensional (medidas e proporções)
 * - Validação técnica (especificações e normas)
 * - Validação de compliance (conformidade regulatória)
 * - Validação estrutural (aspectos estruturais)
 * - Validação elétrica (instalações elétricas)
 * - Validação de segurança (proteção contra incêndio)
 */
@Module({
  imports: [TypeOrmModule.forFeature([InfraObject, Planta])],
  controllers: [InfraObjectController],
  providers: [InfraObjectService],
  exports: [InfraObjectService],
})
export class InfraObjectModule {}
