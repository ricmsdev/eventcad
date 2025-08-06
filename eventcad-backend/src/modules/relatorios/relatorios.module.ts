import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { ReportTemplate } from './entities/report-template.entity';
import { ReportExecution } from './entities/report-execution.entity';
import { ReportSchedule } from './entities/report-schedule.entity';
import { ReportExport } from './entities/report-export.entity';
import { ReportAnalytics } from './entities/report-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportTemplate,
      ReportExecution,
      ReportSchedule,
      ReportExport,
      ReportAnalytics,
    ]),
  ],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
  exports: [RelatoriosService],
})
export class RelatoriosModule {} 