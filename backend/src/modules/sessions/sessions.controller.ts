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
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { RequirePermissions } from "../../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../../common/guards/permissions.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type.js";
import {
  type CreateSessionInput,
  type GenerateRoutineInput,
  type ListSessionsQuery,
  type UpdateSessionInput,
  createSessionSchema,
  generateRoutineSchema,
  listSessionsQuerySchema,
  updateSessionSchema,
} from "./sessions.schemas.js";
import { SessionsService } from "./sessions.service.js";

@ApiTags("Sessions")
@Controller("api/sessions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionsController {
  constructor(@Inject(SessionsService) private readonly sessionsService: SessionsService) {}

  @Get()
  @RequirePermissions("sessions:read")
  @UsePipes(new ZodValidationPipe(listSessionsQuerySchema, "query"))
  async listSessions(@Query() query: ListSessionsQuery, @CurrentUser() user?: AuthenticatedUser) {
    const canViewCheckinCode = Boolean(
      user?.roles?.includes("admin") ||
        user?.permissions?.includes("attendance:record") ||
        user?.permissions?.includes("sessions:update"),
    );
    return this.sessionsService.listSessions(query, canViewCheckinCode);
  }

  @Get(":id")
  @RequirePermissions("sessions:read")
  async getSession(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthenticatedUser) {
    const canViewCheckinCode = Boolean(
      user?.roles?.includes("admin") ||
        user?.permissions?.includes("attendance:record") ||
        user?.permissions?.includes("sessions:update"),
    );
    const session = await this.sessionsService.getSession(id, canViewCheckinCode);
    return { data: session };
  }

  @Audit({ action: "sessions:create", resourceType: "sessions" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sessions:create")
  @UsePipes(new ZodValidationPipe(createSessionSchema))
  async createSession(@Body() input: CreateSessionInput, @CurrentUser("id") userId: number) {
    const created = await this.sessionsService.createSession(input, userId);
    return {
      message: "Sesi berhasil dibuat.",
      data: created,
    };
  }

  @Audit({ action: "sessions:generate_routine", resourceType: "sessions" })
  @Post("generate-routine")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sessions:create")
  @UsePipes(new ZodValidationPipe(generateRoutineSchema))
  async generateRoutine(@Body() input: GenerateRoutineInput, @CurrentUser("id") userId: number) {
    const result = await this.sessionsService.generateRoutine(input, userId);
    return {
      message: `Berhasil membuat ${result.createdCount} sesi rutin (${result.skippedCount} sesi sudah ada/dilewati).`,
      data: result,
    };
  }

  @Audit({ action: "sessions:update", resourceType: "sessions", resourceIdParam: "id" })
  @Patch(":id")
  @RequirePermissions("sessions:update")
  @UsePipes(new ZodValidationPipe(updateSessionSchema))
  async updateSession(@Param("id", ParseIntPipe) id: number, @Body() input: UpdateSessionInput) {
    const updated = await this.sessionsService.updateSession(id, input);
    return {
      message: "Sesi berhasil diperbarui.",
      data: updated,
    };
  }

  @Audit({ action: "sessions:cancel", resourceType: "sessions", resourceIdParam: "id" })
  @Post(":id/cancel")
  @RequirePermissions("sessions:update")
  async cancelSession(@Param("id", ParseIntPipe) id: number) {
    const cancelled = await this.sessionsService.cancelSession(id);
    return {
      message: "Sesi berhasil dibatalkan.",
      data: cancelled,
    };
  }

  @Audit({ action: "sessions:regenerate_code", resourceType: "sessions", resourceIdParam: "id" })
  @Post(":id/checkin-code")
  @RequirePermissions("attendance:record")
  async regenerateCheckinCode(@Param("id", ParseIntPipe) id: number) {
    const result = await this.sessionsService.regenerateCheckinCode(id);
    return {
      message: "Kode check-in berhasil diperbarui.",
      data: result,
    };
  }

  @Audit({ action: "sessions:delete", resourceType: "sessions", resourceIdParam: "id" })
  @Delete(":id")
  @RequirePermissions("sessions:delete")
  async deleteSession(@Param("id", ParseIntPipe) id: number) {
    await this.sessionsService.deleteSession(id);
    return {
      message: "Sesi berhasil dihapus.",
      data: null,
    };
  }
}
