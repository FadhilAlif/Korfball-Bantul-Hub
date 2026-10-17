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
  type CreateAthleteInput,
  type LinkAthleteUserInput,
  type ListAthletesQuery,
  type UpdateAthleteInput,
  createAthleteSchema,
  linkAthleteUserSchema,
  listAthletesQuerySchema,
  updateAthleteSchema,
} from "./athletes.schemas.js";
import { AthletesService } from "./athletes.service.js";

@ApiTags("Athletes")
@Controller("api/athletes")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AthletesController {
  constructor(@Inject(AthletesService) private readonly athletesService: AthletesService) {}

  @Get()
  @RequirePermissions("athletes:read")
  @UsePipes(new ZodValidationPipe(listAthletesQuerySchema, "query"))
  async listAthletes(@Query() query: ListAthletesQuery) {
    return this.athletesService.listAthletes(query);
  }

  @Get(":id")
  @RequirePermissions("athletes:read")
  async getAthlete(@Param("id", ParseIntPipe) id: number) {
    const athlete = await this.athletesService.getAthlete(id);
    return { data: athlete };
  }

  @Audit({ action: "athletes:create", resourceType: "athletes" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("athletes:create")
  @UsePipes(new ZodValidationPipe(createAthleteSchema))
  async createAthlete(@Body() input: CreateAthleteInput) {
    const created = await this.athletesService.createAthlete(input);
    return {
      message: "Atlet berhasil dibuat.",
      data: created,
    };
  }

  @Audit({ action: "athletes:update", resourceType: "athletes", resourceIdParam: "id" })
  @Patch(":id")
  @RequirePermissions("athletes:update")
  @UsePipes(new ZodValidationPipe(updateAthleteSchema))
  async updateAthlete(@Param("id", ParseIntPipe) id: number, @Body() input: UpdateAthleteInput) {
    const updated = await this.athletesService.updateAthlete(id, input);
    return {
      message: "Profil atlet berhasil diperbarui.",
      data: updated,
    };
  }

  @Audit({ action: "athletes:delete", resourceType: "athletes", resourceIdParam: "id" })
  @Delete(":id")
  @RequirePermissions("athletes:delete")
  async deleteAthlete(@Param("id", ParseIntPipe) id: number) {
    await this.athletesService.deleteAthlete(id);
    return {
      message: "Atlet berhasil dihapus.",
      data: null,
    };
  }

  @Audit({ action: "athletes:link_user", resourceType: "athletes", resourceIdParam: "id" })
  @Put(":id/user")
  @RequirePermissions("athletes:update")
  @UsePipes(new ZodValidationPipe(linkAthleteUserSchema))
  async linkUser(@Param("id", ParseIntPipe) id: number, @Body() input: LinkAthleteUserInput) {
    const updated = await this.athletesService.linkUser(id, input.userId);
    return {
      message: "Akun user berhasil ditautkan ke atlet.",
      data: updated,
    };
  }

  @Audit({ action: "athletes:unlink_user", resourceType: "athletes", resourceIdParam: "id" })
  @Delete(":id/user")
  @RequirePermissions("athletes:update")
  async unlinkUser(@Param("id", ParseIntPipe) id: number) {
    const updated = await this.athletesService.unlinkUser(id);
    return {
      message: "Tautan akun user berhasil dilepas.",
      data: updated,
    };
  }
}
