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
import { RequirePermissions } from "../../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../../common/guards/permissions.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import {
  type CreateTeamInput,
  type ListTeamsQuery,
  type UpdateTeamInput,
  createTeamSchema,
  listTeamsQuerySchema,
  updateTeamSchema,
} from "./teams.schemas.js";
import { TeamsService } from "./teams.service.js";

@ApiTags("Teams")
@Controller("api/teams")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeamsController {
  constructor(@Inject(TeamsService) private readonly teamsService: TeamsService) {}

  @Get()
  @RequirePermissions("teams:read")
  @UsePipes(new ZodValidationPipe(listTeamsQuerySchema, "query"))
  async listTeams(@Query() query: ListTeamsQuery) {
    return this.teamsService.listTeams(query);
  }

  @Get(":id")
  @RequirePermissions("teams:read")
  async getTeam(@Param("id", ParseIntPipe) id: number) {
    const team = await this.teamsService.getTeam(id);
    return { data: team };
  }

  @Audit({ action: "teams:create", resourceType: "teams" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("teams:create")
  @UsePipes(new ZodValidationPipe(createTeamSchema))
  async createTeam(@Body() input: CreateTeamInput) {
    const created = await this.teamsService.createTeam(input);
    return {
      message: "Tim berhasil dibuat.",
      data: created,
    };
  }

  @Audit({ action: "teams:update", resourceType: "teams", resourceIdParam: "id" })
  @Patch(":id")
  @RequirePermissions("teams:update")
  @UsePipes(new ZodValidationPipe(updateTeamSchema))
  async updateTeam(@Param("id", ParseIntPipe) id: number, @Body() input: UpdateTeamInput) {
    const updated = await this.teamsService.updateTeam(id, input);
    return {
      message: "Tim berhasil diperbarui.",
      data: updated,
    };
  }

  @Audit({ action: "teams:delete", resourceType: "teams", resourceIdParam: "id" })
  @Delete(":id")
  @RequirePermissions("teams:delete")
  async deleteTeam(@Param("id", ParseIntPipe) id: number) {
    await this.teamsService.deleteTeam(id);
    return {
      message: "Tim berhasil dihapus.",
      data: null,
    };
  }
}
