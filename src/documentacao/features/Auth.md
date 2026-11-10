# Auth — `/api/v1/auth`

| Método | Rota | Auth | Corpo |
|---|---|---|---|
| POST | /register | não | `{ fullName, email, password(≥8) }` → 201 `{ user, token }` |
| POST | /login | não | `{ email, password }` → `{ user, token }` |
| GET | /me | sim | → `{ id, fullName, firstName, email, role, photo, avatar, joinedAt }` |
| POST | /first-password | sim | `{ newPassword(≥8) }` — só vale em conta com senha provisória (`mustChangePassword: true`); 409 `PASSWORD_ALREADY_SET` depois |
| PATCH | /me | sim | `{ fullName?, role?, photo?, avatar? }` (ao menos um) → mesmo formato do GET |

`role` tem padrão "Acompanhante terapêutica (AT)". `photo` é data URL (ou null); `avatar` é a ilustração do app `{ hair, skin, ... }`. `joinedAt` = data de criação da conta (AAAA-MM-DD).
O app não tem tela de cadastro: a conta da AT nasce com `npm run user:create -- "Nome Completo" email senha` (ver ONBOARDING).

Erros: `VALIDATION_ERROR` (422, com `details`), `EMAIL_IN_USE` (409), `INVALID_CREDENTIALS` (401), `TOKEN_MISSING`/`TOKEN_INVALID` (401).
O `fullName` da usuária aparece como **APLICADORA** no relatório.

## Senha provisória (primeiro acesso)

Contas criadas pela seed nascem com `mustChangePassword: true`. O login devolve a flag; o app leva a AT à tela de definir a própria senha (`POST /first-password`) antes de qualquer outra coisa. A senha provisória deixa de valer na hora.

## Face ID / biometria (WebAuthn)

O aparelho guarda a chave privada (liberada só pelo rosto/digital); a API guarda a pública e confere a assinatura. Exige HTTPS (ou localhost) e `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` iguais ao endereço do **app** (ver ENV_REFERENCE).

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | /passkeys/register/options | sim | Opções para cadastrar o Face ID → `{ options, challengeToken }` |
| POST | /passkeys/register/verify | sim | `{ challengeToken, response, deviceName? }` → 201 `{ enabled: true }` |
| POST | /passkeys/login/options | não | Opções para entrar → `{ options, challengeToken }` |
| POST | /passkeys/login/verify | não | `{ challengeToken, response }` → `{ user, token }` (como o login por senha) |
| DELETE | /passkeys | sim | Desliga o Face ID de todos os aparelhos (204) |

O desafio vai assinado (JWT de 5 min) no `challengeToken`, sem estado no servidor. Verificação de usuário (biometria) é obrigatória.
