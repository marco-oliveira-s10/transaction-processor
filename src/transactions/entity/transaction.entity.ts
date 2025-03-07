// src/transactions/entities/transaction.entity.ts

import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @Index()
  valor: number;

  @Column()
  @Index()
  pagador: string;

  @Column()
  @Index()
  recebedor: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}