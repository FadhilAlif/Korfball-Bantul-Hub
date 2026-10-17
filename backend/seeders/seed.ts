import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, queryClient } from "../src/database/connection.js";
import { permissions, rolePermissions, roles, teams } from "../src/database/schema/index.js";

export const DEFAULT_PERMISSIONS = [
  // Template RBAC & System permissions
  { name: "users:read", description: "View list and detail of users" },
  { name: "users:create", description: "Create new users" },
  { name: "users:update", description: "Update existing users" },
  { name: "users:delete", description: "Delete users" },
  { name: "roles:read", description: "View list and detail of roles" },
  { name: "roles:create", description: "Create new roles" },
  { name: "roles:update", description: "Update existing roles" },
  { name: "roles:delete", description: "Delete roles" },
  { name: "permissions:read", description: "View list and detail of permissions" },
  { name: "permissions:create", description: "Create new permissions" },
  { name: "permissions:update", description: "Update existing permissions" },
  { name: "permissions:delete", description: "Delete permissions" },
  { name: "audit_logs:read", description: "View audit logs" },
  { name: "notifications:create", description: "Broadcast notifications to selected roles" },

  // Korfball Hub Domain Permissions (PRD §3.1)
  { name: "teams:read", description: "View internal and opponent teams" },
  { name: "teams:create", description: "Create new teams" },
  { name: "teams:update", description: "Update existing teams" },
  { name: "teams:delete", description: "Delete teams without history" },

  { name: "athletes:read", description: "View list and profile of athletes" },
  { name: "athletes:create", description: "Create new athlete profiles" },
  { name: "athletes:update", description: "Update athlete profiles and link user accounts" },
  { name: "athletes:delete", description: "Delete athletes without history" },

  { name: "sessions:read", description: "View training and match sessions" },
  { name: "sessions:create", description: "Create sessions and generate routine training schedules" },
  { name: "sessions:update", description: "Update or cancel sessions" },
  { name: "sessions:delete", description: "Delete sessions without attendance records" },

  { name: "attendance:read", description: "View attendance records of all athletes" },
  { name: "attendance:record", description: "Record or update attendance manually and finalize sessions" },
  { name: "attendance:self", description: "Perform self check-in and submit excuse requests" },
  { name: "attendance:export", description: "Export attendance summaries to XLSX" },

  { name: "matches:read", description: "View matches, lineups, and box scores" },
  { name: "matches:create", description: "Create new matches" },
  { name: "matches:update", description: "Update match details and lineups" },
  { name: "matches:delete", description: "Delete scheduled matches without events" },
  { name: "matches:record", description: "Record live match events, control game clock, and finish matches" },
  { name: "matches:reopen", description: "Reopen finished matches for official score/stat correction" },

  { name: "stats:read", description: "View aggregate statistics for all players and teams" },
  { name: "stats:read_own", description: "View personal match statistics and attendance history" },
  { name: "stats:export", description: "Export match reports and player statistics to XLSX" },
];

export const DEFAULT_ROLES = [
  {
    name: "admin",
    description: "SuperAdmin / Manager — Full system access across all features",
  },
  {
    name: "coach",
    description:
      "Coach & Official — Manage teams/athletes, training attendance sessions, and live match statistics",
  },
  {
    name: "athlete",
    description: "Athlete — Self check-in attendance, excuse requests, and personal match statistics",
  },
  {
    name: "user",
    description: "Basic user — Default fallback role for newly registered unverified accounts",
  },
];

export const COACH_PERMISSION_NAMES = [
  "teams:read",
  "teams:create",
  "teams:update",
  "athletes:read",
  "athletes:create",
  "athletes:update",
  "sessions:read",
  "sessions:create",
  "sessions:update",
  "attendance:read",
  "attendance:record",
  "attendance:export",
  "matches:read",
  "matches:create",
  "matches:update",
  "matches:record",
  "stats:read",
  "stats:read_own",
  "stats:export",
];

export const ATHLETE_PERMISSION_NAMES = [
  "teams:read",
  "sessions:read",
  "attendance:self",
  "matches:read",
  "stats:read_own",
];

