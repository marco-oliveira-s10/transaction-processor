import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TransactionEntity } from '../transactions/entities/transaction.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'transaction_processor',
  entities: [TransactionEntity],
  synchronize: true, // Apenas para desenvolvimento
  logging: process.env.NODE_ENV === 'development',
  // Configurações de performance
  connectTimeoutMS: 10000,
  maxQueryExecutionTime: 60000,
  // Pool de conexões
  poolSize: 10,
  ssl: process.env.DB_SSL === 'false',
};