import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryCategoriesController } from './controllers/inventory-categories.controller';
import { InventoryItemsController } from './controllers/inventory-items.controller';
import { InventoryLocationsController } from './controllers/inventory-locations.controller';
import { InventoryMovementsController } from './controllers/inventory-movements.controller';
import { InventoryCategory } from './entities/inventory-category.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryItemSerial } from './entities/inventory-item-serial.entity';
import { InventoryLocation } from './entities/inventory-location.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryCategoriesService } from './services/inventory-categories.service';
import { InventoryItemsService } from './services/inventory-items.service';
import { InventoryLocationsService } from './services/inventory-locations.service';
import { InventoryMovementsService } from './services/inventory-movements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryCategory,
      InventoryItem,
      InventoryItemSerial,
      InventoryLocation,
      InventoryMovement,
    ]),
  ],
  controllers: [
    InventoryCategoriesController,
    InventoryItemsController,
    InventoryLocationsController,
    InventoryMovementsController,
  ],
  providers: [
    InventoryCategoriesService,
    InventoryItemsService,
    InventoryLocationsService,
    InventoryMovementsService,
  ],
  exports: [InventoryItemsService],
})
export class InventoryModule {}
