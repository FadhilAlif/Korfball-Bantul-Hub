import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "../../common/decorators/public.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { type UploadImageInput, uploadImageSchema } from "./storage.schemas.js";
import { StorageService } from "./storage.service.js";

@ApiTags("Storage")
@Controller("api/storage")
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(uploadImageSchema))
  async uploadImage(@Body() input: UploadImageInput) {
    const result = await this.storageService.uploadImage(input);
    return {
      message: "Foto berhasil diunggah.",
      data: result,
    };
  }

  @Public()
  @Get("view/:folder/:filename")
  async viewObject(@Param("folder") folder: string, @Param("filename") filename: string, @Res() res: Response) {
    if (
      (folder !== "avatars" && folder !== "athletes") ||
      !/^[a-zA-Z0-9._-]+$/.test(filename) ||
      filename.includes("..")
    ) {
      throw new BadRequestException("Path objek tidak valid.");
    }

    const objectKey = `${folder}/${filename}`;

    if (this.storageService.isConfigured) {
      const signedGetUrl = this.storageService.createPresignedUrl("GET", objectKey, 3600);
      try {
        const s3Response = await fetch(signedGetUrl);
        if (s3Response.ok) {
          const contentType = s3Response.headers.get("content-type") || "image/webp";
          const arrayBuffer = await s3Response.arrayBuffer();
          res.setHeader("Content-Type", contentType);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
          res.status(HttpStatus.OK).send(Buffer.from(arrayBuffer));
          return;
        }
      } catch {
        // Fallback to redirect if streaming fetch fails
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3000, stale-while-revalidate=600");
      res.redirect(HttpStatus.FOUND, signedGetUrl);
      return;
    }

    const fallback = this.storageService.getFallbackObject(objectKey);
    if (!fallback) {
      throw new NotFoundException("Objek tidak ditemukan.");
    }

    res.setHeader("Content-Type", fallback.contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(HttpStatus.OK).send(fallback.buffer);
  }
}
