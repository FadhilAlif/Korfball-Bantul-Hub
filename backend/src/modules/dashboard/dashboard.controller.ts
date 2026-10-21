import { Controller, Get, Inject, Query, Res, StreamableFile, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type.js";
import { DashboardService } from "./dashboard.service.js";

@ApiTags("Dashboard")
@Controller("api/dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
  ) {}

  @Get("summary")
  async getDashboardSummary(@CurrentUser() user: AuthenticatedUser) {
    const summary = await this.dashboardService.getDashboardSummary(user);
    return { data: summary };
  }

  @Get("attendance-trend")
  async getAttendanceTrend(
    @CurrentUser() user: AuthenticatedUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const trend = await this.dashboardService.getAttendanceTrend(user, from, to);
    return { data: trend };
  }

  @Get("stats")
  async getStats() {
    const stats = await this.dashboardService.getDashboardStats();
    return { data: stats };
  }

  @Get("role-distribution")
  async getRoleDistribution() {
    const distribution = await this.dashboardService.getRoleDistribution();
    return { data: distribution };
  }

  @Get("export")
  async exportDashboard(@Res({ passthrough: true }) res: Response) {
    const buffer = await this.dashboardService.buildExportWorkbook();

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="dashboard.xlsx"',
    });

    return new StreamableFile(buffer);
  }
}
