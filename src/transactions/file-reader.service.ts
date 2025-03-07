// src/transactions/file-reader.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { createReadStream } from 'fs';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { Transaction } from './interfaces/transaction.interface';

@Injectable()
export class FileReaderService {
  private readonly logger = new Logger(FileReaderService.name);

  /**
   * Lê um arquivo JSON de transações de forma otimizada usando streams
   * @param filePath Caminho para o arquivo JSON
   * @returns Promise com array de transações
   */
  readTransactionsFile(filePath: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      const transactions: Transaction[] = [];
      let transactionsCount = 0;
      
      // Criar um pipeline de stream para processar o arquivo grande de forma eficiente
      const pipeline = chain([
        createReadStream(filePath),
        parser(),
        streamArray(),
      ]);

      // Processar cada transação do stream
      pipeline.on('data', (data) => {
        transactions.push(data.value as Transaction);
        
        // Log a cada 100.000 transações para monitorar o progresso
        transactionsCount++;
        if (transactionsCount % 100000 === 0) {
          this.logger.log(`Processadas ${transactionsCount} transações...`);
        }
      });

      // Capturar erros
      pipeline.on('error', (err) => {
        this.logger.error(`Erro ao ler o arquivo: ${err.message}`);
        reject(err);
      });

      // Finalizar quando a leitura for concluída
      pipeline.on('end', () => {
        this.logger.log(`Leitura concluída. ${transactions.length} transações lidas.`);
        resolve(transactions);
      });
    });
  }
}