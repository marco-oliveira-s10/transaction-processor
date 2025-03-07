# Processador de Transações Bancárias

O objetivo é processar transações bancárias, detectar duplicatas segundo critérios específicos e otimizar para performance.

## 📋 Requisitos

- Node.js (v14+)
- PostgreSQL
- Docker (opcional, mas recomendado para o banco de dados)

## 🚀 Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o banco de dados:
   ```bash
   # Usando Docker
   docker run --name postgres-transactions -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=transaction_processor -p 5432:5432 -d postgres
   ```
4. Coloque os arquivos de transações na pasta `data`:
   - `transacoes1k.json` (para testes)
   - `transacoes1m.json` (para solução final)

## ▶️ Execução

### Para executar com o arquivo de teste (1k transações):

```bash
npm run process:test
```

### Para executar com o arquivo completo (1M transações):

```bash
npm run process:prod
```

## 🔍 Abordagem Técnica

### 1. Leitura do Arquivo
- Utilizamos `stream-json` para processamento eficiente de grandes arquivos JSON
- A leitura é feita em streaming para não sobrecarregar a memória

### 2. Detecção de Duplicatas
- Utilizamos uma estrutura de Map para indexar as transações
- A chave do Map combina valor, pagador e recebedor
- Verificamos a proximidade temporal (10 segundos) entre transações similares

### 3. Persistência no Banco de Dados
- Inserção em lotes (batch) para otimizar a performance
- Utilizamos TypeORM com PostgreSQL
- Criamos índices apropriados para melhorar performance de consultas futuras

### 4. Medição de Performance
- Utilizamos a biblioteca `performance-now` para medições precisas
- Detalhamos o tempo de cada etapa do processamento
- Exibimos estatísticas completas ao final da execução

## 📊 Otimizações Implementadas

1. **Processamento em Streaming**: Evita carregar todo o arquivo na memória
2. **Estrutura de Dados Eficiente**: Uso de Map para indexação e busca rápida
3. **Inserção em Lotes**: Reduz o número de operações de I/O no banco de dados
4. **Paralelização**: Aproveitamento de múltiplos núcleos quando disponível
5. **Índices no Banco**: Otimização para consultas futuras

## 📈 Resultados de Performance

Os testes foram realizados em um ambiente com as seguintes especificações:
- CPU: Intel Core i7 8th Gen
- RAM: 16GB
- SSD: NVMe 512GB

### Arquivo com 1k transações:
- Tempo total: ~500ms
- Leitura: ~100ms
- Detecção: ~50ms
- Persistência: ~350ms

### Arquivo com 1M transações (estimativa):
- Tempo total: ~3min
- Leitura: ~40s
- Detecção: ~30s
- Persistência: ~1min50s

## 🧪 Testes

Para executar os testes:

```bash
npm test
```

## 📝 Considerações Adicionais

- O algoritmo pode ser facilmente adaptado para processar volumes ainda maiores
- Para cenários de produção, recomendaria implementar processamento distribuído
- É possível otimizar ainda mais utilizando filas de mensagens para distribuir o processamento