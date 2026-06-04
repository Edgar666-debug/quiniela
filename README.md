# Quiniela

Torneos tipo quiniela por invitación, con jornadas cerradas por horario, picks 1X2 y ranking en vivo.

**Stack:** Next.js 16 (App Router) · React 19 · Better Auth · Prisma 7 + Postgres (Supabase) · Supabase Realtime · API-Football · Resend + React Email · Tailwind CSS 4

## Funcionalidades

- **Torneos por invitación** — máx. 10 participantes; roles OWNER / ORGANIZER / PLAYER.
- **Jornadas** — un solo cierre (UTC); los picks se bloquean al llegar la hora.
- **Quiniela 1X2** — HOME / DRAW / AWAY; 1 punto por acierto.
- **Ranking en vivo** — tabla `Standing` + Supabase Realtime.
- **Partidos desde API-Football** — búsqueda por liga, equipo o jugador; fixtures por fecha o rango.
- **Picks por participante** — ver picks de otros tras el cierre de la jornada.
- **Auth** — email/contraseña (verificación obligatoria), OTP por email, passkeys (WebAuthn), recuperación de contraseña.
- **Cuenta** — perfil, credenciales, sesiones activas, passkeys.
- **Emails** — verificación, OTP, reset de contraseña (Resend).
- **Cron** — sincronización de resultados vía API-Football (`vercel.json`).

## Requisitos

