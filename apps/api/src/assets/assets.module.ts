import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { DataIngestionService } from './data-ingestion.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, DataIngestionService],
  exports: [DataIngestionService],
})
export class AssetsModule {}
