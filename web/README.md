# Quiniela (Next.js + Better Auth + Supabase + API-Football)

MVP:
- Torneos por invitación (máx 10 participantes).
- Jornadas con un solo horario de cierre.
- Quiniela 1X2 (HOME/DRAW/AWAY): 1 punto por acierto.
- Ranking en vivo (vía Supabase Realtime sobre la tabla `Standing`).
- Sync de resultados con API-Football + cron en Vercel (`web/vercel.json`).

## Requisitos
- Node.js + npm
- Supabase (Postgres)
- API key de [api-football.com](https://www.api-football.com/)

## Configuración
1) Copia tus variables en `web/.env`:
   - `DATABASE_URL` (Supabase Postgres)
   - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `API_FOOTBALL_KEY`
   - `CRON_SECRET`

2) Migra la base:
```bash
cd web
npx prisma migrate dev
```

3) Dev server:
```bash
npm run dev
```

## Cron (Vercel)
- Está configurado en `web/vercel.json` para pegarle a `/api/cron/sync-live` cada 2 minutos.
- El endpoint acepta `Authorization: Bearer $CRON_SECRET` (y fallback por `x-cron-secret` o `?cronSecret=`).

## Endpoints (MVP)
- `POST /api/tournaments` crea torneo
- `POST /api/tournaments/:id/invites` crea invitación
- `POST /api/invites/:token/join` unirse
- `POST /api/tournaments/:id/matchdays` crear jornada
- `POST /api/matchdays/:id/matches` crear partido
- `POST /api/matches/:id/pick` guardar pick (antes del cierre)
- `GET /api/tournaments/:id/standings` ver ranking (requiere ser miembro)
