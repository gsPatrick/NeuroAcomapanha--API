# Onboarding

## Requisitos
Node 20+, PostgreSQL 14+, LibreOffice (comando `soffice`, para converter DOCX em PDF). No macOS: `brew install postgresql@16 && brew install --cask libreoffice`.

## Rodar local
```bash
cd MySessions--API
npm install
cp .env.example .env          # preencha DATABASE_URL, JWT_SECRET e OPENAI_API_KEY
createdb mysessions
npm run migrate               # cria as tabelas
npm run dev                   # http://localhost:3333/api/health
npm run smoke:test            # confere o fluxo inteiro sem gastar créditos da OpenAI
```

## Criar o primeiro usuário
```bash
curl -X POST localhost:3333/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"fullName":"Amanda Brandão","email":"amanda@exemplo.com","password":"uma-senha-forte"}'
```
A resposta traz o `token`; envie como `Authorization: Bearer <token>` nas demais rotas.

## Onde estão os logs
No terminal (stdout/stderr). Falhas de relatório ficam em `weekly_reports.error_message` e no log com o prefixo `[report]`. Erros da OpenAI saem com `[openai]` (nunca vão para o cliente).

## Arquivos gerados
`REPORTS_STORAGE_DIR` (padrão `storage/reports/<childId>/relatorio-AAAA-MM-DD.{docx,pdf}`). A pasta não vai para o git.

## Mudar o banco
Crie uma migration nova em `migrations/` (`up`/`down`), ajuste o model e rode `npm run migrate`.

## Conta da AT (o app não tem cadastro)

```bash
npm run user:create -- "Amanda Brandão" amanda@exemplo.com uma-senha-forte
```
Cria a conta (ou redefine a senha se o e-mail já existe). No app: `NEXT_PUBLIC_API_URL=http://localhost:3333/api` (ver `.env.example` do app) e `CORS_ORIGIN` da API igual ao endereço do app.

## Seed (dados da Amanda)

```bash
npm run setup      # migrate + seed (também pode rodar separado: npm run seed)
```
Cria a conta `amandabpleite@gmail.com` (com a Maria Fernanda cadastrada) com **senha provisória**: a de `SEED_TEMP_PASSWORD` ou uma sorteada, mostrada **uma única vez** no console. Ela define a própria senha no primeiro acesso. Rodar de novo não muda nada em conta que já existe. Dados em `seeds/amanda.js`.

## Conta de teste (para ver um relatório)

```bash
SEED_TEST_PASSWORD='uma-senha' npm run seed:teste    # semana atual, dias até hoje
SEED_TEST_PASSWORD='uma-senha' npm run seed:semana   # SEMANA PASSADA inteira (segunda a sexta), tudo finalizado
```
Cria/atualiza a conta `amanda.teste@neuroacompanha.com` (separada da conta real) com a Maria Fernanda e registros preenchidos (anotações informais, marcações, ocorrências e resumo). Na semana passada todos os dias já passaram: dá para abrir, editar e tocar em **Gerar relatório** no app.
