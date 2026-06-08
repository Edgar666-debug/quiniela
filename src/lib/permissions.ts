export type MemberRole = "OWNER" | "ORGANIZER" | "PLAYER";
export type TournamentStatus = "ACTIVE" | "FINISHED" | "ARCHIVED";

export function canManageMatchdays(role: MemberRole) {
  return role === "OWNER" || role === "ORGANIZER";
}

export function canEditTournament(role: MemberRole) {
  return role === "OWNER";
}

export function canManageTournament(role: MemberRole) {
  return role === "OWNER" || role === "ORGANIZER";
}
