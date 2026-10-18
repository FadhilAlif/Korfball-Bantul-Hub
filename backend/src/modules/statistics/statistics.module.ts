import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { StatisticsController } from "./statistics.controller.js";
import { StatisticsService } from "./statistics.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
