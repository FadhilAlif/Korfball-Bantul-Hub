import bcrypt from "bcryptjs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, queryClient } from "../src/database/connection.js";
import {
  athletes,
  roles,
  sessions,
  teams,
  userRoles,
  users,
} from "../src/database/schema/index.js";

const BANTUL_ROSTER: Array<{
  fullName: string;
  nickname: string;
  sex: "MALE" | "FEMALE";
  jerseyNumber: number;
  email?: string;
}> = [
  // 10 Female athletes (including knowledge PDF roster)
  { fullName: "Rukmi Sari", nickname: "Rukmi", sex: "FEMALE", jerseyNumber: 1, email: "rukmi@korfballbantul.id" },
  { fullName: "Rista Putri", nickname: "Rista", sex: "FEMALE", jerseyNumber: 3, email: "rista@korfballbantul.id" },
  { fullName: "Jeni Rahmawati", nickname: "Jeni", sex: "FEMALE", jerseyNumber: 7, email: "jeni@korfballbantul.id" },
  { fullName: "Alifa Nur", nickname: "Alifa", sex: "FEMALE", jerseyNumber: 8 },
  { fullName: "Nadia Kusuma", nickname: "Nadia", sex: "FEMALE", jerseyNumber: 11 },
  { fullName: "Sinta Dewi", nickname: "Sinta", sex: "FEMALE", jerseyNumber: 14 },
  { fullName: "Dinda Ayu", nickname: "Dinda", sex: "FEMALE", jerseyNumber: 15 },
  { fullName: "Larasati Wulandari", nickname: "Laras", sex: "FEMALE", jerseyNumber: 18 },
  { fullName: "Putri Maharani", nickname: "Putri", sex: "FEMALE", jerseyNumber: 21 },
  { fullName: "Tiara Anjani", nickname: "Tiara", sex: "FEMALE", jerseyNumber: 24 },
  // 10 Male athletes (including knowledge PDF roster)
  { fullName: "Irfan Pratama", nickname: "Irfan", sex: "MALE", jerseyNumber: 4, email: "irfan@korfballbantul.id" },
  { fullName: "Radhitya Kurniawan", nickname: "Radhitya", sex: "MALE", jerseyNumber: 6 },
  { fullName: "Faiz Akbar", nickname: "Faiz", sex: "MALE", jerseyNumber: 10 },
  { fullName: "Guntur Saputra", nickname: "Guntur", sex: "MALE", jerseyNumber: 12, email: "guntur@korfballbantul.id" },
  { fullName: "Viki Hidayat", nickname: "Viki", sex: "MALE", jerseyNumber: 13 },
  { fullName: "Ridwan Maulana", nickname: "Ridwan", sex: "MALE", jerseyNumber: 99 },
  { fullName: "Bagas Adi", nickname: "Bagas", sex: "MALE", jerseyNumber: 2 },
  { fullName: "Dimas Wahyu", nickname: "Dimas", sex: "MALE", jerseyNumber: 5 },
  { fullName: "Reza Firmansyah", nickname: "Reza", sex: "MALE", jerseyNumber: 9 },
  { fullName: "Yoga Prasetyo", nickname: "Yoga", sex: "MALE", jerseyNumber: 17 },
];

