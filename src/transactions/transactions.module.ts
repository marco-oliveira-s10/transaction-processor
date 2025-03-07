// src/transactions/transactions.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { FileReaderService } from './file-reader.service';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { DatabaseService } from './database.service';
import { TransactionEntity } from './entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
  ],
  providers: [
    TransactionsService,
    FileReaderService,
    DuplicateDetectorService,
    DatabaseService,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}