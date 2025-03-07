import { Injectable, Logger } from '@nestjs/common';
import { FileReaderService } from './file-reader.service';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { DatabaseService } from './database.service';

// Importação modificada para usar require
const now = require('performance-now');

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly fileReaderService: FileReaderService,
    private readonly duplicateDetectorService: DuplicateDetectorService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Processa o arquivo de transações, detecta duplicatas e salva no banco de dados
   * @param filePath Caminho para o arquivo JSON
   */
  async processTransactions(filePath: string): Promise<void> {
    try {
      // Iniciar cronômetro
      const startTime = now();
      this.logger.log(`Iniciando processamento do arquivo: ${filePath}`);
      
      // Imprimir informações sobre a memória
      this.logMemoryUsage('Início do processamento');

      // Leitura do arquivo
      const readStart = now();
      const transactions = await this.fileReaderService.readTransactionsFile(filePath);
      const readTime = now() - readStart;
      this.logger.log(`Leitura concluída em ${this.formatTime(readTime)}`);
      this.logMemoryUsage('Após leitura do arquivo');

      // Detecção de duplicatas
      const detectStart = now();
      const uniqueTransactions = this.duplicateDetectorService.filterDuplicates(transactions);
      const detectTime = now() - detectStart;
      this.logger.log(`Filtragem de duplicatas concluída em ${this.formatTime(detectTime)}`);
      this.logMemoryUsage('Após detecção de duplicatas');

      // Salvamento no banco de dados
      const saveStart = now();
      await this.databaseService.saveTransactions(uniqueTransactions);
      const saveTime = now() - saveStart;
      this.logger.log(`Salvamento no banco de dados concluído em ${this.formatTime(saveTime)}`);
      this.logMemoryUsage('Após salvamento no banco');

      // Tempo total
      const totalTime = now() - startTime;
      this.logger.log('=================================');
      this.logger.log(`Processamento concluído em ${this.formatTime(totalTime)}`);
      this.logger.log(`Total de transações processadas: ${transactions.length}`);
      this.logger.log(`Total de transações únicas: ${uniqueTransactions.length}`);
      this.logger.log(`Total de duplicatas: ${transactions.length - uniqueTransactions.length}`);
      this.logger.log(`Taxa de duplicação: ${((transactions.length - uniqueTransactions.length) / transactions.length * 100).toFixed(2)}%`);
      this.logger.log('=================================');
      this.logger.log('Detalhamento do tempo de execução:');
      this.logger.log(`- Leitura do arquivo: ${this.formatTime(readTime)} (${((readTime / totalTime) * 100).toFixed(2)}%)`);
      this.logger.log(`- Detecção de duplicatas: ${this.formatTime(detectTime)} (${((detectTime / totalTime) * 100).toFixed(2)}%)`);
      this.logger.log(`- Salvamento no banco: ${this.formatTime(saveTime)} (${((saveTime / totalTime) * 100).toFixed(2)}%)`);
    } catch (error) {
      this.logger.error(`Erro durante o processamento: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }
  
  /**
   * Formata o tempo de acordo com a magnitude (ms, s, min)
   */
  private formatTime(timeInMs: number): string {
    if (timeInMs < 1000) {
      return `${timeInMs.toFixed(2)}ms`;
    } else if (timeInMs < 60000) {
      return `${(timeInMs / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(timeInMs / 60000);
      const seconds = ((timeInMs % 60000) / 1000).toFixed(2);
      return `${minutes}min ${seconds}s`;
    }
  }
  
  /**
   * Log da utilização de memória
   */
  private logMemoryUsage(label: string): void {
    const used = process.memoryUsage();
    this.logger.log(`Memória (${label}): ${Math.round(used.rss / 1024 / 1024)} MB`);
  }
}