export async function seed(): Promise<void> {
  console.log("Starting database seeding with Drizzle ORM...");

  // 1. Seed permissions (idempotent upsert)
  for (const perm of DEFAULT_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ name: perm.name, description: perm.description })
      .onConflictDoUpdate({
        target: permissions.name,
        set: { description: perm.description, updatedAt: new Date() },
      });
  }
  console.log(`✓ Seeded ${DEFAULT_PERMISSIONS.length} permissions`);

  // 2. Seed roles (idempotent upsert)
  for (const role of DEFAULT_ROLES) {
    await db
      .insert(roles)
      .values({ name: role.name, description: role.description })
      .onConflictDoUpdate({
        target: roles.name,
        set: { description: role.description, updatedAt: new Date() },
      });
  }
  console.log(`✓ Seeded ${DEFAULT_ROLES.length} roles (admin, coach, athlete, user)`);

  // 3. Load roles and permissions from DB
  const allRoles = await db.select().from(roles);
  const roleByName = new Map(allRoles.map((r) => [r.name, r]));
  const allPermissions = await db.select().from(permissions);
  const permByName = new Map(allPermissions.map((p) => [p.name, p]));

  const adminRole = roleByName.get("admin");
  const coachRole = roleByName.get("coach");
  const athleteRole = roleByName.get("athlete");

  if (!adminRole || !coachRole || !athleteRole) {
    throw new Error("Required operational roles (admin, coach, athlete) not found after insert");
  }

  // Assign all permissions to admin role
  for (const perm of allPermissions) {
    await db
      .insert(rolePermissions)
      .values({
        roleId: adminRole.id,
        permissionId: perm.id,
      })
      .onConflictDoNothing();
  }
  console.log(`✓ Assigned all ${allPermissions.length} permissions to 'admin' role`);

  // Sync permissions for coach role (PRD §3.2)
  const coachPermIds = COACH_PERMISSION_NAMES.map((name) => permByName.get(name)?.id).filter(
    (id): id is number => id !== undefined,
  );
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, coachRole.id));
  if (coachPermIds.length > 0) {
    await db
      .insert(rolePermissions)
      .values(coachPermIds.map((permissionId) => ({ roleId: coachRole.id, permissionId })))
      .onConflictDoNothing();
  }
  console.log(`✓ Assigned ${coachPermIds.length} permissions to 'coach' (Coach & Official) role`);

  // Sync permissions for athlete role (PRD §3.2)
  const athletePermIds = ATHLETE_PERMISSION_NAMES.map((name) => permByName.get(name)?.id).filter(
    (id): id is number => id !== undefined,
  );
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, athleteRole.id));
  if (athletePermIds.length > 0) {
    await db
      .insert(rolePermissions)
      .values(athletePermIds.map((permissionId) => ({ roleId: athleteRole.id, permissionId })))
      .onConflictDoNothing();
  }
  console.log(`✓ Assigned ${athletePermIds.length} permissions to 'athlete' role`);

  // Remove any legacy non-operational roles ('official' if created previously) that have no users
  const legacyRoles = allRoles.filter((r) => r.name === "official");
  if (legacyRoles.length > 0) {
    await db.delete(roles).where(
      inArray(
        roles.id,
        legacyRoles.map((r) => r.id),
      ),
    );
  }

  // 4. Seed internal team "Korfball Bantul" (idempotent)
  const [existingInternalTeam] = await db
    .select()
    .from(teams)
    .where(and(sql`lower(${teams.name}) = 'korfball bantul'`, isNull(teams.deletedAt)))
    .limit(1);

  if (!existingInternalTeam) {
    await db.insert(teams).values({
      name: "Korfball Bantul",
      shortName: "BANTUL",
      isInternal: true,
      region: "Kab. Bantul, DI Yogyakarta",
      color: "#FACC15",
    });
    console.log("✓ Seeded internal team 'Korfball Bantul'");
  } else {
    await db
      .update(teams)
      .set({
        shortName: "BANTUL",
        isInternal: true,
        region: "Kab. Bantul, DI Yogyakarta",
        color: "#FACC15",
      })
      .where(eq(teams.id, existingInternalTeam.id));
    console.log("✓ Verified internal team 'Korfball Bantul'");
  }

  console.log("\nSeed complete.");
}

seed()
  .then(async () => {
    await queryClient.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await queryClient.end();
    process.exit(1);
  });
