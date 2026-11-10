# Logs do relatório (de ponta a ponta)

Cada linha: `hora NÍVEL [rel código] [dia AAAA-MM-DD] [etapa] mensagem chave=valor`. O `rel abc123.xyz` identifica UMA geração: filtre por ele para seguir um relatório do começo ao fim (`dia` aparece porque os dias são redigidos ao mesmo tempo).

```
[http]       POST …/records/2026-11-10/finish → 200            a AT finalizou o dia
[gatilho]    Dia fechado e a semana está COMPLETA / NÃO está completa (e quais dias faltam)
[relatório]  ▶ INÍCIO · 1/4 conteúdo · 2/4 DOCX · 3/4 PDF · 4/4 gravação · ✔ PRONTO (ou ✖ FALHOU + motivo)
[conteúdo]   quais dias entram, quais ficam de fora, dias suspensos, tabela ABC (ocorrências)
[redação]    por dia: momentos com dados / omitidos por falta de dados / escritos pela AT (sem IA) e o que foi à IA
[openai]     modelo, tempo, tokens de entrada/saída, id da resposta; erros (chave, limite, timeout…)
[redação]    "IA redigiu X: N caracteres e N objetivos" · AVISO se a IA não devolveu um momento ·
             AVISO de objetivos repetidos entre momentos (a regra do prompt pede objetivos distintos)
[libreoffice] falha na conversão (comando, motivo, stderr)
[arquivos]   caminho e tamanho de cada arquivo gravado
[download]   o app baixou o PDF/DOCX
```

## Ver o texto da IA (REPORT_DEBUG=true)
Com `REPORT_DEBUG=true` aparecem blocos `│` com **a mensagem exata enviada à IA** (anotações, marcações e respostas da AT), a **resposta bruta** e o **texto final de cada momento**. Serve para conferir se a IA entendeu a anotação e escreveu certo. Contém dados de uma criança: desligue depois.

## Como investigar
- Relatório não saiu: procure `[gatilho]` do dia (diz se a semana estava completa e quais dias faltavam).
- Saiu errado: ligue `REPORT_DEBUG`, gere de novo e compare "Mensagem enviada à IA" com "Texto da IA".
- Falhou: a linha `✖ FALHOU` traz o código (`OPENAI_NOT_CONFIGURED`, `OPENAI_AUTH`, `OPENAI_RATE_LIMIT`, `OPENAI_TIMEOUT`, `PDF_CONVERSION_FAILED`, `WEEK_EMPTY`…) e a mensagem. O mesmo código fica em `weekly_reports.error_message`.
