# Attendance — `/api/v1/attendance` (auth)

`GET /?from=AAAA-MM-DD&to=AAAA-MM-DD` (máx. 400 dias) → visão leve de **todos os alunos da AT**, sem o conteúdo dos registros:

```json
[{ "childId": "…", "date": "2026-10-26", "status": "finished", "filled": true }]
```

`status`: `open` | `finished` | `suspended`. `filled`: o dia tem marcação, anotação, resposta ou resumo. O app usa para o calendário, a tela inicial (hoje suspenso?) e os números do mês.