const OPPONENT_TEAMS = [
  {
    name: "Kab. Klaten",
    shortName: "KLATEN",
    region: "Kab. Klaten, Jawa Tengah",
    color: "#EF4444",
    athletes: [
      { fullName: "Andi Klaten", nickname: "Andi", sex: "MALE" as const, jerseyNumber: 9 },
      { fullName: "Bima Klaten", nickname: "Bima", sex: "MALE" as const, jerseyNumber: 12 },
      { fullName: "Candra Klaten", nickname: "Candra", sex: "MALE" as const, jerseyNumber: 15 },
      { fullName: "Deni Klaten", nickname: "Deni", sex: "MALE" as const, jerseyNumber: 22 },
      { fullName: "Eka Klaten", nickname: "Eka", sex: "FEMALE" as const, jerseyNumber: 2 },
      { fullName: "Fani Klaten", nickname: "Fani", sex: "FEMALE" as const, jerseyNumber: 5 },
      { fullName: "Gita Klaten", nickname: "Gita", sex: "FEMALE" as const, jerseyNumber: 7 },
      { fullName: "Hani Klaten", nickname: "Hani", sex: "FEMALE" as const, jerseyNumber: 10 },
    ],
  },
  {
    name: "Tangerang Selatan",
    shortName: "TANGSEL",
    region: "Kota Tangerang Selatan, Banten",
    color: "#3B82F6",
    athletes: [
      { fullName: "Iqbal Tangsel", nickname: "Iqbal", sex: "MALE" as const, jerseyNumber: 1 },
      { fullName: "Joko Tangsel", nickname: "Joko", sex: "MALE" as const, jerseyNumber: 4 },
      { fullName: "Kevin Tangsel", nickname: "Kevin", sex: "MALE" as const, jerseyNumber: 8 },
      { fullName: "Lutfi Tangsel", nickname: "Lutfi", sex: "MALE" as const, jerseyNumber: 11 },
      { fullName: "Maya Tangsel", nickname: "Maya", sex: "FEMALE" as const, jerseyNumber: 3 },
      { fullName: "Nina Tangsel", nickname: "Nina", sex: "FEMALE" as const, jerseyNumber: 6 },
      { fullName: "Ovi Tangsel", nickname: "Ovi", sex: "FEMALE" as const, jerseyNumber: 9 },
      { fullName: "Pia Tangsel", nickname: "Pia", sex: "FEMALE" as const, jerseyNumber: 14 },
    ],
  },
];

async function upsertUserWithRole(
  email: string,
  fullName: string,
  passwordPlain: string,
  roleId: number,
): Promise<number> {
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId: number;
  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({ fullName, isActive: true, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() })
      .where(eq(users.id, userId));
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email,
        fullName,
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(),
      })
      .returning();
    userId = created.id;
  }

  await db
    .insert(userRoles)
    .values({ userId, roleId })
    .onConflictDoNothing();

  return userId;
}

