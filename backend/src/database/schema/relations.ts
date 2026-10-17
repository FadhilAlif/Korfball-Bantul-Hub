import { relations } from "drizzle-orm";
import { athletes } from "./athletes.js";
import { attendances } from "./attendances.js";
import { auditLogs } from "./audit-logs.js";
import { emailVerificationTokens } from "./email-verification-tokens.js";
import { matchEvents } from "./match-events.js";
import { matchPlayers } from "./match-players.js";
import { matches } from "./matches.js";
import { notificationReads, notificationRoles, notifications } from "./notifications.js";
import { passwordResetTokens } from "./password-reset-tokens.js";
import { permissions } from "./permissions.js";
import { refreshTokens } from "./refresh-tokens.js";
import { rolePermissions } from "./role-permissions.js";
import { roles } from "./roles.js";
import { sessions } from "./sessions.js";
import { teams } from "./teams.js";
import { userRoles } from "./user-roles.js";
import { users } from "./users.js";

export const usersRelations = relations(users, ({ one, many }) => ({
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
  auditLogs: many(auditLogs),
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  createdNotifications: many(notifications),
  notificationReads: many(notificationReads),
  athlete: one(athletes, {
    fields: [users.id],
    references: [athletes.userId],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
  notificationRoles: many(notificationRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  creator: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
  }),
  notificationRoles: many(notificationRoles),
  notificationReads: many(notificationReads),
}));

export const notificationRolesRelations = relations(notificationRoles, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationRoles.notificationId],
    references: [notifications.id],
  }),
  role: one(roles, {
    fields: [notificationRoles.roleId],
    references: [roles.id],
  }),
}));

export const notificationReadsRelations = relations(notificationReads, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationReads.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [notificationReads.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  athletes: many(athletes),
  sessions: many(sessions),
  homeMatches: many(matches, { relationName: "homeTeam" }),
  awayMatches: many(matches, { relationName: "awayTeam" }),
}));

export const athletesRelations = relations(athletes, ({ one, many }) => ({
  team: one(teams, {
    fields: [athletes.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [athletes.userId],
    references: [users.id],
  }),
  attendances: many(attendances),
  matchPlayers: many(matchPlayers),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  team: one(teams, {
    fields: [sessions.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [sessions.createdBy],
    references: [users.id],
    relationName: "sessionCreator",
  }),
  finalizer: one(users, {
    fields: [sessions.finalizedBy],
    references: [users.id],
    relationName: "sessionFinalizer",
  }),
  attendances: many(attendances),
  matches: many(matches),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  session: one(sessions, {
    fields: [attendances.sessionId],
    references: [sessions.id],
  }),
  athlete: one(athletes, {
    fields: [attendances.athleteId],
    references: [athletes.id],
  }),
  recorder: one(users, {
    fields: [attendances.recordedBy],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayTeam",
  }),
  session: one(sessions, {
    fields: [matches.sessionId],
    references: [sessions.id],
  }),
  creator: one(users, {
    fields: [matches.createdBy],
    references: [users.id],
    relationName: "matchCreator",
  }),
  finisher: one(users, {
    fields: [matches.finishedBy],
    references: [users.id],
    relationName: "matchFinisher",
  }),
  players: many(matchPlayers),
  events: many(matchEvents),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one, many }) => ({
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
  athlete: one(athletes, {
    fields: [matchPlayers.athleteId],
    references: [athletes.id],
  }),
  events: many(matchEvents, { relationName: "eventActor" }),
  subInEvents: many(matchEvents, { relationName: "eventSubInPlayer" }),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, {
    fields: [matchEvents.matchId],
    references: [matches.id],
  }),
  player: one(matchPlayers, {
    fields: [matchEvents.matchPlayerId],
    references: [matchPlayers.id],
    relationName: "eventActor",
  }),
  subInPlayer: one(matchPlayers, {
    fields: [matchEvents.subInPlayerId],
    references: [matchPlayers.id],
    relationName: "eventSubInPlayer",
  }),
  creator: one(users, {
    fields: [matchEvents.createdBy],
    references: [users.id],
    relationName: "eventCreator",
  }),
  deleter: one(users, {
    fields: [matchEvents.deletedBy],
    references: [users.id],
    relationName: "eventDeleter",
  }),
}));
