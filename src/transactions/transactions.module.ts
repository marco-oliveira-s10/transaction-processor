import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { FileReaderService } from './file-reader.service';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { DatabaseService } from './database.service';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsController } from './transactions.controller';
import { MulterModule } from '@nestjs/platform-express';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    MulterModule.register({
      dest: './data',
    }),
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    FileReaderService,
    DuplicateDetectorService,
    DatabaseService,
    StatisticsService,
  ],
  exports: [TransactionsService, StatisticsService],
})
export class TransactionsModule {}