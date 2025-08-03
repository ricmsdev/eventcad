import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { File } from './entities/file.entity';
import {
  getMaxFileSize,
  FileCategory,
} from '../../common/enums/file-type.enum';

/**
 * Módulo de upload e gestão de arquivos do EventCAD+
 *
 * Funcionalidades incluídas:
 * - Upload seguro com validação
 * - Processamento de metadados
 * - Geração de thumbnails e previews
 * - Análise de segurança
 * - Versionamento de arquivos
 * - Controle de acesso e permissões
 * - Integração com storage externo
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([File]),

    // Configuração do Multer para upload
    MulterModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            // Diretório temporário para processamento
            const uploadPath = configService.get<string>(
              'UPLOAD_DESTINATION',
              './uploads',
            );
            cb(null, `${uploadPath}/temp`);
          },
          filename: (req, file, cb) => {
            // Nome temporário único
            const uniqueName = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.originalname}`;
            cb(null, uniqueName);
          },
        }),

        // Limites de upload
        limits: {
          fileSize: configService.get<number>('UPLOAD_MAX_SIZE', 104857600), // 100MB padrão
          files: 20, // Máximo 20 arquivos por upload múltiplo
          fields: 10, // Máximo 10 campos de formulário
          fieldSize: 1024 * 1024, // 1MB por campo
        },

        // Filtros de arquivo
        fileFilter: (req, file, cb) => {
          // Verificações básicas de segurança
          const forbiddenExtensions = [
            '.exe',
            '.bat',
            '.cmd',
            '.com',
            '.scr',
            '.pif',
            '.vbs',
            '.js',
            '.jar',
            '.msi',
            '.dll',
            '.sys',
            '.php',
            '.asp',
            '.jsp',
            '.py',
            '.rb',
            '.pl',
          ];

          const fileExtension = path.extname(file.originalname).toLowerCase();

          if (forbiddenExtensions.includes(fileExtension)) {
            cb(
              new Error(`Tipo de arquivo não permitido: ${fileExtension}`),
              false,
            );
            return;
          }

          // Verificar MIME type básico
          if (
            !file.mimetype ||
            file.mimetype.includes('application/x-msdownload')
          ) {
            cb(new Error('Tipo MIME suspeito detectado'), false);
            return;
          }

          cb(null, true);
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
