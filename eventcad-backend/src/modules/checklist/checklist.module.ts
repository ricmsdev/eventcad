import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ChecklistExecution } from './entities/checklist-execution.entity';
import { ChecklistValidation } from './entities/checklist-validation.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Checklist,
      ChecklistItem,
      ChecklistTemplate,
      ChecklistExecution,
      ChecklistValidation,
    ]),
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {} 