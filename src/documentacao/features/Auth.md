# Auth — `/api/v1/auth`

| Método | Rota | Auth | Corpo |
|---|---|---|---|
| POST | /register | não | `{ fullName, email, password(≥8) }` → 201 `{ user, token }` |
| POST | /login | não | `{ email, password }` → `{ user, token }` |
| GET | /me | sim | → `{ id, fullName, firstName, email, role, photo, avatar, joinedAt }` |
| PATCH | /me | sim | `{ fullName?, role?, photo?, avatar? }` (ao menos um) → mesmo formato do GET |

`role` tem padrão "Acompanhante terapêutica (AT)". `photo` é data URL (ou null); `avatar` é a ilustração do app `{ hair, skin, ... }`. `joinedAt` = data de criação da conta (AAAA-MM-DD).
O app não tem tela de cadastro: a conta da AT nasce com `npm run user:create -- "Nome Completo" email senha` (ver ONBOARDING).

Erros: `VALIDATION_ERROR` (422, com `details`), `EMAIL_IN_USE` (409), `INVALID_CREDENTIALS` (401), `TOKEN_MISSING`/`TOKEN_INVALID` (401).
O `fullName` da usuária aparece como **APLICADORA** no relatório.
