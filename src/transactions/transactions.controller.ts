import { Controller, Get, Post, Query, Param, Delete, UseInterceptors, UploadedFile, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { TransactionFilterDto } from './dto/transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { diskStorage } from 'multer';
import * as path from 'path';
import { StatisticsService } from './statistics.service';
import { ValueDistribution, TimestampDistribution, TransactionStats, UnusualPatterns } from './interfaces/statistics.interface';

// Definindo uma interface simples para substituir Express.Multer.File
interface UploadedFileInfo {
  filename: string;
  originalname: string;
  path: string;
  mimetype: string;
  size: number;
}

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly statisticsService: StatisticsService,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './data',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'transactions-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
          cb(null, true);
        } else {
          cb(new Error('Only JSON files are allowed!'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: UploadedFileInfo) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    // Processa o arquivo de transações
    await this.transactionsService.processTransactions(file.path);
    return {
      message: 'File processed successfully',
      filename: file.filename,
      originalname: file.originalname,
    };
  }

  @Get()
  async findAll(@Query() filterDto: TransactionFilterDto) {
    // Construir query com base nos filtros
    let query = this.transactionRepository.createQueryBuilder('transaction');

    if (filterDto.pagador) {
      query = query.andWhere('transaction.pagador = :pagador', { pagador: filterDto.pagador });
    }

    if (filterDto.recebedor) {
      query = query.andWhere('transaction.recebedor = :recebedor', { recebedor: filterDto.recebedor });
    }

    if (filterDto.dataInicio) {
      query = query.andWhere('transaction.timestamp >= :dataInicio', { dataInicio: filterDto.dataInicio });
    }

    if (filterDto.dataFim) {
      query = query.andWhere('transaction.timestamp <= :dataFim', { dataFim: filterDto.dataFim });
    }

    // Limitar a 100 resultados para não sobrecarregar
    const transactions = await query.take(100).getMany();
    const total = await query.getCount();

    return {
      data: transactions,
      total,
      limit: 100,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionRepository.findOne({ where: { id } });
  }

  @Get('stats/duplicates')
  async getDuplicateStats() {
    const totalCount = await this.transactionRepository.count();
    
    return {
      totalTransactions: totalCount,
      uniqueCount: totalCount,
    };
  }

  @Get('stats/distribution')
  async getValueDistribution(): Promise<{ valueDistribution: ValueDistribution[]; hourlyDistribution: TimestampDistribution[] }> {
    const valueDistribution = await this.statisticsService.getValueDistribution();
    const hourlyDistribution = await this.statisticsService.getHourlyDistribution();
    
    return { 
      valueDistribution, 
      hourlyDistribution 
    };
  }

  @Get('stats/general')
  async getGeneralStats(): Promise<TransactionStats> {
    return this.statisticsService.getTransactionStats();
  }

  @Get('stats/patterns')
  async getUnusualPatterns(): Promise<UnusualPatterns> {
    return this.statisticsService.detectUnusualPatterns();
  }

  @Delete('clear')
  async clearAllTransactions() {
    await this.transactionRepository.clear();
    return { message: 'All transactions cleared from database' };
  }
}