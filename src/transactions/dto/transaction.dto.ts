export class TransactionDto {
    id: number;
    valor: number;
    pagador: string;
    recebedor: string;
    timestamp: string;
  }
  
  export class TransactionFilterDto {
    pagador?: string;
    recebedor?: string;
    dataInicio?: string;
    dataFim?: string;
  }
  
  export class TransactionStatsDto {
    totalTransactions: number;
    totalDuplicates: number;
    duplicatePercentage: number;
    uniqueTransactions: number;
    totalProcessingTime: string;
    readingTime: string;
    duplicateDetectionTime: string;
    persistenceTime: string;
  }