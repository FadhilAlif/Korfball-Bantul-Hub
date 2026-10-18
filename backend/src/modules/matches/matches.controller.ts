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
  type BatchEventsInput,
  type ClockPatchInput,
  type CreateMatchInput,
  type ListEventsQuery,
  type ListMatchesQuery,
  type SetLineupInput,
  type StartMatchInput,
  type UpdateEventInput,
  type UpdateMatchInput,
  batchEventsSchema,
  clockPatchSchema,
  createMatchSchema,
  listEventsQuerySchema,
  listMatchesQuerySchema,
  setLineupSchema,
  startMatchSchema,
  updateEventSchema,
  updateMatchSchema,
} from "./matches.schemas.js";
import { MatchesService } from "./matches.service.js";

@ApiTags("Matches")
@Controller("api/matches")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MatchesController {
  constructor(@Inject(MatchesService) private readonly matchesService: MatchesService) {}

  @Get()
  @RequirePermissions("matches:read")
  @UsePipes(new ZodValidationPipe(listMatchesQuerySchema, "query"))
  async listMatches(@Query() query: ListMatchesQuery) {
    const result = await this.matchesService.listMatches(query);
    return {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Post()
  @RequirePermissions("matches:create")
  @Audit({ action: "matches:create", resourceType: "matches" })
  @UsePipes(new ZodValidationPipe(createMatchSchema))
  async createMatch(@Body() input: CreateMatchInput, @CurrentUser("id") userId: number) {
    const match = await this.matchesService.createMatch(input, userId);
    return { data: match, message: "Pertandingan berhasil dibuat." };
  }

  @Get(":id")
  @RequirePermissions("matches:read")
  async getMatch(@Param("id", ParseIntPipe) id: number) {
    const match = await this.matchesService.getMatch(id);
    return { data: match };
  }

  @Patch(":id")
  @RequirePermissions("matches:update")
  @Audit({ action: "matches:update", resourceType: "matches", resourceIdParam: "id" })
  @UsePipes(new ZodValidationPipe(updateMatchSchema))
  async updateMatch(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: UpdateMatchInput,
    @CurrentUser("id") userId: number,
  ) {
    const updated = await this.matchesService.updateMatch(id, input, userId);
    return { data: updated, message: "Pertandingan berhasil diperbarui." };
  }

  @Delete(":id")
  @RequirePermissions("matches:delete")
  @Audit({ action: "matches:delete", resourceType: "matches", resourceIdParam: "id" })
  async deleteMatch(@Param("id", ParseIntPipe) id: number, @CurrentUser("id") userId: number) {
    const result = await this.matchesService.deleteMatch(id, userId);
    return result;
  }

  @Put(":id/lineup")
  @RequirePermissions("matches:update")
  @Audit({ action: "matches:set_lineup", resourceType: "matches", resourceIdParam: "id" })
  @UsePipes(new ZodValidationPipe(setLineupSchema))
  async setLineup(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: SetLineupInput,
    @CurrentUser("id") userId: number,
  ) {
    const match = await this.matchesService.setLineup(id, input, userId);
    return { data: match, message: `Lineup sisi ${input.side} berhasil disimpan.` };
  }

  @Post(":id/start")
  @RequirePermissions("matches:record")
  @Audit({ action: "matches:start", resourceType: "matches", resourceIdParam: "id" })
  @UsePipes(new ZodValidationPipe(startMatchSchema))
  async startMatch(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: StartMatchInput,
    @CurrentUser("id") userId: number,
  ) {
    const match = await this.matchesService.startMatch(id, input, userId);
    return { data: match, message: "Pertandingan dimulai (LIVE)." };
  }

  @Post(":id/periods/:period/start")
  @RequirePermissions("matches:record")
  @Audit({ action: "matches:start_period", resourceType: "matches", resourceIdParam: "id" })
  async startPeriod(
    @Param("id", ParseIntPipe) id: number,
    @Param("period", ParseIntPipe) period: number,
    @CurrentUser("id") userId: number,
  ) {
    const match = await this.matchesService.startPeriod(id, period, userId);
    return { data: match, message: `Babak ${period} dimulai.` };
  }

  @Post(":id/periods/:period/end")
  @RequirePermissions("matches:record")
  @Audit({ action: "matches:end_period", resourceType: "matches", resourceIdParam: "id" })
  async endPeriod(
    @Param("id", ParseIntPipe) id: number,
    @Param("period", ParseIntPipe) period: number,
    @CurrentUser("id") userId: number,
  ) {
    const match = await this.matchesService.endPeriod(id, period, userId);
    return { data: match, message: `Babak ${period} diakhiri.` };
  }

  @Patch(":id/clock")
  @RequirePermissions("matches:record")
  @UsePipes(new ZodValidationPipe(clockPatchSchema))
  async patchClock(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: ClockPatchInput,
    @CurrentUser("id") userId: number,
  ) {
    const match = await this.matchesService.patchClock(id, input, userId);
    return { data: match };
  }

  @Post(":id/finish")
  @RequirePermissions("matches:record")
  @Audit({ action: "matches:finish", resourceType: "matches", resourceIdParam: "id" })
  async finishMatch(@Param("id", ParseIntPipe) id: number, @CurrentUser("id") userId: number) {
    const match = await this.matchesService.finishMatch(id, userId);
    return { data: match, message: "Pertandingan telah diselesaikan." };
  }

  @Post(":id/reopen")
  @RequirePermissions("matches:reopen")
  @Audit({ action: "matches:reopen", resourceType: "matches", resourceIdParam: "id" })
  async reopenMatch(@Param("id", ParseIntPipe) id: number, @CurrentUser("id") userId: number) {
    const match = await this.matchesService.reopenMatch(id, userId);
    return { data: match, message: "Pertandingan dibuka kembali (LIVE)." };
  }

  @Post(":id/events/batch")
  @RequirePermissions("matches:record")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(batchEventsSchema))
  async recordEventsBatch(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: BatchEventsInput,
    @CurrentUser("id") userId: number,
  ) {
    const result = await this.matchesService.recordEventsBatch(id, input, userId);
    return { data: result, message: `${input.events.length} event berhasil disinkronisasi.` };
  }

  @Patch(":id/events/:eventId")
  @RequirePermissions("matches:record")
  @Audit({ action: "matches:update_event", resourceType: "match_events", resourceIdParam: "eventId" })
  @UsePipes(new ZodValidationPipe(updateEventSchema))
  async updateEvent(
    @Param("id", ParseIntPipe) id: number,
    @Param("eventId") eventId: string,
    @Body() input: UpdateEventInput,
    @CurrentUser("id") userId: number,
  ) {
    const result = await this.matchesService.updateEvent(id, eventId, input, userId);
    return { data: result, message: "Event berhasil diperbarui." };
  }

  @Delete(":id/events/:eventId")
  @RequirePermissions("matches:record")
  @Audit({ action: "matches:delete_event", resourceType: "match_events", resourceIdParam: "eventId" })
  async deleteEvent(
    @Param("id", ParseIntPipe) id: number,
    @Param("eventId") eventId: string,
    @CurrentUser("id") userId: number,
  ) {
    const result = await this.matchesService.deleteEvent(id, eventId, userId);
    return { data: result, message: "Event berhasil dibatalkan (undo/soft delete)." };
  }

  @Get(":id/events")
  @RequirePermissions("matches:read")
  @UsePipes(new ZodValidationPipe(listEventsQuerySchema, "query"))
  async listEvents(@Param("id", ParseIntPipe) id: number, @Query() query: ListEventsQuery) {
    const result = await this.matchesService.listEvents(id, query.afterSeq);
    return { data: result.items };
  }

  @Get(":id/box-score")
  @RequirePermissions("matches:read")
  async getBoxScore(@Param("id", ParseIntPipe) id: number) {
    const boxScore = await this.matchesService.getBoxScore(id);
    return { data: boxScore };
  }

  @Get(":id/report/export")
  @RequirePermissions("stats:export")
  async exportMatchReport(@Param("id", ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.matchesService.exportMatchReport(id);
    const filename = `laporan-pertandingan-match-${id}.xlsx`;

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}
