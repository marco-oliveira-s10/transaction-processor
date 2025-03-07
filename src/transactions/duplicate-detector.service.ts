import { Injectable, Logger } from '@nestjs/common';
import { Transaction, TransactionKey } from './interfaces/transaction.interface';

@Injectable()
export class DuplicateDetectorService {
  private readonly logger = new Logger(DuplicateDetectorService.name);
  private readonly MAX_TIME_DIFF_MS = 10 * 1000; // 10 segundos em milissegundos

  /**
   * Detecta e filtra transações duplicadas com base nos critérios:
   * - Mesmo valor
   * - Mesmo pagador e recebedor
   * - Diferença de tempo de no máximo 10 segundos
   */
  filterDuplicates(transactions: Transaction[]): Transaction[] {
    this.logger.log(`Iniciando detecção de duplicatas em ${transactions.length} transações...`);
    
    // Para otimizar a busca por duplicatas, usamos um Map
    // A chave será uma string composta por valor + pagador + recebedor
    // O valor será um array de timestamps das transações com essa combinação
    const transactionMap = new Map<string, { transaction: Transaction, timestamp: number }[]>();
    
    // Resultado final (transações não duplicadas)
    const uniqueTransactions: Transaction[] = [];
    
    // Contador de duplicatas
    let duplicatesCount = 0;
    let processedCount = 0;
    
    // Ordenar transações por timestamp para otimizar a detecção de duplicatas
    // Isso permite que possamos parar de verificar quando a diferença de tempo for maior que 10 segundos
    transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Processar cada transação
    for (const transaction of transactions) {
      processedCount++;
      if (processedCount % 100000 === 0) {
        this.logger.log(`Processadas ${processedCount} transações para detecção de duplicatas...`);
      }
      
      // Criar a chave para o Map
      const key = `${transaction.valor}_${transaction.pagador}_${transaction.recebedor}`;
      
      // Converter a data para timestamp
      const timestamp = new Date(transaction.timestamp).getTime();
      
      // Se não existir entrada para essa chave, criar uma
      if (!transactionMap.has(key)) {
        transactionMap.set(key, [{ transaction, timestamp }]);
        uniqueTransactions.push(transaction);
        continue;
      }
      
      // Verificar se há transações com a mesma chave e timestamp próximo
      const similarTransactions = transactionMap.get(key);
      let isDuplicate = false;
      
      for (const { timestamp: existingTimestamp } of similarTransactions) {
        const timeDiff = Math.abs(timestamp - existingTimestamp);
        
        // Se a diferença de tempo for menor que 10 segundos, é duplicata
        if (timeDiff <= this.MAX_TIME_DIFF_MS) {
          isDuplicate = true;
          duplicatesCount++;
          break;
        }
      }
      
      // Se não for duplicata, adicionar à lista de transações únicas
      if (!isDuplicate) {
        similarTransactions.push({ transaction, timestamp });
        uniqueTransactions.push(transaction);
      }
      
      // Limpeza periódica para evitar consumo excessivo de memória
      // Remove entradas que estão fora da janela de 10 segundos
      if (processedCount % 10000 === 0) {
        this.cleanupOldEntries(transactionMap, timestamp);
      }
    }
    
    this.logger.log(`Detecção concluída. ${duplicatesCount} duplicatas encontradas.`);
    this.logger.log(`Transações únicas: ${uniqueTransactions.length}`);
    
    return uniqueTransactions;
  }
  
  /**
   * Remove entradas antigas do Map para evitar consumo excessivo de memória
   * Mantém apenas transações que estão dentro da janela de tempo relevante
   */
  private cleanupOldEntries(transactionMap: Map<string, { transaction: Transaction, timestamp: number }[]>, currentTimestamp: number): void {
    // Define um limite de tempo para manter as transações (10 segundos antes do timestamp atual)
    const cutoffTime = currentTimestamp - this.MAX_TIME_DIFF_MS;
    
    // Percorre o Map e remove entradas antigas
    for (const [key, entries] of transactionMap.entries()) {
      // Filtra apenas as entradas recentes
      const recentEntries = entries.filter(entry => entry.timestamp >= cutoffTime);
      
      // Se todas as entradas são antigas, remove a chave completamente
      if (recentEntries.length === 0) {
        transactionMap.delete(key);
      } else if (recentEntries.length < entries.length) {
        // Se algumas entradas são antigas, atualiza a lista
        transactionMap.set(key, recentEntries);
      }
    }
  }
}