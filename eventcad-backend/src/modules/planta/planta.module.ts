import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantaService } from './planta.service';
import { PlantaController } from './planta.controller';
import { Planta } from './entities/planta.entity';
import { UploadModule } from '../upload/upload.module';

/**
 * Módulo de gestão de plantas técnicas do EventCAD+
 *
 * Funcionalidades incluídas:
 * - Upload especializado para plantas técnicas (DWG, IFC, PDF)
 * - Processamento de metadados CAD específicos
 * - Integração com IA para reconhecimento de objetos
 * - Validação de compliance técnico
 * - Versionamento especializado para plantas
 * - Análise de compatibilidade entre plantas
 * - Visualização 2D/3D preparada
 * - Relatórios técnicos especializados
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Planta]),
    UploadModule, // Import do módulo de upload para usar o UploadService
  ],
  controllers: [PlantaController],
  providers: [PlantaService],
  exports: [PlantaService, TypeOrmModule],
})
export class PlantaModule {}
