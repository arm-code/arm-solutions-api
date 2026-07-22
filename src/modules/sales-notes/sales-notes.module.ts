import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { SalesNoteItem } from './entities/sales-note-item.entity';
import { SalesNote } from './entities/sales-note.entity';
import { SalesNotesController } from './sales-notes.controller';
import { SalesNotesService } from './sales-notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesNote, SalesNoteItem, BusinessEvent]),
  ],
  controllers: [SalesNotesController],
  providers: [SalesNotesService],
  exports: [SalesNotesService],
})
export class SalesNotesModule {}
