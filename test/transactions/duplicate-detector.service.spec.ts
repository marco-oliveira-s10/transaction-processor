import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateDetectorService } from '../../src/transactions/duplicate-detector.service';
import { Transaction } from '../../src/transactions/interfaces/transaction.interface';

describe('DuplicateDetectorService', () => {
  let service: DuplicateDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DuplicateDetectorService],
    }).compile();

    service = module.get<DuplicateDetectorService>(DuplicateDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('filterDuplicates', () => {
    it('should identify and filter duplicate transactions with same value, pagador, recebedor within 10 seconds', () => {
      // Preparar dados de teste com transações duplicadas
      const transactions: Transaction[] = [
        {
          id: 1,
          valor: 100.0,
          pagador: '12345',
          recebedor: '67890',
          timestamp: '2023-01-01T10:00:00.000Z',
        },
        {
          id: 2,
          valor: 100.0,
          pagador: '12345',
          recebedor: '67890',
          timestamp: '2023-01-01T10:00:05.000Z', // 5 segundos depois - deve ser detectada como duplicata
        },
        {
          id: 3,
          valor: 100.0,
          pagador: '12345',
          recebedor: '67890',
          timestamp: '2023-01-01T10:00:15.000Z', // 15 segundos depois - não deve ser duplicata
        },
        {
          id: 4,
          valor: 200.0, // Valor diferente - não deve ser duplicata
          pagador: '12345',
          recebedor: '67890',
          timestamp: '2023-01-01T10:00:02.000Z',
        },
        {
          id: 5,
          valor: 100.0,
          pagador: '54321', // Pagador diferente - não deve ser duplicata
          recebedor: '67890',
          timestamp: '2023-01-01T10:00:03.000Z',
        },
        {
          id: 6,
          valor: 100.0,
          pagador: '12345',
          recebedor: '09876', // Recebedor diferente - não deve ser duplicata
          timestamp: '2023-01-01T10:00:04.000Z',
        },
      ];

      // Executar o serviço
      const result = service.filterDuplicates(transactions);

      // Verificar que as duplicatas foram removidas corretamente
      expect(result.length).toBe(5); // Deveria restar 5 transações, 1 duplicata removida
      expect(result.find(t => t.id === 2)).toBeUndefined(); // A transação ID 2 deve ter sido removida como duplicata

      // Verificar que as outras transações foram preservadas
      expect(result.find(t => t.id === 1)).toBeDefined();
      expect(result.find(t => t.id === 3)).toBeDefined();
      expect(result.find(t => t.id === 4)).toBeDefined();
      expect(result.find(t => t.id === 5)).toBeDefined();
      expect(result.find(t => t.id === 6)).toBeDefined();
    });

    it('should handle empty array', () => {
      const result = service.filterDuplicates([]);
      expect(result).toEqual([]);
    });

    it('should handle large sets of transactions efficiently', () => {
      // Criando um conjunto grande de transações para teste de performance
      const largeTransactionSet: Transaction[] = [];
      
      for (let i = 0; i < 10000; i++) {
        largeTransactionSet.push({
          id: i,
          valor: 100 + (i % 100), // Para criar alguns valores que se repetem
          pagador: `pagador${i % 50}`, // Para criar alguns pagadores que se repetem
          recebedor: `recebedor${i % 50}`, // Para criar alguns recebedores que se repetem
          timestamp: new Date(2023, 0, 1, 10, 0, i % 60).toISOString(), // Para criar diferenças de tempo
        });
      }

      // Adicionando algumas duplicatas específicas para teste
      for (let i = 0; i < 100; i++) {
        const originalIndex = i * 100; // Pegar uma transação a cada 100
        const original = largeTransactionSet[originalIndex];
        
        // Adicionar uma duplicata com diferença de 5 segundos
        largeTransactionSet.push({
          id: 10000 + i,
          valor: original.valor,
          pagador: original.pagador,
          recebedor: original.recebedor,
          timestamp: new Date(new Date(original.timestamp).getTime() + 5000).toISOString(),
        });
      }

      // Executar o serviço
      const startTime = Date.now();
      const result = service.filterDuplicates(largeTransactionSet);
      const duration = Date.now() - startTime;

      // Verificar que as duplicatas foram removidas corretamente
      expect(result.length).toBe(10000); // Devem sobrar 10000 transações, 100 duplicatas removidas
      expect(duration).toBeLessThan(1000); // Deve processar em menos de 1 segundo
    });
  });
});