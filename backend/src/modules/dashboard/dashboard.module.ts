import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { StatisticsModule } from "../statistics/statistics.module.js";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";

@Module({
  imports: [DatabaseModule, StatisticsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
