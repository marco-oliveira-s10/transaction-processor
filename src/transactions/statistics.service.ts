import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { ValueDistribution, TimestampDistribution, TransactionStats, UnusualPatterns } from './interfaces/statistics.interface';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {}

  /**
   * Calcula a distribuição de transações por faixa de valor
   */
  async getValueDistribution(): Promise<ValueDistribution[]> {
    this.logger.log('Calculando distribuição de valores...');

    // Obtenha o valor mínimo e máximo para determinar as faixas
    const { min, max } = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MIN(transaction.valor)', 'min')
      .addSelect('MAX(transaction.valor)', 'max')
      .getRawOne();

    const totalCount = await this.transactionRepository.count();
    
    // Define as faixas de valores
    const ranges = [
      { min: 0, max: 500 },
      { min: 500, max: 1000 },
      { min: 1000, max: 2000 },
      { min: 2000, max: 3000 },
      { min: 3000, max: 4000 },
      { min: 4000, max: 5000 },
      { min: 5000, max: Number.MAX_SAFE_INTEGER },
    ];

    const distribution: ValueDistribution[] = [];

    // Calcula a contagem para cada faixa
    for (const range of ranges) {
      const count = await this.transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.valor >= :min', { min: range.min })
        .andWhere('transaction.valor < :max', { max: range.max })
        .getCount();

      const percentage = (count / totalCount) * 100;

      distribution.push({
        range: `${range.min} - ${range.max === Number.MAX_SAFE_INTEGER ? 'Acima' : range.max}`,
        count,
        percentage,
      });
    }

    return distribution;
  }

  /**
   * Calcula a distribuição de transações por hora do dia
   */
  async getHourlyDistribution(): Promise<TimestampDistribution[]> {
    this.logger.log('Calculando distribuição por hora do dia...');

    const totalCount = await this.transactionRepository.count();
    const hourlyDistribution: TimestampDistribution[] = [];

    // Para cada hora do dia (0-23)
    for (let hour = 0; hour < 24; hour++) {
      // Conta as transações nesta hora
      const count = await this.transactionRepository
        .createQueryBuilder('transaction')
        .where('EXTRACT(HOUR FROM transaction.timestamp) = :hour', { hour })
        .getCount();

      const percentage = (count / totalCount) * 100;

      hourlyDistribution.push({
        hour,
        count,
        percentage,
      });
    }

    return hourlyDistribution;
  }

  /**
   * Calcula estatísticas gerais sobre as transações
   */
  async getTransactionStats(): Promise<TransactionStats> {
    this.logger.log('Calculando estatísticas gerais...');

    const totalCount = await this.transactionRepository.count();

    // Obter estatísticas básicas
    const stats = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('AVG(transaction.valor)', 'avgValue')
      .addSelect('MIN(transaction.valor)', 'minValue')
      .addSelect('MAX(transaction.valor)', 'maxValue')
      .addSelect('SUM(transaction.valor)', 'totalValue')
      .getRawOne();

    // Contar transações por pagador e recebedor
    const uniquePagadores = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT transaction.pagador)', 'count')
      .getRawOne();

    const uniqueRecebedores = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT transaction.recebedor)', 'count')
      .getRawOne();

    return {
      totalTransactions: totalCount,
      averageValue: parseFloat(stats.avgValue) || 0,
      minValue: parseFloat(stats.minValue) || 0,
      maxValue: parseFloat(stats.maxValue) || 0,
      totalValue: parseFloat(stats.totalValue) || 0,
      uniquePagadores: parseInt(uniquePagadores.count) || 0,
      uniqueRecebedores: parseInt(uniqueRecebedores.count) || 0,
    };
  }

  /**
   * Identifica possíveis padrões incomuns nas transações
   * Isso pode ser útil para detecção de fraudes ou análises mais avançadas
   */
  async detectUnusualPatterns(): Promise<UnusualPatterns> {
    this.logger.log('Analisando padrões incomuns...');

    // 1. Encontrar pagadores com muitas transações em curto período
    const frequentPagadores = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.pagador', 'pagador')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transaction.pagador')
      .having('COUNT(*) > 5')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // 2. Encontrar transações com valores muito acima da média
    const avgValue = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('AVG(transaction.valor)', 'avg')
      .getRawOne();

    const highValueThreshold = parseFloat(avgValue.avg) * 2;
    
    const highValueTransactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.valor > :threshold', { threshold: highValueThreshold })
      .orderBy('transaction.valor', 'DESC')
      .limit(10)
      .getMany();

    return {
      frequentPagadores,
      highValueTransactions,
      avgValue: parseFloat(avgValue.avg),
      highValueThreshold,
    };
  }
}