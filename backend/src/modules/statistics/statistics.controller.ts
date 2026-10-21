import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { RequirePermissions } from "../../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../../common/guards/permissions.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type.js";
import {
  type PlayerLeaderboardQuery,
  type TeamStatsQuery,
  playerLeaderboardQuerySchema,
  teamStatsQuerySchema,
} from "./statistics.schemas.js";
import { StatisticsService } from "./statistics.service.js";

@ApiTags("Statistics")
@Controller("api/stats")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatisticsController {
  constructor(
    @Inject(StatisticsService)
    private readonly statisticsService: StatisticsService,
  ) {}

  @Get("players")
  @RequirePermissions("stats:read", "stats:read_own")
  @UsePipes(new ZodValidationPipe(playerLeaderboardQuerySchema, "query"))
  async getPlayerLeaderboard(@Query() query: PlayerLeaderboardQuery) {
    const result = await this.statisticsService.getPlayerLeaderboard(query);
    return { data: result.data, meta: result.meta };
  }

  @Get("players/export")
  @RequirePermissions("stats:export")
  @UsePipes(new ZodValidationPipe(playerLeaderboardQuerySchema, "query"))
  async exportPlayerLeaderboard(@Query() query: PlayerLeaderboardQuery, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.statisticsService.exportPlayerLeaderboard(query);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `statistik-pemain-korfball-bantul-${dateStr}.xlsx`;

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get("players/:athleteId")
  async getPlayerProfile(@Param("athleteId", ParseIntPipe) athleteId: number, @CurrentUser() user: AuthenticatedUser) {
    const hasFullAccess = user.permissions?.includes("stats:read") || user.roles?.includes("admin");
    const data = await this.statisticsService.getPlayerProfile(athleteId, user.id, hasFullAccess);
    return { data };
  }

  @Get("me")
  @RequirePermissions("stats:read_own")
  async getMyStats(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.statisticsService.getMyStats(user.id);
    return { data };
  }

  @Get("team")
  @RequirePermissions("stats:read", "stats:read_own")
  @UsePipes(new ZodValidationPipe(teamStatsQuerySchema, "query"))
  async getTeamStats(@Query() query: TeamStatsQuery) {
    const data = await this.statisticsService.getTeamStats(query);
    return { data };
  }
}