export async function seedDemo(): Promise<void> {
  console.log("Starting demo data seeding for Korfball Hub...");

  const allRoles = await db.select().from(roles);
  const coachRole = allRoles.find((r) => r.name === "coach");
  const athleteRole = allRoles.find((r) => r.name === "athlete");

  if (!coachRole || !athleteRole) {
    throw new Error("Roles 'coach' and 'athlete' must exist. Run 'npm run seed' first.");
  }

  // 1. Create Coach & Official user
  const coachUserId = await upsertUserWithRole(
    "coach@korfballbantul.id",
    "Coach & Official Bantul",
    "Coach123!",
    coachRole.id,
  );
  console.log("✓ Seeded Coach & Official user: coach@korfballbantul.id (Password: Coach123!)");

  // 2. Get internal team "Korfball Bantul"
  const [internalTeam] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.isInternal, true), isNull(teams.deletedAt)))
    .limit(1);

  if (!internalTeam) {
    throw new Error("Internal team 'Korfball Bantul' not found. Run 'npm run seed' first.");
  }

  // 3. Seed 20 Korfball Bantul athletes + 5 linked athlete accounts
  let linkedCount = 0;
  for (const item of BANTUL_ROSTER) {
    let linkedUserId: number | null = null;
    if (item.email) {
      linkedUserId = await upsertUserWithRole(
        item.email,
        item.fullName,
        "Athlete123!",
        athleteRole.id,
      );
      linkedCount++;
    }

    const [existingAthlete] = await db
      .select()
      .from(athletes)
      .where(
        and(
          eq(athletes.teamId, internalTeam.id),
          sql`lower(${athletes.fullName}) = lower(${item.fullName})`,
          isNull(athletes.deletedAt),
        ),
      )
      .limit(1);

    if (!existingAthlete) {
      await db.insert(athletes).values({
        teamId: internalTeam.id,
        userId: linkedUserId,
        fullName: item.fullName,
        nickname: item.nickname,
        sex: item.sex,
        jerseyNumber: item.jerseyNumber,
        status: "ACTIVE",
      });
    } else if (linkedUserId && !existingAthlete.userId) {
      await db
        .update(athletes)
        .set({ userId: linkedUserId, jerseyNumber: item.jerseyNumber })
        .where(eq(athletes.id, existingAthlete.id));
    }
  }
  console.log(
    `✓ Seeded ${BANTUL_ROSTER.length} Korfball Bantul athletes (${linkedCount} linked to athlete user accounts, Password: Athlete123!)`,
  );

  // 4. Seed opponent teams and their athletes
  for (const opp of OPPONENT_TEAMS) {
    let [oppTeam] = await db
      .select()
      .from(teams)
      .where(and(sql`lower(${teams.name}) = lower(${opp.name})`, isNull(teams.deletedAt)))
      .limit(1);

    if (!oppTeam) {
      [oppTeam] = await db
        .insert(teams)
        .values({
          name: opp.name,
          shortName: opp.shortName,
          isInternal: false,
          region: opp.region,
          color: opp.color,
        })
        .returning();
    }

    for (const player of opp.athletes) {
      const [existingOppAthlete] = await db
        .select()
        .from(athletes)
        .where(
          and(
            eq(athletes.teamId, oppTeam.id),
            sql`lower(${athletes.fullName}) = lower(${player.fullName})`,
            isNull(athletes.deletedAt),
          ),
        )
        .limit(1);

      if (!existingOppAthlete) {
        await db.insert(athletes).values({
          teamId: oppTeam.id,
          fullName: player.fullName,
          nickname: player.nickname,
          sex: player.sex,
          jerseyNumber: player.jerseyNumber,
          status: "ACTIVE",
        });
      }
    }
  }
  console.log(`✓ Seeded ${OPPONENT_TEAMS.length} opponent teams (Kab. Klaten, Tangerang Selatan)`);

  // 5. Seed routine training sessions (Selasa 18:00–20:00 WIB & Sabtu 19:00–21:00 WIB)
  const WIFA_SPORT_CENTER = {
    venue: "WIFA SPORT CENTER",
    latitude: -7.900181586573576,
    longitude: 110.32812616243315,
    radiusMeters: 100,
  };

  const routineSessions = [
    {
      title: "Latihan Rutin Selasa",
      startsAt: new Date("2026-10-20T18:00:00+07:00"),
      endsAt: new Date("2026-10-20T20:00:00+07:00"),
      checkinCode: "SEL18A",
      ...WIFA_SPORT_CENTER,
    },
    {
      title: "Latihan Rutin Sabtu",
      startsAt: new Date("2026-10-24T19:00:00+07:00"),
      endsAt: new Date("2026-10-24T21:00:00+07:00"),
      checkinCode: "SAB19B",
      ...WIFA_SPORT_CENTER,
    },
  ];

  for (const s of routineSessions) {
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.teamId, internalTeam.id),
          eq(sessions.startsAt, s.startsAt),
          isNull(sessions.deletedAt),
        ),
      )
      .limit(1);

    if (!existingSession) {
      await db.insert(sessions).values({
        teamId: internalTeam.id,
        type: "TRAINING",
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        venue: s.venue,
        latitude: s.latitude,
        longitude: s.longitude,
        radiusMeters: s.radiusMeters,
        lateToleranceMinutes: 15,
        checkinCode: s.checkinCode,
        status: "SCHEDULED",
        createdBy: coachUserId,
      });
    } else {
      await db
        .update(sessions)
        .set({
          venue: s.venue,
          latitude: s.latitude,
          longitude: s.longitude,
          radiusMeters: s.radiusMeters,
        })
        .where(eq(sessions.id, existingSession.id));
    }
  }
  console.log("✓ Seeded routine training sessions (Selasa 18:00–20:00 WIB & Sabtu 19:00–21:00 WIB)");
  console.log("\nDemo seed complete.");
}

seedDemo()
  .then(async () => {
    await queryClient.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Demo seed failed:", err);
    await queryClient.end();
    process.exit(1);
  });
