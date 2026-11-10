# Deploy no Easypanel

Dois serviços de app (API e App) + um Postgres, no mesmo projeto.

## 1) Postgres
Crie um serviço **Postgres**. Anote a URL interna (ex.: `postgres://usuario:senha@projeto_postgres:5432/mysessions`).

## 2) API (este repositório)
Serviço **App** → origem **GitHub** (`gsPatrick/NeuroAcomapanha--API`, branch `main`) → build **Dockerfile** (na raiz). Porta **3333**.

**Variáveis de ambiente** (aba Environment):

```
NODE_ENV=production
PORT=3333
DATABASE_URL=postgres://usuario:senha@projeto_postgres:5432/mysessions
JWT_SECRET=<texto longo e aleatório>
CORS_ORIGIN=https://app.seudominio.com.br
OPENAI_API_KEY=<sua chave>
WEBAUTHN_RP_ID=app.seudominio.com.br
WEBAUTHN_ORIGIN=https://app.seudominio.com.br
SEED_TEMP_PASSWORD=<senha provisória da Amanda>
```
(`CORS_ORIGIN`, `WEBAUTHN_RP_ID` e `WEBAUTHN_ORIGIN` são o endereço do **app**, não da API. Demais variáveis: ENV_REFERENCE.md.)

**Volume** (aba Mounts): tipo *Volume*, caminho `/app/storage` — guarda os PDFs/DOCX gerados.
**Domínio**: ex. `api.seudominio.com.br` → porta 3333, HTTPS ligado.

As migrações rodam sozinhas a cada início. A seed (cria a conta da Amanda) roda uma vez, no **Console** do serviço:

```bash
npm run seed
```

## 3) App (repositório do front)
Serviço **App** → `gsPatrick/NeuroAcompanha--FRONT` → **Dockerfile**. Porta **3000**.
Em **Build Args** (não em Environment — é lido na hora do build): `NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api`
Domínio: `app.seudominio.com.br`, HTTPS ligado (o Face ID só funciona em HTTPS).

Trocou o endereço da API? Faça um novo build do app.
