export interface ValueDistribution {
    range: string;
    count: number;
    percentage: number;
  }
  
  export interface TimestampDistribution {
    hour: number;
    count: number;
    percentage: number;
  }
  
  export interface TransactionStats {
    totalTransactions: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    totalValue: number;
    uniquePagadores: number;
    uniqueRecebedores: number;
  }
  
  export interface UnusualPatterns {
    frequentPagadores: any[];
    highValueTransactions: any[];
    avgValue: number;
    highValueThreshold: number;
  }