# Quiniela

Torneos tipo quiniela por invitación, con jornadas cerradas por horario, picks 1X2 y ranking en vivo.

**Stack:** Next.js 16 (App Router) · React 19 · Better Auth · Prisma 7 + Postgres (Supabase) · Supabase Realtime · API-Football · Resend + React Email · Tailwind CSS 4

## Funcionalidades

- **Torneos por invitación** — máx. 10 participantes; roles OWNER / ORGANIZER / PLAYER; token manual o envío por email.
- **Jornadas** — un solo cierre (UTC); los picks se bloquean al llegar la hora.
- **Quiniela 1X2** — HOME / DRAW / AWAY; 1 punto por acierto.
- **Ranking en vivo** — tabla `Standing` + Supabase Realtime.
- **Partidos desde API-Football** — búsqueda por liga, equipo o jugador; fixtures por fecha o rango.
- **Picks por participante** — ver picks de otros tras el cierre de la jornada.
- **Auth** — email/contraseña (verificación obligatoria), OTP por email, passkeys (WebAuthn), recuperación de contraseña.
- **Cuenta** — perfil, credenciales, sesiones activas, passkeys.
- **Emails** — verificación, OTP, reset de contraseña e invitaciones (Resend).
- **Cron** — sincronización de resultados vía API-Football (`vercel.json`)

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
| `BETTER_AUTH_TRUSTED_ORIGINS` | (opcional) Orígenes extra separados por coma o salto de línea para túneles/previews |
| `RESEND_API_KEY` | API key de Resend |
| `EMAIL_FROM` | Remitente verificado en Resend |
| `EMAIL_REPLY_TO` | (opcional) Reply-To |
| `PASSKEY_RP_ID` | Dominio passkey (ej. `localhost` en dev) |
| `PASSKEY_RP_NAME` | Nombre mostrado en passkey (ej. `Quiniela`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key para operaciones server-side de Storage |
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

### Supabase Storage (avatares + logos)

La app puede subir avatares y logos de torneo a Supabase Storage.

- Aplica `docs/supabase-storage.sql` en el SQL Editor de Supabase
- Se crean/aseguran dos buckets **públicos**: `avatars` y `tournament-assets`
- El backend usa `SUPABASE_SERVICE_ROLE_KEY` para generar signed upload URLs
- Los avatares se guardan con ruta estable por usuario: `users/<userId>/avatar`
- Los logos de torneo se guardan con ruta estable por torneo: `tournaments/<tournamentId>/logo`
- Solo el OWNER puede subir logo de torneo desde la UI de administración
- El formulario de **Crear torneo** ya permite iniciar con logo por URL o subida a Storage
- Los logos también se reflejan en dashboard, vistas de torneo e invitaciones por email
- El flujo de `Unirme por invitación` muestra una vista previa del torneo antes de confirmar
- Las vistas principales (`jornadas`, `ranking`, `participantes`, `picks`) comparten header visual del torneo con logo
- La navegación lateral y móvil también muestra el logo del torneo activo cuando existe

El SQL también deja listas policies básicas para avatares. Los logos de torneo se suben vía signed URLs generadas server-side, así que los writes directos quedan cerrados por defecto.

El flujo actual de perfil también sigue aceptando URL pública manual si no quieres usar Storage.

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

Nota: `src/proxy.ts` protege solo rutas de UI. Los `route handlers` bajo `/api/*` validan sesión/autorización por su cuenta y responden `401/403` JSON cuando aplica.

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
- **Programación:** `*/15 * * * *` (cada 15 minutos)

Autenticación: `Authorization: Bearer $CRON_SECRET` o cabecera `x-cron-secret`.

## API (resumen)

### Torneos y miembros

- `POST /api/tournaments` — crear torneo
- `GET/PATCH /api/tournaments/[id]` — detalle / actualizar
- `POST /api/tournaments/[id]/leave` — abandonar torneo
- `POST /api/tournaments/[id]/invites` — crear invitación (token o envío por email)
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
- `POST /api/me/avatar/upload-url` — signed upload URL para avatar
- `POST /api/tournaments/[id]/logo/upload-url` — signed upload URL para logo de torneo (OWNER)
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

## Desarrollo con túnel / previews (opcional)

Si usas ngrok, Cloudflare Tunnel o previews con dominio distinto al `BETTER_AUTH_URL`, añade esos orígenes en `BETTER_AUTH_TRUSTED_ORIGINS`.

Ejemplo:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=https://mi-tunel.ngrok-free.app,https://mi-preview.vercel.app
```

También puedes separar valores por saltos de línea. El código en `src/lib/auth.ts` siempre incluye `BETTER_AUTH_URL` y deduplica los extras.
