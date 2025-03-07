// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransactionsService } from './transactions/transactions.service';
import * as path from 'path';
import * as now from 'performance-now';

// Aumentar o limite de memória heap (opcional, depende do tamanho do arquivo)
// process.env.NODE_OPTIONS = '--max-old-space-size=4096';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Iniciando aplicação...');
  
  const appStart = now();
  const app = await NestFactory.createApplicationContext(AppModule);
  logger.log(`Aplicação iniciada em ${(now() - appStart).toFixed(2)}ms`);

  try {
    // Obter o serviço de transações
    const transactionsService = app.get(TransactionsService);
    
    // Definir o arquivo a ser processado
    // Para testes, usar o arquivo com 1k transações
    // Para a solução final, usar o arquivo com 1M transações
    const testFile = process.argv[2] === 'prod' 
      ? 'transacoes1m.json' 
      : 'transacoes1k.json';
    
    const filePath = path.join(process.cwd(), 'data', testFile);
    
    logger.log(`Modo: ${process.argv[2] === 'prod' ? 'Produção (1M registros)' : 'Teste (1k registros)'}`);
    logger.log(`Arquivo a ser processado: ${filePath}`);
    
    // Verificar se o arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    logger.log(`Tamanho do arquivo: ${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Processar as transações
    await transactionsService.processTransactions(filePath);
    
    logger.log('Processamento concluído com sucesso!');
  } catch (error) {
    logger.error(`Erro na execução: ${error.message}`);
    logger.error(error.stack);
  } finally {
    await app.close();
    process.exit(0);
  }
}

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  process.exit(1);
});

bootstrap();