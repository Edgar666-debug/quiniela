-- Protect member data used by Realtime / PostgREST.
alter table "TournamentMember" enable row level security;

revoke all on table "TournamentMember" from anon;
grant select on table "TournamentMember" to authenticated;

create policy "tournament_members_select_self"
on "TournamentMember"
for select
to authenticated
using ("userId" = (auth.jwt() ->> 'sub'));

-- Standings are visible to authenticated tournament members only.
alter table "Standing" enable row level security;

revoke all on table "Standing" from anon;
grant select on table "Standing" to authenticated;

create policy "standings_select_tournament_members"
on "Standing"
for select
to authenticated
using (
  exists (
    select 1
    from "TournamentMember" tm
    where tm."tournamentId" = "Standing"."tournamentId"
      and tm."userId" = (auth.jwt() ->> 'sub')
  )
);

-- Enable Realtime replication only for needed tables.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'Standing'
    ) then
      alter publication supabase_realtime add table public."Standing";
    end if;
  end if;
end
$$;
