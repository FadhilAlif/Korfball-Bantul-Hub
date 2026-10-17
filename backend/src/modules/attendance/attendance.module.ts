import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller.js";
import { AttendanceService } from "./attendance.service.js";
import { CheckinThrottleService } from "./checkin-throttle.service.js";

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, CheckinThrottleService],
  exports: [AttendanceService, CheckinThrottleService],
})
export class AttendanceModule {}
