// src/transactions/database.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { Transaction } from './interfaces/transaction.interface';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {}

  /**
   * Salva as transações no banco de dados em lotes para otimizar performance
   */
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    this.logger.log(`Iniciando inserção de ${transactions.length} transações no banco de dados...`);
    
    // Definir o tamanho do lote para inserção
    const BATCH_SIZE = 5000;
    const totalBatches = Math.ceil(transactions.length / BATCH_SIZE);
    
    // Inserir em lotes para melhor performance
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batchStart = now();
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
      
      // Obter o lote atual
      const transactionBatch = transactions.slice(i, i + BATCH_SIZE);
      
      // Converter as transações para entidades
      const entities = transactionBatch.map(transaction => {
        const entity = new TransactionEntity();
        entity.id = transaction.id;
        entity.valor = transaction.valor;
        entity.pagador = transaction.pagador;
        entity.recebedor = transaction.recebedor;
        entity.timestamp = new Date(transaction.timestamp);
        return entity;
      });
      
      // Inserir o lote no banco de dados
      await this.transactionRepository.save(entities);
      
      const batchTime = now() - batchStart;
      this.logger.log(`Lote ${currentBatch}/${totalBatches} inserido (${entities.length} transações) em ${batchTime.toFixed(2)}ms`);
    }
    
    this.logger.log('Todas as transações foram inseridas no banco de dados.');
  }
}