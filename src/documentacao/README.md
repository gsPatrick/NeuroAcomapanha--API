# MySessions API — comece aqui

API do MySessions: guarda o registro diário da AT e **gera o relatório semanal (DOCX e PDF)** sozinha quando o último dia de atendimento da semana é finalizado. A redação dos textos usa a OpenAI.

- [ONBOARDING.md](ONBOARDING.md) — rodar local, migrar o banco, criar o primeiro usuário
- [ENV_REFERENCE.md](ENV_REFERENCE.md) — todas as variáveis de ambiente
- features/ — [Auth](features/Auth.md) · [Children](features/Children.md) · [Records](features/Records.md) · [Attendance](features/Attendance.md) · [Reports](features/Reports.md)

## Fluxo

```
Router → validate (Zod) → Controller → Service → (Provider)
```

```
app.js                      Express, middlewares globais, erro, listen
src/config                  env validado (Zod) e banco
src/models                  User, Child, DailyRecord, WeeklyReport (+ associações)
src/features/<nome>         routes · controller · service(s) · schema (regra de negócio, nada genérico)
src/routes/index.js         único agregador de rotas (/api/v1/...)
src/middlewares             auth, validate (Zod), erro
src/providers               openai · docx · libreoffice · storage (tudo que é externo)
src/utils                   funções puras (datas, texto, AppError, resposta)
migrations/  scripts/       esquema do banco · migrate e smoke test
```

## Como o relatório nasce

1. A AT registra cada dia (`PUT /records/:date`) e o **fecha** (`POST .../finish`) ou marca **suspenso**.
2. Ao fechar um dia, a API confere se **todos os dias de atendimento da semana** (segundo a rotina do aluno) estão fechados/suspensos.
3. Se sim, gera em segundo plano: a IA redige "Comportamentos observados" e "Objetivos trabalhados" de cada momento → monta o DOCX → converte para PDF com o LibreOffice → grava.
4. O app consulta `GET /reports/:semana` (status `generating` → `ready`) e baixa em `/download?format=pdf|docx`.

Regras de ouro do texto: a IA só usa o que foi registrado (nunca inventa); momento sem nenhum dado é omitido; **texto que a AT escreveu à mão nunca é reescrito**.

## Checagem rápida

`npm run smoke:test` — sobe a API, usa uma OpenAI falsa local e percorre o fluxo completo (cadastro, dias, fechamento, relatório, download).
