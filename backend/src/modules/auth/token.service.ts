import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export interface AccessTokenPayload {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class TokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as string | number,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return decoded as AccessTokenPayload;
  }

  generateRefreshToken(): string {
    return randomBytes(40).toString("hex");
  }

  hashRefreshToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = env.NODE_ENV === "production";
    const sameSite = env.COOKIE_SAME_SITE ?? (isProd ? "none" : "lax");
    const secure = sameSite === "none" ? true : isProd;

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite,
      secure,
      domain: env.COOKIE_DOMAIN,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite,
      secure,
      domain: env.COOKIE_DOMAIN,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });
  }

  clearAuthCookies(res: Response): void {
    const isProd = env.NODE_ENV === "production";
    const sameSite = env.COOKIE_SAME_SITE ?? (isProd ? "none" : "lax");
    const secure = sameSite === "none" ? true : isProd;

    res.clearCookie("access_token", {
      httpOnly: true,
      sameSite,
      secure,
      domain: env.COOKIE_DOMAIN,
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite,
      secure,
      domain: env.COOKIE_DOMAIN,
      path: "/api/auth/refresh",
    });
  }

  generateVerificationToken(): string {
    return randomBytes(40).toString("hex");
  }

  hashVerificationToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
