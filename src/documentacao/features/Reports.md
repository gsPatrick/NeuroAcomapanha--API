# Reports — `/api/v1/children/:childId/reports` (auth)

Relatório semanal (segunda a domingo). `:weekStart` aceita **qualquer dia** da semana.

| Método | Rota | Descrição |
|---|---|---|
| GET | / | Lista (sem o conteúdo) |
| POST | / | `{ weekStart }` Gera/regera manualmente → **202** com `status: generating`. 409 `REPORT_IN_PROGRESS` se já está gerando |
| GET | /:weekStart | Status (`generating`/`ready`/`failed`), `content` (texto redigido) e `errorMessage` |
| GET | /:weekStart/download?format=pdf\|docx | Arquivo. 409 `REPORT_NOT_READY` se ainda não está pronto |

## Geração automática
Quando `finish`/`suspend` fecha o último dia de atendimento da semana (todos os dias da rotina fechados ou suspensos e ao menos um atendido), o relatório é gerado em segundo plano. Desligue com `AUTO_GENERATE_REPORT=false`. Dias ainda abertos ficam fora na geração manual.

## Como o texto é feito
- 1 chamada à OpenAI por dia atendido (`report-narrative.service.js`), com saída em JSON validada por Zod. A **anotação de cada momento** (`events` com `key: "note"`) é a fonte principal; o prompt (`report-narrative.prompts.js`) é o "Padrão de Registros Semanais" da AT: texto corrido, objetivos sem repetição, nada inventado.
- Momento sem marcação, nota ou resposta é **omitido**. Texto/objetivos escritos pela AT passam direto (sem IA se estiverem completos).
- Regerar manualmente chama a IA de novo (o texto pode mudar de redação).

## Privacidade (dado sensível de criança)
À OpenAI vai só o **primeiro nome**, sem escola, sobrenome, diagnóstico ou horários; `store: false` (não guardar na OpenAI). Erros da OpenAI nunca devolvem trechos do pedido ao cliente. Avalie com a clínica o enquadramento na LGPD (menor de idade, dado de saúde) antes de usar com dados reais.

## Erros comuns
`OPENAI_NOT_CONFIGURED` (503), `OPENAI_RATE_LIMIT` (503), `OPENAI_TIMEOUT` (504), `OPENAI_INVALID_SHAPE` (502), `PDF_CONVERSION_FAILED` (500), `WEEK_EMPTY` (400). Falhas deixam o relatório em `failed` com o motivo em `errorMessage`; basta `POST` de novo.

## Tabela "Registro de Comportamentos Inadequados"
Não é preenchida pelo sistema. Vai **sempre em branco** (cabeçalho DATA / HORÁRIO / ANTECEDENTE / COMPORTAMENTO / CONSEQUÊNCIA e 8 linhas vazias), **sozinha numa página própria no fim do documento e centralizada no meio da página**, para a AT completar à mão. Fica numa seção própria do DOCX, então começa sempre em página nova, não importa o tamanho dos dias antes dela. O espaço acima do título é calculado (e não o alinhamento vertical do Word) porque o LibreOffice ignora aquele alinhamento ao gerar o PDF.
