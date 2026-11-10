# Variáveis de ambiente

Validadas em `src/config/env.js` na subida: a API não inicia com valor inválido.

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| NODE_ENV | não | development | development, test ou production |
| PORT | não | 3333 | Porta HTTP |
| API_PREFIX | não | /api | Prefixo das rotas (`/api/v1/...`) |
| CORS_ORIGIN | não | http://localhost:3000 | Origens permitidas, separadas por vírgula. `*` libera qualquer origem |
| DATABASE_URL | **sim** | — | `postgres://usuario:senha@host:5432/mysessions` |
| DB_SSL | não | false | `true` para bancos que exigem SSL |
| DB_LOGGING | não | false | Loga as queries do Sequelize |
| JWT_SECRET | **sim** | — | Segredo do token (mín. 16 caracteres, longo e aleatório) |
| JWT_EXPIRES_IN | não | 7d | Validade do token |
| OPENAI_API_KEY | para gerar relatório | vazio | Sem ela a API sobe, mas gerar relatório responde `OPENAI_NOT_CONFIGURED` |
| OPENAI_MODEL | não | gpt-4.1-mini | Modelo que redige os textos (precisa suportar saída estruturada) |
| OPENAI_TIMEOUT_MS | não | 60000 | Tempo máximo de cada chamada |
| OPENAI_MAX_RETRIES | não | 2 | Tentativas extras em 429/5xx/timeouts |
| OPENAI_BASE_URL | não | vazio | Gateway/proxy compatível com a OpenAI |
| AUTO_GENERATE_REPORT | não | true | Gera sozinho ao fechar o último dia da semana |
| REPORTS_STORAGE_DIR | não | ./storage/reports | Onde ficam DOCX/PDF |
| REPORT_SCHOOL_NAME / REPORT_MONITOR_NAME / REPORT_SUPERVISOR_NAME | não | Soma Garden / Diana Souza / Isabela Navarro | Cabeçalho fixo do documento, igual ao original (o aluno só sobrescreve se tiver o campo preenchido na API) |
| REPORT_LOGO_PATH | não | vazio | Logo do topo (PNG). Vazio = `src/assets/logo-navarro.png` |
| SOFFICE_BIN | não | soffice | Executável do LibreOffice |
| SOFFICE_TIMEOUT_MS | não | 90000 | Tempo máximo da conversão para PDF |
| RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX | não | 60000 / 300 | Limite de requisições por IP |
| SEED_TEMP_PASSWORD | não | vazio | Senha provisória da conta da Amanda na seed (mín. 8). Vazio = sorteada e mostrada uma vez no console |
| WEBAUTHN_RP_ID | não | localhost | Face ID: domínio do **app**, sem porta (ex.: `app.seudominio.com.br`) |
| WEBAUTHN_RP_NAME | não | Neuro Acompanha | Face ID: nome mostrado no aparelho |
| WEBAUTHN_ORIGIN | não | http://localhost:3000 | Face ID: endereço completo do app (HTTPS em produção); várias, separadas por vírgula |
