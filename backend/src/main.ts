import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module.js";
import { env } from "./config/env.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase JSON body size limit for base64 image uploads
  app.useBodyParser("json", { limit: "10mb" });

  // HTTP Security Headers (OWASP Best Practices + Swagger UI compatibility)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      frameguard: { action: "deny" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  const allowedOrigins = env.FRONTEND_URL.split(",").map((s) => s.trim());

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.some((pattern) => {
          if (pattern.includes("*")) {
            const regex = new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`);
            return regex.test(origin);
          }
          return false;
        }) ||
        (env.NODE_ENV !== "production" && origin.includes("localhost"));

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use(cookieParser());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Setup Swagger OpenAPI specification
  const config = new DocumentBuilder()
    .setTitle("Korfball Hub API")
    .setDescription("API Presensi Kehadiran & Live Game Statistics Korfball Bantul dengan NestJS & Drizzle ORM")
    .setVersion("1.0.0")
    .addCookieAuth("access_token")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(env.PORT) || 3001;
  await app.listen(port);
  logger.log(`🚀 NestJS Backend server running on http://localhost:${port}`);
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
