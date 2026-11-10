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
