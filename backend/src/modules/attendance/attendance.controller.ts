import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { RequirePermissions } from "../../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../../common/guards/permissions.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import {
  type AttendanceSummaryQuery,
  type BulkAttendanceInput,
  type ExcuseRequestInput,
  type MyAttendanceQuery,
  type SelfCheckinInput,
  attendanceSummaryQuerySchema,
  bulkAttendanceRecordSchema,
  excuseRequestSchema,
  myAttendanceQuerySchema,
  selfCheckinSchema,
} from "./attendance.schemas.js";
import { AttendanceService } from "./attendance.service.js";

@ApiTags("Attendance")
@Controller("api")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(@Inject(AttendanceService) private readonly attendanceService: AttendanceService) {}

  @Get("sessions/:id/attendance")
  @RequirePermissions("attendance:read")
  async getSessionAttendanceSheet(@Param("id", ParseIntPipe) id: number) {
    const sheet = await this.attendanceService.getSessionAttendanceSheet(id);
    return { data: sheet };
  }

  @Audit({ action: "attendance:bulk_record", resourceType: "sessions", resourceIdParam: "id" })
  @Put("sessions/:id/attendance")
  @RequirePermissions("attendance:record")
  @UsePipes(new ZodValidationPipe(bulkAttendanceRecordSchema))
  async bulkUpdateAttendance(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: BulkAttendanceInput,
    @CurrentUser("id") userId: number,
  ) {
    const sheet = await this.attendanceService.bulkUpdateAttendance(id, input, userId);
    return {
      message: "Data presensi berhasil disimpan.",
      data: sheet,
    };
  }

  @Audit({ action: "sessions:finalize", resourceType: "sessions", resourceIdParam: "id" })
  @Post("sessions/:id/finalize")
  @RequirePermissions("attendance:record")
  async finalizeSession(@Param("id", ParseIntPipe) id: number, @CurrentUser("id") userId: number) {
    const sheet = await this.attendanceService.finalizeSession(id, userId);
    return {
      message: "Sesi berhasil difinalisasi. Atlet tanpa catatan otomatis ditandai Absen.",
      data: sheet,
    };
  }

  @Audit({ action: "attendance:submit_excuse", resourceType: "sessions", resourceIdParam: "id" })
  @Post("sessions/:id/excuse")
  @RequirePermissions("attendance:self")
  @UsePipes(new ZodValidationPipe(excuseRequestSchema))
  async submitExcuse(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: ExcuseRequestInput,
    @CurrentUser("id") userId: number,
  ) {
    const result = await this.attendanceService.submitExcuse(id, input.reason, userId);
    return {
      message: result.message,
      data: result,
    };
  }

  @Audit({ action: "attendance:cancel_excuse", resourceType: "sessions", resourceIdParam: "id" })
  @Delete("sessions/:id/excuse")
  @RequirePermissions("attendance:self")
  async cancelExcuse(@Param("id", ParseIntPipe) id: number, @CurrentUser("id") userId: number) {
    await this.attendanceService.cancelExcuse(id, userId);
    return {
      message: "Pengajuan izin berhasil dibatalkan.",
      data: null,
    };
  }

  @Audit({ action: "attendance:self_checkin", resourceType: "attendances" })
  @Post("attendance/check-in")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("attendance:self")
  @UsePipes(new ZodValidationPipe(selfCheckinSchema))
  async selfCheckin(@Body() input: SelfCheckinInput, @CurrentUser("id") userId: number) {
    const result = await this.attendanceService.selfCheckin(input.code, userId);
    return {
      message: result.message,
      data: result,
    };
  }

  @Get("attendance/me")
  @RequirePermissions("attendance:self")
  @UsePipes(new ZodValidationPipe(myAttendanceQuerySchema, "query"))
  async getMyAttendanceHistory(@CurrentUser("id") userId: number, @Query() query: MyAttendanceQuery) {
    const result = await this.attendanceService.getMyAttendanceHistory(userId, query);
    return { data: result };
  }

  @Get("attendance/summary")
  @RequirePermissions("attendance:read")
  @UsePipes(new ZodValidationPipe(attendanceSummaryQuerySchema, "query"))
  async getAttendanceSummary(@Query() query: AttendanceSummaryQuery) {
    const result = await this.attendanceService.getAttendanceSummary(query);
    return { data: result };
  }

  @Get("attendance/summary/export")
  @RequirePermissions("attendance:export")
  @UsePipes(new ZodValidationPipe(attendanceSummaryQuerySchema, "query"))
  async exportAttendanceSummary(@Query() query: AttendanceSummaryQuery, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.attendanceService.buildAttendanceExportWorkbook(query);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `presensi-korfball-bantul-${dateStr}.xlsx`;

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}
