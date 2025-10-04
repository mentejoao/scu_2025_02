# 🚀 Setup Rápido - Drizzle ORM + PostgreSQL

Este guia fornece instruções passo a passo para configurar o banco de dados PostgreSQL com Drizzle ORM.

## 📋 Pré-requisitos

- [x] Node.js 16+ instalado
- [x] PostgreSQL 14+ instalado
- [x] npm ou pnpm instalado

## ⚡ Setup Automático (Recomendado)

### Linux/macOS:
```bash
./scripts/setup-db.sh
```

### Windows:
```bash
scripts\setup-db.bat
```

## 🔧 Setup Manual

### 1. Instalar dependências

As dependências já foram instaladas:
- ✅ `drizzle-orm` - ORM para TypeScript
- ✅ `pg` - Cliente PostgreSQL para Node.js
- ✅ `dotenv` - Gerenciamento de variáveis de ambiente
- ✅ `drizzle-kit` - CLI para migrações
- ✅ `@types/pg` - Tipos TypeScript para pg

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=ubiqua_db
```

### 3. Criar o banco de dados

**Opção A: Via linha de comando**
```bash
createdb ubiqua_db
```

**Opção B: Via psql**
```bash
psql -U postgres
```
```sql
CREATE DATABASE ubiqua_db;
\q
```

**Opção C: Via pgAdmin**
- Abra o pgAdmin
- Clique com o botão direito em "Databases"
- Selecione "Create" → "Database"
- Nome: `ubiqua_db`

### 4. Aplicar migrações

```bash
npm run db:push
```

Este comando cria todas as tabelas no banco de dados:
- ✅ `estados` - Estados brasileiros
- ✅ `city` - Municípios
- ✅ `eosinophilia_cases` - Casos de eosinofilia
- ✅ `geolocated_tests` - Testes geolocalizados
- ✅ `regional_baselines` - Baselines regionais

### 5. Popular com dados de teste (opcional)

```bash
npm run db:seed
```

Este comando insere:
- 1 estado (Goiás)
- 1 município (Goiânia)
- 60 casos de eosinofilia (10 agrupados + 50 dispersos)
- 1000 testes geolocalizados
- 1 baseline regional

## 🎯 Verificação

### Testar conexão:

```bash
npm run start:api
```

Se tudo estiver correto, você verá:
```
✅ Database connection successful
Server running on port 3000
```

### Visualizar dados:

```bash
npm run db:studio
```

Abre o Drizzle Studio em `https://local.drizzle.studio`

### Executar testes:

```bash
npm test
```

## 📚 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run db:generate` | Gera arquivos de migração |
| `npm run db:push` | Aplica schema ao banco |
| `npm run db:migrate` | Executa migrações pendentes |
| `npm run db:studio` | Abre interface visual do banco |
| `npm run db:seed` | Popula com dados de teste |
| `npm run start:api` | Inicia servidor de desenvolvimento |
| `npm test` | Executa testes |

## 🗂️ Estrutura de Arquivos

```
server/
├── drizzle/                    # Migrações geradas
│   ├── 0000_oval_the_leader.sql
│   └── meta/
├── src/
│   └── database/
│       ├── schema.ts           # Definição do schema
│       ├── connection.ts       # Conexão com PostgreSQL
│       ├── db.ts              # Funções de query (NEW!)
│       ├── seed.ts            # Script de seed
│       ├── mock-db.ts         # (DEPRECATED - não usar)
│       └── types.ts           # (DEPRECATED - usar schema.ts)
├── drizzle.config.ts          # Configuração do Drizzle
├── .env.example               # Template de variáveis
└── .env                       # Suas configurações (git ignored)
```

## 🔄 Mudanças no Código

### Antes (mock-db):
```typescript
import { getEosinophiliaCasesInWindow } from '../database/mock-db';
import { EosinophiliaCase } from '../database/types';
```

### Depois (Drizzle):
```typescript
import { getEosinophiliaCasesInWindow } from '../database/db';
import { EosinophiliaCase } from '../database/schema';
```

## ⚠️ Troubleshooting

### Erro: "Connection refused"

**Causa**: PostgreSQL não está rodando

**Solução**:
```bash
# macOS (Homebrew)
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Verificar status
pg_isready
```

### Erro: "database does not exist"

**Causa**: Banco de dados não foi criado

**Solução**:
```bash
createdb ubiqua_db
```

### Erro: "password authentication failed"

**Causa**: Senha incorreta no `.env`

**Solução**: Verifique as credenciais no arquivo `.env`

### Erro: "relation does not exist"

**Causa**: Migrações não foram aplicadas

**Solução**:
```bash
npm run db:push
```

### Erro de tipos TypeScript

**Causa**: Cache desatualizado

**Solução**:
```bash
rm -rf dist/ node_modules/
npm install
npm run build
```

## 🎓 Recursos Adicionais

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [SQL Cheat Sheet](https://www.postgresql.org/docs/current/sql-commands.html)

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os logs do PostgreSQL
2. Execute `npm run db:studio` para inspecionar o banco
3. Consulte o arquivo `MIGRATION_GUIDE.md` para detalhes técnicos
4. Verifique se todas as dependências estão instaladas

## ✅ Checklist de Setup

- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env` criado e configurado
- [ ] Banco de dados `ubiqua_db` criado
- [ ] Migrações aplicadas (`npm run db:push`)
- [ ] Dados de teste inseridos (`npm run db:seed`)
- [ ] Servidor iniciando sem erros (`npm run start:api`)
- [ ] Testes passando (`npm test`)

---

**Pronto!** 🎉 Seu ambiente está configurado e pronto para desenvolvimento.

Para mais informações, consulte:
- `README.md` - Visão geral do projeto
- `MIGRATION_GUIDE.md` - Detalhes técnicos da migração

