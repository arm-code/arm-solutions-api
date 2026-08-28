import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesNote } from '../sales-notes/entities/sales-note.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BusinessEvent } from './entities/business-event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEvent, Transaction, SalesNote])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
