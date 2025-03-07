export interface Transaction {
    id: number;
    valor: number;
    pagador: string;
    recebedor: string;
    timestamp: string;
  }
  
  export interface TransactionKey {
    valor: number;
    pagador: string;
    recebedor: string;
    timestamp: number;
  }