- Node.js **v24 LTS** (recomendado) + **pnpm 11**
- Proyecto [Supabase](https://supabase.com/) (Postgres + Realtime)
- API key de [api-football.com](https://www.api-football.com/)
- Cuenta [Resend](https://resend.com/) para correo transaccional

## Configuración

### 1. Variables de entorno (`.env`)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URI Postgres de Supabase (directa o pooler) |
| `BETTER_AUTH_SECRET` | Secreto ≥ 32 caracteres |
| `BETTER_AUTH_URL` | URL pública de la app (ej. `http://localhost:3000`) |
| `RESEND_API_KEY` | API key de Resend |
| `EMAIL_FROM` | Remitente verificado en Resend |
| `EMAIL_REPLY_TO` | (opcional) Reply-To |
| `PASSKEY_RP_ID` | Dominio passkey (ej. `localhost` en dev) |
| `PASSKEY_RP_NAME` | Nombre mostrado en passkey (ej. `Quiniela`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_JWT_SECRET` | JWT secret (Realtime + RLS) |
| `API_FOOTBALL_KEY` | Key de API-Football |
| `API_FOOTBALL_BASE_URL` | (opcional) Por defecto `https://v3.football.api-sports.io` |
| `CRON_SECRET` | Secreto ≥ 16 caracteres para el cron |

### 2. Base de datos

```bash
pnpm i
npx prisma migrate dev
npx prisma generate
```

`pnpm build` ya ejecuta `prisma generate` antes del build de Next.

### 3. Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Supabase + Prisma (TLS en local)

Si en dev aparece `self-signed certificate in certificate chain` al leer sesión (`Failed to get session`), la conexión Postgres necesita ajuste SSL en el cliente `pg` (no es un fallo del panel de Supabase). Opciones habituales:

- Usar el **Session pooler** (puerto 6543) en `DATABASE_URL`, o
- Configurar el adapter en `src/lib/prisma.ts` con `ssl: { rejectUnauthorized: false }` solo en desarrollo.

Tras cambiar `.env` o `prisma.ts`, reinicia `pnpm dev`.

## Scripts

| Comando | Uso |
|---------|-----|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | `prisma generate` + build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm doctor` | React Doctor (calidad UI/React) |
| `pnpm doctor:ci` | Igual que `doctor`, falla solo en errores |

Configuración de React Doctor: `doctor.config.ts` (p. ej. `deslop/unused-file` desactivado por falsos positivos del App Router).

## Rutas de la app (UI)

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública |
| `/sign-in`, `/sign-up` | Autenticación |
| `/forgot-password`, `/reset-password` | Recuperación de contraseña |
| `/dashboard` | Panel principal (requiere sesión) |
| `/tournaments` | Listado y alta/unión a torneos |
| `/tournaments/[id]` | Resumen del torneo |
| `/tournaments/[id]/matchdays` | Jornadas |
| `/tournaments/[id]/matchdays/[matchdayId]` | Partidos y picks de la jornada |
| `/tournaments/[id]/matchdays/.../matches/new` | Agregar partido (API-Football) |
| `/tournaments/[id]/standings` | Ranking en vivo |
| `/tournaments/[id]/picks` | Picks por participante |
| `/tournaments/[id]/members` | Participantes |
| `/tournaments/[id]/invites` | Invitaciones (OWNER/ORGANIZER) |
| `/account` | Perfil, credenciales, sesiones |
| `/account/passkeys` | Gestión de passkeys |

API de Better Auth: `/api/auth/*`.

## pnpm (supply-chain)

El proyecto usa políticas en `pnpm-workspace.yaml`:

- `minimumReleaseAge: 10080` (7 días)
- `trustPolicy: no-downgrade`
- `blockExoticSubdeps: true`

Si `pnpm i` falla por políticas del lockfile:

```bash
pnpm i --trust-lockfile
```

Puede añadir entradas en `minimumReleaseAgeExclude` / `trustPolicyExclude` (ver comentarios en el YAML).

### Build scripts de dependencias nativas

Si aparece `ERR_PNPM_IGNORED_BUILDS` (Prisma, sharp, etc.):

```bash
pnpm approve-builds
pnpm rebuild
```

## Cron (Vercel)

En `vercel.json`:

- **Ruta:** `/api/cron/sync-live`
- **Programación:** `0 0 * * *` (una vez al día, medianoche UTC)

Autenticación: `Authorization: Bearer $CRON_SECRET` o cabecera `x-cron-secret`.

## API (resumen)

### Torneos y miembros

- `POST /api/tournaments` — crear torneo
- `GET/PATCH /api/tournaments/[id]` — detalle / actualizar
- `POST /api/tournaments/[id]/leave` — abandonar torneo
- `POST /api/tournaments/[id]/invites` — crear invitación
- `POST /api/invites/[token]/join` — unirse con token
- `GET /api/tournaments/[id]/standings` — ranking (miembro)
- `GET /api/me/tournaments` — torneos del usuario
- `DELETE /api/tournaments/[id]/members/[userId]` — expulsar miembro

### Jornadas y partidos

- `POST /api/tournaments/[id]/matchdays` — crear jornada
- `GET /api/tournaments/[id]/matchdays/list` — listar jornadas
- `GET /api/matchdays/[id]/detail` — partidos de la jornada
- `POST /api/matchdays/[id]/matches` — crear partido
- `POST /api/matches/[id]/pick` — guardar pick (antes del cierre)
- `GET /api/matchdays/[id]/participants/[userId]` — picks de un participante

### API-Football (sesión requerida; rate limit)

- `GET /api/api-football/leagues/search?q=...`
- `GET /api/api-football/teams/search?q=...`
- `GET /api/api-football/players/search?q=...`
- `GET /api/api-football/fixtures/search` — filtros: `league`, `season`, `team`, `player`, `date`, `from`, `to`
- `GET /api/api-football/fixtures/[fixtureId]`
- `GET /api/internal/api-football/fixtures/[fixtureId]` — uso interno/cron

### Cuenta y realtime

- `GET/PATCH /api/me/profile`
- `GET /api/me/sessions` · `DELETE /api/me/sessions/[id]`
- `GET /api/supabase/realtime-token` — JWT corto para Realtime

## Estructura del código

```
src/
  app/
    (app)/          # Rutas autenticadas (layout + AppShell)
    (auth)/         # sign-in, sign-up, forgot/reset password
    api/            # Route handlers
    page.tsx        # Landing
  components/       # UI (shadcn-style) y shell de la app
  emails/           # Plantillas React Email
  hooks/            # p. ej. useStandingsRealtime
  lib/              # auth, prisma, api-football, env, email, etc.
prisma/             # schema y migraciones
doctor.config.ts    # React Doctor
pnpm-workspace.yaml # Políticas pnpm
```

## Desarrollo con túnel (opcional)

Si usas ngrok o similar, añade el origen público en `trustedOrigins` de `src/lib/auth.ts` (ver comentario en el archivo).
