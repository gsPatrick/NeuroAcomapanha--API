# Children — `/api/v1/children` (auth)

Cada AT só enxerga os próprios alunos (404 `CHILD_NOT_FOUND` para os demais).

| Método | Rota | Descrição |
|---|---|---|
| GET | / | Lista |
| POST | / | Cria (entra no fim da lista) |
| PUT | / | **Cadastro completo de uma vez** (onboarding do app) |
| GET/PATCH/DELETE | /:childId | Lê / altera / apaga (apaga registros e relatórios junto) |

Corpo (criar): `{ name, fullName?, schoolName?, monitorName?, supervisorName?, routine?, startedAt?, photo?, avatar?, conditions? }`

- `photo`: data URL já recortada pelo app (ou `null`). `avatar`: ilustração `{ hair, hairColor, skin, clothing, tile }`.
- `conditions`: neurodivergências `[{ id: 'tea', levels: { suporte: '2' } }]` — **dado sensível de saúde**, só volta para a AT dona.
- `startedAt` padrão = hoje (o histórico do perfil começa aí). A lista vem ordenada por `position` (ordem do cadastro).

**PUT /** `{ children: [{ id?, name, ... }] }`: `id` conhecido atualiza (registros e relatórios ficam), sem id/desconhecido cria, quem não está na lista é **removido** (com registros e relatórios). A ordem da lista vira a ordem dos alunos. Campos não enviados ficam como estavam (inclusive a rotina). Tudo numa transação.

`routine` segue o app: `{ "1": { "attends": true, "welcome": true, "classes": ["Português"] }, ... }`, chaves `0`–`6` = `Date#getDay` (0 = domingo). **A rotina define quais dias a semana precisa ter para o relatório sair sozinho.** Sem rotina, vale segunda a sexta.
Cabeçalho do relatório: PACIENTE = `fullName` (ou `name`), NOME DA ESCOLA = `schoolName`, MONITORA, SUPERVISORA.
