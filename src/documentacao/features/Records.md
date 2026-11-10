# Records — `/api/v1/children/:childId/records` (auth)

Registro de um dia (`:date` = `AAAA-MM-DD`), no mesmo formato do app.

| Método | Rota | Descrição |
|---|---|---|
| GET | /?from=&to= | Registros do período |
| GET | /:date | Um dia (404 `RECORD_NOT_FOUND`) |
| PUT | /:date | Grava o dia inteiro (cria ou substitui). 409 `RECORD_SUSPENDED` se o dia está suspenso |
| POST | /:date/finish | Fecha o dia. 400 `RECORD_EMPTY` se não há momentos. **Pode disparar o relatório** |
| POST | /:date/suspend | `{ note? }` Marca atendimento suspenso (padrão: "atendimento suspenso pela família."). Também pode disparar o relatório |
| POST | /:date/reopen | Volta para "em andamento" |

Corpo do PUT:
```json
{
  "blocks":  [{ "id": "a1", "kind": "welcome|class|snack|play|other", "title": "Acolhimento",
                "observed": "(opcional) texto da AT", "goals": ["(opcional) objetivos da AT"] }],
  "events":  [{ "id": "e1", "blockId": "a1", "key": "note|calm|crisis|snack|...", "at": 1793000000000,
                "text": "só para note", "antecedent": "só ocorrências", "consequence": "só ocorrências" }],
  "answers": { "a1": { "enteredCalmly": { "answer": "yes|no|<opção>|null", "obs": "" } } },
  "summary": { "easy": "", "hard": "" }
}
```
`observed`/`goals` permitem que a AT escreva o texto de um momento à mão: ele entra no relatório **sem ser reescrito**. Rótulos de marcações e perguntas: `records.constants.js`.
Ocorrências (`crisis`, `refusal`, `escape`, `stereotypy`, `aggression`, `overload`) viram linhas da tabela "Registro de Comportamentos Inadequados".

## Campos do app e respostas

- O registro guarda também `cursor` (id do momento em que a AT parou; o registro reabre ali). Vai no corpo do `PUT`.
- `POST /:date/finish` e `POST /:date/suspend` respondem o registro mais `weekReport`: `{ weekStart, status: 'generating' }` quando essa ação completou a semana e o relatório começou a ser gerado, senão `null`. O app usa para avisar a AT.
- `PUT` em dia suspenso → 409 `RECORD_SUSPENDED` (reabra antes com `POST /:date/reopen`).
