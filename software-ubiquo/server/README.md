# Software Ubíquo - Sistema de Monitoramento de Hemogramas

Sistema de monitoramento de saúde pública que processa hemogramas e detecta padrões coletivos anômalos para alerta precoce de surtos e agravos.

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express** para API REST
- **Drizzle ORM** para gerenciamento de banco de dados
- **PostgreSQL** como banco de dados
- **Firebase Admin SDK** para notificações push
- **Jest** para testes
- **DBSCAN** para clustering espacial

## 📋 Pré-requisitos

- Node.js 16+
- PostgreSQL 14+
- npm ou pnpm

## 🔧 Instalação

1. Clone o repositório e navegue até o diretório do servidor:

```bash
cd scu_2025_02/software-ubiquo/server
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações de banco de dados.

## 🗄️ Configuração do Banco de Dados

### 1. Criar o banco de dados

```bash
createdb ubiqua_db
```

Ou através do psql:

```sql
CREATE DATABASE ubiqua_db;
```

### 2. Gerar e aplicar migrações

```bash
# Gerar arquivos de migração (já feito, mas use isso para mudanças futuras)
npm run db:generate

# Aplicar migrações ao banco de dados
npm run db:push
```

### 3. Popular o banco com dados de teste

```bash
npm run db:seed
```

### 4. (Opcional) Abrir Drizzle Studio para visualizar dados

```bash
npm run db:studio
```

## 🏃 Executando o projeto

### Modo de desenvolvimento (API):

```bash
npm run start:api
```

A API estará disponível em `http://localhost:3000`

### Build e execução:

```bash
npm run build
npm start
```

## 📝 Scripts disponíveis

| Script                 | Descrição                                         |
| ---------------------- | ------------------------------------------------- |
| `npm test`             | Executa os testes com Jest                        |
| `npm run build`        | Compila o TypeScript para JavaScript              |
| `npm start`            | Executa a aplicação compilada                     |
| `npm run start:api`    | Executa a API em modo desenvolvimento             |
| `npm run db:generate`  | Gera arquivos de migração do banco                |
| `npm run db:migrate`   | Aplica migrações pendentes                        |
| `npm run db:push`      | Sincroniza o schema com o banco (desenvolvimento) |
| `npm run db:studio`    | Abre o Drizzle Studio para visualizar dados       |
| `npm run db:seed`      | Popula o banco com dados de teste                 |
| `npm run format:check` | Verifica formatação do código                     |
| `npm run format:write` | Formata o código automaticamente                  |

## 🗂️ Estrutura do Banco de Dados

### Tabelas principais:

- **estados**: Estados brasileiros (UF)
- **city**: Municípios brasileiros (código IBGE)
- **eosinophilia_cases**: Casos de eosinofilia detectados
- **geolocated_tests**: Testes geolocalizados
- **regional_baselines**: Baselines estatísticas por região

## 🔄 Migração de mock-db para Drizzle

O projeto foi migrado do sistema mock (arquivos em memória) para um banco de dados PostgreSQL real com Drizzle ORM.

Se você está atualizando código existente:

- Substitua imports de `'../database/mock-db'` por `'../database/db'`
- Substitua tipos de `'../database/types'` por `'../database/schema'`

## 📊 API Endpoints

### Análise de hemogramas:

- `GET /api/analyze` - Executa análise de surtos de parasitose
- `GET /api/health` - Verifica status da API

## 🧪 Testes

```bash
npm test
```

Para executar com cobertura:

```bash
npm test -- --coverage
```

## 🔐 Segurança

- Não versione o arquivo `.env` com credenciais reais
- Use HTTPS em produção
- Configure mTLS para comunicação entre sistemas
- O sistema não armazena dados pessoais identificáveis

## 📄 Licença

ISC

## 👥 Contribuindo

Este é um projeto acadêmico para o Sistema de Monitoramento de Hemogramas da UFG.

## 📞 Suporte

Para questões e suporte, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.
